from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv, find_dotenv
import sys
import json

sys.path.append('../rag')

from rag_pipeline import RAGPipeline
from data_loader import LoadDocuments
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    token_required,
    validate_email,
    validate_password,
)
from models import SessionLocal, User, Document, ChatHistory, LLMSettings, init_db
from middleware import configure_cors, error_handler


app = Flask(__name__)
configure_cors(app)
error_handler(app)
init_db()


GPT_MODEL_NAME = 'gpt-3.5-turbo'
vector_db_path = "../data/chroma_db/"
load_dotenv(find_dotenv())
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')


ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'doc'}
upload_dir = 'uploads'
vector_store_db = '../data/chroma_db'
global qa_chain
qa_chain = None


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def delete_document_vector_index(filename: str):
    """
    Best-effort cleanup of the Chroma collection for a given document.
    Uses the same naming convention as RAGPipeline / Retriever:
    collection_name = basename(without extension) of the storage filename.
    """
    try:
        import chromadb

        base_name = os.path.splitext(os.path.basename(filename))[0] or "contract"
        client = chromadb.PersistentClient(path=vector_store_db)
        client.delete_collection(name=base_name)
    except Exception:
        # Index cleanup is non-critical; ignore failures
        pass


@app.route('/')
def health_check():
    return jsonify({'status': 'ok'})


# --------------------
# Authentication APIs
# --------------------

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    name = data.get('name') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if not validate_email(email):
        return jsonify({'error': 'Invalid email address'}), 400

    is_valid_password, password_error = validate_password(password)
    if not is_valid_password:
        return jsonify({'error': password_error}), 400

    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            return jsonify({'error': 'Email is already registered'}), 400

        user = User(
            email=email,
            password_hash=hash_password(password),
            name=name or None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token({'user_id': user.id, 'email': user.email})
        return jsonify({'token': token, 'user': user.to_dict()}), 201
    finally:
        db.close()


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({'error': 'Invalid email or password'}), 401

        token = create_access_token({'user_id': user.id, 'email': user.email})
        return jsonify({'token': token, 'user': user.to_dict()}), 200
    finally:
        db.close()


@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': user.to_dict()}), 200
    finally:
        db.close()


@app.route('/api/auth/me', methods=['GET'])
@token_required
def me():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify(user.to_dict()), 200
    finally:
        db.close()


# --------------------
# Account settings APIs
# --------------------


def get_or_create_llm_settings(db, user_id: int) -> LLMSettings:
    settings = db.query(LLMSettings).filter(LLMSettings.user_id == user_id).first()
    if settings is None:
        settings = LLMSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@app.route('/api/account', methods=['GET', 'DELETE'])
@token_required
def account_root():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if request.method == 'GET':
            settings = get_or_create_llm_settings(db, user.id)

            return jsonify({
                'user': user.to_dict(),
                'llm': settings.to_public_dict(),
            }), 200

        # DELETE
        data = request.get_json() or {}
        password = data.get('password') or ''

        if not password:
            return jsonify({'error': 'Password is required to delete account'}), 400

        if not verify_password(password, user.password_hash):
            return jsonify({'error': 'Password is incorrect'}), 400

        # Collect document file paths and storage names before deleting the user
        documents = db.query(Document).filter(Document.user_id == user.id).all()
        file_paths = [d.file_path for d in documents if d.file_path]
        storage_names = [d.filename for d in documents if d.filename]

        # Best-effort cleanup of vector indexes for all documents
        for name in storage_names:
            delete_document_vector_index(name)

        db.delete(user)
        db.commit()

        # Best-effort cleanup of uploaded files
        for path in file_paths:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
            except OSError:
                # Ignore filesystem errors to avoid masking successful account deletion
                pass

        return jsonify({'message': 'Account deleted successfully'}), 200
    finally:
        db.close()


@app.route('/api/account/profile', methods=['PUT'])
@token_required
def update_profile():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    if not validate_email(email):
        return jsonify({'error': 'Invalid email address'}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check for email conflict
        existing = db.query(User).filter(User.email == email, User.id != user.id).first()
        if existing:
            return jsonify({'error': 'Email is already in use'}), 400

        user.name = name or user.name
        user.email = email
        db.commit()
        db.refresh(user)

        return jsonify({'user': user.to_dict()}), 200
    finally:
        db.close()


@app.route('/api/account/password', methods=['PUT'])
@token_required
def update_password():
    data = request.get_json() or {}
    current_password = data.get('current_password') or ''
    new_password = data.get('new_password') or ''

    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password are required'}), 400

    is_valid, message = validate_password(new_password)
    if not is_valid:
        return jsonify({'error': message}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if not verify_password(current_password, user.password_hash):
            return jsonify({'error': 'Current password is incorrect'}), 400

        user.password_hash = hash_password(new_password)
        db.commit()

        return jsonify({'message': 'Password updated successfully'}), 200
    finally:
        db.close()


@app.route('/api/account/llm', methods=['PUT'])
@token_required
def update_llm_settings():
    data = request.get_json() or {}
    provider_raw = data.get('provider')
    provider = (provider_raw or '').lower().strip() or None
    model_name = (data.get('model_name') or '').strip()

    if provider is not None and provider not in {'openai', 'gemini', 'claude', 'groq'}:
        return jsonify({'error': 'Invalid LLM provider'}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        settings = get_or_create_llm_settings(db, user.id)

        # Update API keys if provided (empty string clears)
        for key_name, field in [
            ('openai_api_key', 'openai_api_key'),
            ('gemini_api_key', 'gemini_api_key'),
            ('claude_api_key', 'claude_api_key'),
            ('groq_api_key', 'groq_api_key'),
        ]:
            if key_name in data:
                value = (data.get(key_name) or '').strip()
                setattr(settings, field, value or None)

        # If a provider is supplied, treat this as an update of the default
        if provider is not None:
            settings.preferred_provider = provider
            if model_name:
                settings.model_name = model_name

            # Ensure selected provider has a key configured (or env fallback)
            def resolved_key() -> str | None:
                if provider == 'openai':
                    return settings.openai_api_key or OPENAI_API_KEY
                if provider == 'gemini':
                    return settings.gemini_api_key or GEMINI_API_KEY
                if provider == 'claude':
                    return settings.claude_api_key or ANTHROPIC_API_KEY
                if provider == 'groq':
                    return settings.groq_api_key or GROQ_API_KEY
                return None

            if not resolved_key():
                return jsonify({'error': f'No API key configured for provider {provider.title()}'}), 400

        db.commit()
        db.refresh(settings)

        return jsonify({'llm': settings.to_public_dict()}), 200
    finally:
        db.close()


# --------------------
# Document & Chat APIs
# --------------------

@app.route('/api/documents/upload', methods=['POST'])
@token_required
def upload_document():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type is not allowed'}), 400

    os.makedirs(upload_dir, exist_ok=True)
    original_name = secure_filename(file.filename)

    # Use a simple unique name to avoid collisions
    base_name, ext = os.path.splitext(original_name)
    counter = 1
    storage_name = original_name
    file_path = os.path.join(upload_dir, storage_name)
    while os.path.exists(file_path):
        storage_name = f"{base_name}_{counter}{ext}"
        file_path = os.path.join(upload_dir, storage_name)
        counter += 1

    file.save(file_path)
    file_size = os.path.getsize(file_path)

    db = SessionLocal()
    try:
        document = Document(
            user_id=request.user_id,
            filename=storage_name,
            original_name=original_name,
            file_path=file_path,
            file_size=file_size,
            indexed=False,
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        # Try to build RAG index for this document
        try:
            rag = RAGPipeline(storage_name, vector_store_db)
            # Only build the vector index here (no LLM required)
            rag.pipeline()
            document.indexed = True
            db.commit()
            db.refresh(document)
        except Exception as e:
            # Document record is still valid; just log indexing failure
            print(f"Indexing error for document {document.id}: {e}")

        return jsonify({'document': document.to_dict()}), 201
    finally:
        db.close()


@app.route('/api/documents', methods=['GET'])
@token_required
def list_documents():
    db = SessionLocal()
    try:
        docs = (
            db.query(Document)
            .filter(Document.user_id == request.user_id)
            .order_by(Document.upload_date.desc())
            .all()
        )
        return jsonify({'documents': [d.to_dict() for d in docs]}), 200
    finally:
        db.close()


@app.route('/api/documents/<int:document_id>', methods=['GET', 'DELETE'])
@token_required
def document_detail(document_id):
    db = SessionLocal()
    try:
        document = (
            db.query(Document)
            .filter(
                Document.id == document_id,
                Document.user_id == request.user_id,
            )
            .first()
        )

        if not document:
            return jsonify({'error': 'Document not found'}), 404

        if request.method == 'GET':
            return jsonify(document.to_dict()), 200

        # DELETE
        file_path = document.file_path
        storage_name = document.filename

        # Best-effort cleanup of vector index for this document
        if storage_name:
            delete_document_vector_index(storage_name)

        db.delete(document)
        db.commit()

        # Remove associated file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass

        return jsonify({'message': 'Document deleted'}), 200
    finally:
        db.close()


@app.route('/api/chat/<int:document_id>', methods=['POST'])
@token_required
def chat_with_document(document_id):
    data = request.get_json() or {}
    question = (data.get('question') or '').strip()
    requested_provider = (data.get('provider') or '').strip().lower() or None
    requested_model = (data.get('model_name') or '').strip() or None

    if not question:
        return jsonify({'error': 'Question is required'}), 400

    db = SessionLocal()
    try:
        document = (
            db.query(Document)
            .filter(
                Document.id == document_id,
                Document.user_id == request.user_id,
            )
            .first()
        )
        if not document:
            return jsonify({'error': 'Document not found'}), 404

        # Resolve LLM settings for this user
        settings = get_or_create_llm_settings(db, request.user_id)

        provider = (requested_provider or settings.preferred_provider or 'openai').lower()

        # Basic validation of provider
        if provider not in {'openai', 'gemini', 'claude', 'groq'}:
            return jsonify({'error': 'Unsupported LLM provider'}), 400

        # Resolve model name, falling back to a sensible default per provider
        if requested_model:
            model_name = requested_model
        elif settings.model_name:
            model_name = settings.model_name
        else:
            if provider == 'openai':
                model_name = 'gpt-4o-mini'
            elif provider == 'gemini':
                model_name = 'gemini-1.5-pro-latest'
            elif provider == 'claude':
                model_name = 'claude-3-5-sonnet-20241022'
            else:  # groq
                model_name = 'llama3-70b-8192'

        # Resolve API key by provider (user-specific first, then env)
        if provider == 'openai':
            api_key = settings.openai_api_key or OPENAI_API_KEY
        elif provider == 'gemini':
            api_key = settings.gemini_api_key or GEMINI_API_KEY
        elif provider == 'claude':
            api_key = settings.claude_api_key or ANTHROPIC_API_KEY
        elif provider == 'groq':
            api_key = settings.groq_api_key or GROQ_API_KEY
        else:
            return jsonify({'error': 'Unsupported LLM provider'}), 400

        if not api_key:
            return jsonify({'error': f'No API key configured for provider {provider.title()}'}), 400

        try:
            rag = RAGPipeline(
                document.filename,
                vector_store_db,
                llm_provider=provider,
                llm_model=model_name,
                llm_api_key=api_key,
            )
            chain = rag.qa_chain()
            document.indexed = True
            db.commit()
        except Exception as e:
            print(f"Error building QA chain for document {document_id}: {e}")
            return jsonify({'error': 'Failed to analyze document'}), 500

        try:
            response = chain.invoke({'input': question})
            if isinstance(response, dict):
                answer = response.get('answer')
                context_docs = response.get('context') or []
            else:
                answer = str(response)
                context_docs = []
        except Exception as e:
            print(f"Error during chat invocation: {e}")
            return jsonify({'error': 'Error generating answer'}), 500

        # Normalize answer to string
        if not isinstance(answer, str):
            answer = str(answer)

        # Serialize retrieval context (for highlighting in UI)
        contexts = []
        for idx, doc_obj in enumerate(context_docs):
            try:
                page_content = getattr(doc_obj, "page_content", None)
                metadata = getattr(doc_obj, "metadata", {}) or {}
                if not isinstance(metadata, dict):
                    metadata = {}
                if page_content:
                    contexts.append(
                        {
                            "id": idx,
                            "text": page_content,
                            "metadata": metadata,
                        }
                    )
            except Exception:
                continue

        chat_entry = ChatHistory(
            user_id=request.user_id,
            document_id=document.id,
            question=question,
            answer=answer,
            context_json=json.dumps(contexts) if contexts else None,
        )
        db.add(chat_entry)
        db.commit()
        db.refresh(chat_entry)

        return jsonify({
            'chat_id': chat_entry.id,
            'answer': chat_entry.answer,
            'created_at': chat_entry.created_at.isoformat() if chat_entry.created_at else None,
            'contexts': contexts,
        }), 200
    finally:
        db.close()


@app.route('/api/chat/history/<int:document_id>', methods=['GET'])
@token_required
def chat_history(document_id):
    db = SessionLocal()
    try:
        document = (
            db.query(Document)
            .filter(
                Document.id == document_id,
                Document.user_id == request.user_id,
            )
            .first()
        )
        if not document:
            return jsonify({'error': 'Document not found'}), 404

        history_rows = (
            db.query(ChatHistory)
            .filter(
                ChatHistory.document_id == document_id,
                ChatHistory.user_id == request.user_id,
            )
            .order_by(ChatHistory.created_at.asc())
            .all()
        )

        history = []
        for h in history_rows:
            try:
                contexts = json.loads(h.context_json) if h.context_json else None
            except Exception:
                contexts = None

            history.append(
                {
                    'id': h.id,
                    'question': h.question,
                    'answer': h.answer,
                    'created_at': h.created_at.isoformat() if h.created_at else None,
                    'contexts': contexts,
                }
            )

        return jsonify({'history': history}), 200
    finally:
        db.close()


@app.route('/api/documents/<int:document_id>/chunks', methods=['GET'])
@token_required
def document_chunks(document_id):
    """
    Return a structured, text-only view of the indexed document as ordered chunks.
    These chunks are produced with the same splitter config used by the RAG retriever,
    so they can be matched to retrieval contexts for highlighting in the UI.
    """
    db = SessionLocal()
    try:
        document = (
            db.query(Document)
            .filter(
                Document.id == document_id,
                Document.user_id == request.user_id,
            )
            .first()
        )
        if not document:
            return jsonify({'error': 'Document not found'}), 404

        try:
            loader = LoadDocuments(document.filename)
            docs = loader.load_document()
        except Exception as e:
            print(f"Error loading document content for chunks (document {document_id}): {e}")
            return jsonify({'error': 'Failed to load document content'}), 500

        try:
            from langchain_text_splitters import RecursiveCharacterTextSplitter

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1200,
                chunk_overlap=150,
            )
            splits = splitter.split_documents(docs)
        except Exception as e:
            print(f"Error splitting document into chunks (document {document_id}): {e}")
            return jsonify({'error': 'Failed to split document into chunks'}), 500

        chunks = []
        for idx, doc_obj in enumerate(splits):
            try:
                text = getattr(doc_obj, "page_content", "") or ""
                metadata = getattr(doc_obj, "metadata", {}) or {}
                if not isinstance(metadata, dict):
                    metadata = {}
                chunks.append(
                    {
                        "id": idx,
                        "text": text,
                        "metadata": metadata,
                    }
                )
            except Exception:
                continue

        return jsonify({'chunks': chunks}), 200
    finally:
        db.close()


# --------------------
# Legacy RAG endpoints
# --------------------

@app.route('/upload_file', methods=['POST'])
def upload_file():
    global qa_chain

    if 'file' not in request.files:
        resp = jsonify({
            "message": 'No file part in the request',
            "status": 'failed'
        })
        resp.status_code = 400
        return resp

    file = request.files['file']
    error = {}
    success = False
    if file.filename == '':
        error['message'] = 'No selected file'
        error['status'] = 'failed'
        resp = jsonify(error)
        resp.status_code = 500
        return resp

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        os.makedirs(upload_dir, exist_ok=True)
        print(filename)
        file.save(os.path.join(upload_dir, filename))
        rag = RAGPipeline(filename, vector_store_db)
        qa_chain = rag.qa_chain()

        success = True
    else:
        resp = jsonify({
            "message": 'File type is not allowed',
            "status": 'failed'
        })
        return resp

    if success and error:
        error['message'] = 'File(s) successfully uploaded'
        error['status'] = 'failed'
        resp = jsonify(error)
        resp.status_code = 500
        return resp

    if success:
        resp = jsonify({'message': 'File uploaded successfully', 'status_code': '201'})
        return resp
    else:
        resp = jsonify(error)
        resp.status_code = 500
        return resp


@app.route('/ask_ai', methods=['POST'])
def query_endpoint():
    try:
        data = request.get_json()
        user_question = data.get('prompt')
        print("question", user_question)
        response_node = qa_chain.invoke({'input': user_question})
        answer = response_node.get('answer') if isinstance(response_node, dict) else str(response_node)
        return jsonify({'result': answer})

    except Exception as e:
        return jsonify({'error': f"An error occurred: {e}"})


if __name__ == '__main__':
    app.run(debug=True, port="8080")

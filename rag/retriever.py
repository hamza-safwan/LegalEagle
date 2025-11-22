from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma


class Retriever:
    def __init__(self, documents, embedding, persist_directory: str, collection_name: str | None = None):
        self.documents = documents
        self.embedding = embedding
        self.persist_directory = persist_directory
        self.collection_name = collection_name or "contract"

    def get_retriever(self):
        """
        Build or load a Chroma vector store for the given document and
        return an advanced retriever (MMR search, persisted per document).
        """
        try:
            # Use RecursiveCharacterTextSplitter to chunk documents
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1200,
                chunk_overlap=150,
            )
            splits = text_splitter.split_documents(self.documents)

            # Try to load an existing persisted collection for this document
            try:
                vectorstore = Chroma(
                    embedding_function=self.embedding,
                    persist_directory=self.persist_directory,
                    collection_name=self.collection_name,
                )

                # If the collection is empty, fall back to building it
                if vectorstore._collection.count() == 0:
                    raise ValueError("Empty vector store, rebuilding index")
            except Exception:
                vectorstore = Chroma.from_documents(
                    documents=splits,
                    embedding=self.embedding,
                    persist_directory=self.persist_directory,
                    collection_name=self.collection_name,
                )

            # Use MMR for more diverse, robust retrieval
            retriever = vectorstore.as_retriever(
                search_type="mmr",
                search_kwargs={"k": 6, "fetch_k": 20},
            )

            print("Retriever created successfully!")
            return retriever
        except Exception as e:
            print(f"Retriever error: {e}")
            return None

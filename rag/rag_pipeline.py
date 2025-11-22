from data_loader import LoadDocuments
from embedding import EmbeddingsCreator
from retriever import Retriever
from chat_model import ChatModel
from conversation_chain import ConversationChain
from dotenv import load_dotenv, find_dotenv

load_dotenv()
load_dotenv(find_dotenv())


class RAGPipeline:
    def __init__(
        self,
        uploaded_file: str,
        vector_db_path: str,
        llm_provider: str = "openai",
        llm_model: str = "gpt-4o-mini",
        llm_api_key: str | None = None,
    ):
        self.uploaded_file = uploaded_file
        self.vector_db_path = vector_db_path
        self.llm_provider = llm_provider
        self.llm_model = llm_model
        self.llm_api_key = llm_api_key

    def pipeline(self):
        loader = LoadDocuments(self.uploaded_file)
        documents = loader.load_document()
        embedding = EmbeddingsCreator().create_embeddings()
        # Use a per-document collection name so each document has its own index
        from os import path

        collection_name = path.splitext(path.basename(self.uploaded_file))[0] or "contract"
        retriever = Retriever(
            documents,
            embedding,
            self.vector_db_path,
            collection_name=collection_name,
        ).get_retriever()
        print("Retriever Created Successfully!")
        return retriever

    def qa_chain(self):
        chat_model = ChatModel(
            provider=self.llm_provider,
            model_name=self.llm_model,
            api_key=self.llm_api_key,
        ).initialize_chat_model()
        retriever = self.pipeline()
        conversation_chain = ConversationChain().create_retrieval_qa_chain(chat_model, retriever)
        return conversation_chain


        
        
    

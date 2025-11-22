import os

from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings


class EmbeddingsCreator:
    def __init__(self):
        # Optional explicit override: "openai" or "huggingface"
        self.provider = (os.getenv("LEGAL_EAGLE_EMBEDDINGS_PROVIDER") or "").strip().lower() or None

    def create_embeddings(self):
        """
        Creates embeddings for the RAG pipeline.

        Priority:
        - If LEGAL_EAGLE_EMBEDDINGS_PROVIDER is set, respect it.
        - Otherwise, if OPENAI_API_KEY is present, use OpenAI embeddings.
        - Otherwise, fall back to a fast HuggingFace sentence-transformer.
        """
        provider = self.provider

        if provider not in {"openai", "huggingface"}:
            provider = "openai" if os.getenv("OPENAI_API_KEY") else "huggingface"

        if provider == "openai":
            return OpenAIEmbeddings()

        # HuggingFace sentence-transformers (local / HF Hub)
        model_name = os.getenv(
            "LEGAL_EAGLE_HF_EMBEDDING_MODEL",
            "sentence-transformers/all-MiniLM-L6-v2",
        )
        return HuggingFaceEmbeddings(model_name=model_name)

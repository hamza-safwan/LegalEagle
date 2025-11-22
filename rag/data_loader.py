from langchain_community.document_loaders import (
    PyPDFLoader,
    PyMuPDFLoader,
    UnstructuredWordDocumentLoader,
    TextLoader,
)

import os


class LoadDocuments:
    def __init__(self, uploaded_file: str, uploads_dir: str = "uploads"):
        """
        uploaded_file is the storage filename (as saved on disk).
        """
        self.uploads_dir = uploads_dir
        self.uploaded_file = uploaded_file

    def _resolve_path(self) -> str:
        if os.path.isabs(self.uploaded_file):
            return self.uploaded_file
        return os.path.join(self.uploads_dir, self.uploaded_file)

    def load_document(self):
        """Load a single uploaded document into LangChain Document objects."""
        file_path = self._resolve_path()

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Uploaded file not found: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            # Try PyPDF first, fall back to PyMuPDF for complex PDFs
            try:
                loader = PyPDFLoader(file_path)
                return loader.load()
            except Exception:
                loader = PyMuPDFLoader(file_path)
                return loader.load()

        if ext in {".doc", ".docx"}:
            loader = UnstructuredWordDocumentLoader(file_path)
            return loader.load()

        if ext == ".txt":
            loader = TextLoader(file_path)
            return loader.load()

        raise ValueError(f"Unsupported file type for RAG pipeline: {ext}")
        

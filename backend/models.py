from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
import json

# Database setup
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'legal_eagle.db')
DATABASE_URL = f'sqlite:///{DATABASE_PATH}'

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Models
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    documents = relationship('Document', back_populates='user', cascade='all, delete-orphan')
    chat_history = relationship('ChatHistory', back_populates='user', cascade='all, delete-orphan')
    llm_settings = relationship('LLMSettings', back_populates='user', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Document(Base):
    __tablename__ = 'documents'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    filename = Column(String(255), nullable=False)  # Storage filename (unique)
    original_name = Column(String(255), nullable=False)  # User's original filename
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    upload_date = Column(DateTime, default=datetime.utcnow)
    indexed = Column(Boolean, default=False)

    # Relationships
    user = relationship('User', back_populates='documents')
    chat_history = relationship('ChatHistory', back_populates='document', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'original_name': self.original_name,
            'file_size': self.file_size,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'indexed': self.indexed
        }


class ChatHistory(Base):
    __tablename__ = 'chat_history'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    document_id = Column(Integer, ForeignKey('documents.id'), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    # JSON-encoded list of context chunks used to answer the question
    context_json = Column(Text)

    # Relationships
    user = relationship('User', back_populates='chat_history')
    document = relationship('Document', back_populates='chat_history')

    def to_dict(self):
        try:
            context = json.loads(self.context_json) if self.context_json else None
        except Exception:
            context = None

        return {
            'id': self.id,
            'user_id': self.user_id,
            'document_id': self.document_id,
            'question': self.question,
            'answer': self.answer,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'context': context,
        }


class LLMSettings(Base):
    __tablename__ = 'llm_settings'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)
    preferred_provider = Column(String(50), default='openai')  # 'openai', 'gemini', 'claude', 'groq'
    model_name = Column(String(255), default='gpt-4o-mini')
    openai_api_key = Column(String(255))
    gemini_api_key = Column(String(255))
    claude_api_key = Column(String(255))
    groq_api_key = Column(String(255))

    user = relationship('User', back_populates='llm_settings')

    def to_public_dict(self):
        return {
            'preferred_provider': self.preferred_provider or 'openai',
            'model_name': self.model_name or 'gpt-4o-mini',
            'openai_configured': bool(self.openai_api_key),
            'gemini_configured': bool(self.gemini_api_key),
            'claude_configured': bool(self.claude_api_key),
            'groq_configured': bool(self.groq_api_key),
        }


# Create all tables
def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

    # Lightweight migration for new columns on existing databases
    inspector = inspect(engine)

    # LLM settings: add Groq API key column if missing
    llm_columns = {col['name'] for col in inspector.get_columns('llm_settings')}
    with engine.begin() as conn:
        if 'groq_api_key' not in llm_columns:
            conn.execute(text('ALTER TABLE llm_settings ADD COLUMN groq_api_key VARCHAR(255)'))

        # Chat history: add context_json column if missing
        chat_columns = {col['name'] for col in inspector.get_columns('chat_history')}
        if 'context_json' not in chat_columns:
            conn.execute(text('ALTER TABLE chat_history ADD COLUMN context_json TEXT'))

    print("Database initialized successfully!")


# Database session dependency
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == '__main__':
    init_db()

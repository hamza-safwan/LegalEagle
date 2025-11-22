# LegalEagle - Setup Guide

## Prerequisites

- Python 3.8+ 
- Node.js 16+ and npm
- OpenAI API key

## Backend Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r ../requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this
OPENAI_API_KEY=your-openai-api-key-here
COHERE_API_KEY=your-cohere-api-key-if-needed
```

### 3. Initialize Database

```bash
python models.py
```

This will create the `legal_eagle.db` SQLite database.

### 4. Start Backend Server

```bash
python server.py
```

The API will run on `http://127.0.0.1:8080`

## Frontend Setup

### 1. Install Node Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080/api
```

### 3. Start Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3000`

## First Time Usage

1. Navigate to `http://localhost:3000`
2. You'll be redirected to the landing page
3. Click "Get Started" or "Sign Up"
4. Create your account
5. Upload a legal document (PDF, DOCX, TXT)
6. Start chatting with your document!

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/verify` - Verify token
- `GET /api/auth/me` - Get current user profile

### Documents
- `POST /api/documents/upload` - Upload document (requires auth)
- `GET /api/documents` - Get all user documents
- `GET /api/documents/:id` - Get specific document
- `DELETE /api/documents/:id` - Delete document

### Chat
- `POST /api/chat/:documentId` - Send question
- `GET /api/chat/history/:documentId` - Get chat history

## Troubleshooting

### Backend Issues

**Database not created:**
```bash
cd backend
python models.py
```

**Import errors:**
```bash
pip install -r requirements.txt
```

**CORS errors:**
Make sure backend is running on port 8080 and frontend on port 3000.

### Frontend Issues

**Module not found:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Environment variables not loading:**
Make sure `.env.local` exists in the frontend directory and restart the dev server.

## Features

✅ Secure JWT authentication  
✅ Beautiful modern UI with glassmorphism  
✅ Document upload and management  
✅ Real-time chat with legal documents  
✅ Markdown rendering in responses  
✅ Chat history persistence  
✅ Responsive design  
✅ Dark mode optimized  

## Tech Stack

**Backend:**
- Flask (REST API)
- SQLAlchemy (ORM)
- SQLite (Database)
- JWT (Authentication)
- LangChain (RAG pipeline)
- OpenAI GPT (LLM)
- ChromaDB (Vector store)

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand (State management)
- Heroicons
- React Hot Toast

## Production Deployment

For production, consider:
1. Switching from SQLite to PostgreSQL
2. Using environment-specific API URLs
3. Implementing rate limiting
4. Adding comprehensive error logging
5. Setting up cloud file storage (S3, GCS)
6. Implementing proper session management
7. Adding SSL/TLS certificates

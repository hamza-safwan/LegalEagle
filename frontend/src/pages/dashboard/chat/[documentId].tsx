import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { accountAPI, chatAPI, documentsAPI } from '@/lib/api';
import {
    DocumentTextIcon,
    ArrowLeftIcon,
    PaperAirplaneIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

type Provider = 'openai' | 'gemini' | 'claude' | 'groq';

interface LLMSettingsResponse {
    preferred_provider: Provider;
    model_name: string;
    openai_configured: boolean;
    gemini_configured: boolean;
    claude_configured: boolean;
    groq_configured: boolean;
}

interface ChatMessage {
    id: number;
    question: string;
    answer: string;
    created_at: string;
}

interface Document {
    id: number;
    original_name: string;
    indexed: boolean;
}

interface DocumentChunk {
    id: number | string;
    text: string;
    metadata: Record<string, any>;
}

const PROVIDER_LABELS: Record<Provider, string> = {
    openai: 'OpenAI',
    gemini: 'Gemini',
    claude: 'Claude',
    groq: 'Groq Cloud',
};

const PROVIDER_MODELS: Record<Provider, { id: string; label: string }[]> = {
    openai: [
        { id: 'gpt-4o-mini', label: 'gpt-4o-mini (fast, cheap)' },
        { id: 'gpt-4o', label: 'gpt-4o (general-purpose)' },
    ],
    gemini: [
        { id: 'gemini-1.5-flash-latest', label: 'gemini-1.5-flash-latest (fast)' },
        { id: 'gemini-1.5-pro-latest', label: 'gemini-1.5-pro-latest (high quality)' },
    ],
    claude: [
        { id: 'claude-3-5-sonnet-20241022', label: 'claude-3-5-sonnet-20241022' },
        { id: 'claude-3-opus-20240229', label: 'claude-3-opus-20240229' },
    ],
    groq: [
        { id: 'llama3-70b-8192', label: 'llama3-70b-8192 (high quality)' },
        { id: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant (fast, cheap)' },
    ],
};

const getDefaultModelForProvider = (provider: Provider): string => {
    const models = PROVIDER_MODELS[provider];
    return models.length > 0 ? models[0].id : '';
};

const ChatPage: React.FC = () => {
    const router = useRouter();
    const { documentId } = router.query;

    const [document, setDocument] = useState<Document | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [llmSettings, setLlmSettings] = useState<LLMSettingsResponse | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<Provider>('openai');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [docChunks, setDocChunks] = useState<DocumentChunk[]>([]);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const getNumericDocumentId = (): number | null => {
        if (!documentId) return null;
        if (Array.isArray(documentId)) {
            return Number(documentId[0]);
        }
        return Number(documentId);
    };

    useEffect(() => {
        const id = getNumericDocumentId();
        if (!id) return;

        const load = async () => {
            try {
                const [docRes, historyRes, accountRes, chunksRes] = await Promise.all([
                    documentsAPI.getById(id),
                    chatAPI.getHistory(id),
                    accountAPI.get(),
                    documentsAPI.getChunks(id),
                ]);
                setDocument(docRes.data);
                setChatHistory(historyRes.data.history);
                setDocChunks(chunksRes.data.chunks || []);

                const llm = accountRes.data.llm as LLMSettingsResponse;
                setLlmSettings(llm);
                const provider = (llm.preferred_provider || 'openai') as Provider;
                setSelectedProvider(provider);
                const modelFromSettings = (llm.model_name || '').trim();
                const fallbackModel = getDefaultModelForProvider(provider);
                setSelectedModel(modelFromSettings || fallbackModel);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
                toast.error('Failed to load chat or document data');
                router.push('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        setIsLoading(true);
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documentId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, isSending]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentQuestion.trim() || isSending) return;

        const id = getNumericDocumentId();
        if (!id) return;

        const question = currentQuestion.trim();
        setCurrentQuestion('');
        setIsSending(true);

        try {
            const response = await chatAPI.sendMessage(id, question, {
                provider: selectedProvider,
                model_name: selectedModel || undefined,
            });

            const newMessage: ChatMessage = {
                id: response.data.chat_id,
                question,
                answer: response.data.answer,
                created_at: response.data.created_at,
            };

            setChatHistory((prev) => [...prev, newMessage]);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to send message');
            setCurrentQuestion(question);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex flex-col">
                {/* Header */}
                <div className="glass-dark border-b border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="text-gray-300 hover:text-white transition"
                                >
                                    <ArrowLeftIcon className="h-6 w-6" />
                                </button>

                                <DocumentTextIcon className="h-6 w-6 text-primary-400" />
                                <div>
                                    <h2 className="text-lg font-semibold text-white truncate max-w-md">
                                        {document?.original_name || 'Loading...'}
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        {document?.indexed ? 'Ready for questions' : 'Indexing...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0">
                    <div className="h-full overflow-hidden flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-4 py-6 gap-6">
                        {/* Chat panel */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="glass-dark p-8 rounded-2xl text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto" />
                                            <p className="text-gray-400 mt-4">Loading chat history...</p>
                                        </div>
                                    </div>
                                ) : chatHistory.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center max-w-lg">
                                            <SparklesIcon className="h-16 w-16 text-primary-400 mx-auto mb-4" />
                                            <h3 className="text-2xl font-semibold text-white mb-2">
                                                Ask your first question
                                            </h3>
                                            <p className="text-gray-400">
                                                I&apos;m ready to help you understand your legal document. Ask me
                                                anything about clauses, terms, obligations, or risks.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    chatHistory.map((message) => (
                                        <div key={message.id} className="glass-dark rounded-2xl p-4 space-y-3">
                                            <div className="text-sm text-primary-100 font-semibold">
                                                {message.question}
                                            </div>
                                            <div className="prose prose-invert max-w-none text-sm">
                                                <ReactMarkdown>{message.answer}</ReactMarkdown>
                                            </div>
                                            <p className="text-[11px] text-gray-500">
                                                {new Date(message.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                )}

                                {isSending && (
                                    <div className="flex items-start space-x-3">
                                        <SparklesIcon className="h-6 w-6 text-accent-400 flex-shrink-0" />
                                        <div className="glass-dark rounded-2xl px-4 py-3 flex space-x-2">
                                            <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" />
                                            <div
                                                className="w-2 h-2 bg-accent-400 rounded-full animate-bounce"
                                                style={{ animationDelay: '0.1s' }}
                                            />
                                            <div
                                                className="w-2 h-2 bg-accent-400 rounded-full animate-bounce"
                                                style={{ animationDelay: '0.2s' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Controls */}
                            <form
                                onSubmit={handleSendMessage}
                                className="glass-dark rounded-2xl p-4 space-y-4 mt-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1">
                                            Model Provider
                                        </label>
                                        <select
                                            value={selectedProvider}
                                            onChange={(e) => {
                                                const provider = e.target.value as Provider;
                                                setSelectedProvider(provider);
                                                setSelectedModel((current) => {
                                                    const models = PROVIDER_MODELS[provider];
                                                    if (models.find((m) => m.id === current)) {
                                                        return current;
                                                    }
                                                    return getDefaultModelForProvider(provider);
                                                });
                                            }}
                                            className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            {(['openai', 'gemini', 'claude', 'groq'] as Provider[]).map(
                                                (provider) => (
                                                    <option key={provider} value={provider}>
                                                        {PROVIDER_LABELS[provider]}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        {llmSettings && (
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                {(() => {
                                                    const configured =
                                                        selectedProvider === 'openai'
                                                            ? llmSettings.openai_configured
                                                            : selectedProvider === 'gemini'
                                                            ? llmSettings.gemini_configured
                                                            : selectedProvider === 'claude'
                                                            ? llmSettings.claude_configured
                                                            : llmSettings.groq_configured;
                                                    return configured
                                                        ? 'API key configured in Account settings.'
                                                        : 'No API key configured yet for this provider.';
                                                })()}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1">
                                            Model
                                        </label>
                                        <select
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            {PROVIDER_MODELS[selectedProvider].map((model) => (
                                                <option key={model.id} value={model.id}>
                                                    {model.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <input
                                        type="text"
                                        value={currentQuestion}
                                        onChange={(e) => setCurrentQuestion(e.target.value)}
                                        placeholder="Ask a question about your document..."
                                        disabled={!document?.indexed || isSending}
                                        className="flex-1 bg-gray-800 bg-opacity-50 text-white placeholder-gray-400 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            !currentQuestion.trim() || !document?.indexed || isSending
                                        }
                                        className="bg-gradient-law p-4 rounded-xl text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PaperAirplaneIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                {!document?.indexed && (
                                    <p className="text-yellow-400 text-sm mt-2">
                                        Document is being indexed. Please wait...
                                    </p>
                                )}
                            </form>
                        </div>

                        {/* Document panel */}
                        <div className="mt-6 lg:mt-0 lg:w-[40%] flex flex-col min-h-0">
                            <div className="flex-1 glass-dark rounded-2xl p-4 border border-white/10 flex flex-col">
                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold text-slate-100">
                                        Indexed document
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        These are chunks of your document that the assistant can use
                                        to answer questions.
                                    </p>
                                </div>
                                <div className="mt-2 flex-1 min-h-0 overflow-y-auto space-y-3 pr-2 text-sm">
                                    {docChunks.length === 0 ? (
                                        <p className="text-slate-500 text-xs">
                                            Document content will appear here after indexing.
                                        </p>
                                    ) : (
                                        docChunks.map((chunk) => (
                                            <div
                                                key={chunk.id}
                                                className="rounded-xl border border-slate-700/60 px-3 py-2 bg-slate-950/80"
                                            >
                                                <p className="whitespace-pre-wrap text-slate-100/90 text-xs">
                                                    {chunk.text}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default ChatPage;

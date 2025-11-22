import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle responses and errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    signup: (data: { email: string; password: string; name?: string }) =>
        api.post('/auth/signup', data),

    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),

    verify: () =>
        api.get('/auth/verify'),

    getProfile: () =>
        api.get('/auth/me'),
};

// Account API
export const accountAPI = {
    get: () =>
        api.get('/account'),

    updateProfile: (data: { name: string; email: string }) =>
        api.put('/account/profile', data),

    updatePassword: (data: { current_password: string; new_password: string }) =>
        api.put('/account/password', data),

    updateLLM: (data: {
        provider?: 'openai' | 'gemini' | 'claude' | 'groq';
        model_name?: string;
        openai_api_key?: string;
        gemini_api_key?: string;
        claude_api_key?: string;
        groq_api_key?: string;
    }) =>
        api.put('/account/llm', data),

    deleteAccount: (data: { password: string }) =>
        api.delete('/account', { data }),
};

// Documents API
export const documentsAPI = {
    upload: (formData: FormData) =>
        api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),

    getAll: () =>
        api.get('/documents'),

    getById: (id: number) =>
        api.get(`/documents/${id}`),

    getChunks: (id: number) =>
        api.get(`/documents/${id}/chunks`),

    delete: (id: number) =>
        api.delete(`/documents/${id}`),
};

// Chat API
export const chatAPI = {
    sendMessage: (
        documentId: number,
        question: string,
        options?: { provider?: 'openai' | 'gemini' | 'claude' | 'groq'; model_name?: string },
    ) =>
        api.post(`/chat/${documentId}`, {
            question,
            provider: options?.provider,
            model_name: options?.model_name,
        }),

    getHistory: (documentId: number) =>
        api.get(`/chat/history/${documentId}`),
};

import { create } from 'zustand';
import { authAPI } from '@/lib/api';

interface User {
    id: number;
    email: string;
    name?: string;
    created_at: string;
    stats?: {
        documents: number;
        chats: number;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => void;
    verifyToken: () => Promise<void>;
    loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,

    login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const response = await authAPI.login({ email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            set({
                token,
                user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error: any) {
            set({ isLoading: false });
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    },

    signup: async (email: string, password: string, name?: string) => {
        set({ isLoading: true });
        try {
            const response = await authAPI.signup({ email, password, name });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            set({
                token,
                user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error: any) {
            set({ isLoading: false });
            throw new Error(error.response?.data?.error || 'Signup failed');
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
            user: null,
            token: null,
            isAuthenticated: false
        });
    },

    verifyToken: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
        }

        set({ isLoading: true });
        try {
            const response = await authAPI.verify();
            const { user } = response.data;

            set({
                token,
                user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false
            });
        }
    },

    loadUser: async () => {
        set({ isLoading: true });
        try {
            const response = await authAPI.getProfile();
            set({
                user: response.data,
                isLoading: false
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },
}));

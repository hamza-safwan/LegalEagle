import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainNavbar from '@/components/layout/MainNavbar';
import { accountAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { KeyIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type Provider = 'openai' | 'gemini' | 'claude' | 'groq';

interface LLMSettingsResponse {
    preferred_provider: Provider;
    model_name: string;
    openai_configured: boolean;
    gemini_configured: boolean;
    claude_configured: boolean;
    groq_configured: boolean;
}

const AccountPage: React.FC = () => {
    const router = useRouter();
    const { user, loadUser, logout } = useAuthStore();

    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [llmSettings, setLlmSettings] = useState<LLMSettingsResponse | null>(null);
    const [openaiConfigured, setOpenaiConfigured] = useState(false);
    const [geminiConfigured, setGeminiConfigured] = useState(false);
    const [claudeConfigured, setClaudeConfigured] = useState(false);
    const [groqConfigured, setGroqConfigured] = useState(false);

    const [llmKeys, setLlmKeys] = useState({
        openai_api_key: '',
        gemini_api_key: '',
        claude_api_key: '',
        groq_api_key: '',
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isSavingLlm, setIsSavingLlm] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accountRes] = await Promise.all([accountAPI.get()]);
                const accountData = accountRes.data as { user: any; llm: LLMSettingsResponse };

                setProfileForm({
                    name: accountData.user.name || '',
                    email: accountData.user.email || '',
                });

                setLlmSettings(accountData.llm);
                setOpenaiConfigured(!!accountData.llm.openai_configured);
                setGeminiConfigured(!!accountData.llm.gemini_configured);
                setClaudeConfigured(!!accountData.llm.claude_configured);
                setGroqConfigured(!!accountData.llm.groq_configured);

                // Refresh global user store
                await loadUser();
            } catch (error) {
                toast.error('Failed to load account settings');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [loadUser]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await accountAPI.updateProfile(profileForm);
            toast.success('Profile updated');
            await loadUser();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error('New password and confirmation do not match');
            return;
        }

        setIsSavingPassword(true);
        try {
            await accountAPI.updatePassword({
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
            });
            toast.success('Password updated');
            setPasswordForm({
                current_password: '',
                new_password: '',
                confirm_password: '',
            });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update password');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleLlmSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingLlm(true);
        try {
            const payload: any = {
            };

            if (llmKeys.openai_api_key !== '') payload.openai_api_key = llmKeys.openai_api_key;
            if (llmKeys.gemini_api_key !== '') payload.gemini_api_key = llmKeys.gemini_api_key;
            if (llmKeys.claude_api_key !== '') payload.claude_api_key = llmKeys.claude_api_key;
            if (llmKeys.groq_api_key !== '') payload.groq_api_key = llmKeys.groq_api_key;

            const res = await accountAPI.updateLLM(payload);
            const llm = res.data.llm as LLMSettingsResponse;
            setLlmSettings(llm);
            setOpenaiConfigured(!!llm.openai_configured);
            setGeminiConfigured(!!llm.gemini_configured);
            setClaudeConfigured(!!llm.claude_configured);
            setGroqConfigured(!!llm.groq_configured);

            setLlmKeys({
                openai_api_key: '',
                gemini_api_key: '',
                claude_api_key: '',
                groq_api_key: '',
            });

            toast.success('LLM settings updated');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update LLM settings');
        } finally {
            setIsSavingLlm(false);
        }
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        if (deleteConfirm !== 'DELETE') {
            toast.error('Please type DELETE in all caps to confirm.');
            return;
        }

        if (!deletePassword) {
            toast.error('Please enter your password to confirm.');
            return;
        }

        setIsDeletingAccount(true);
        try {
            await accountAPI.deleteAccount({ password: deletePassword });
            toast.success('Your account has been deleted.');
            logout();
            router.push('/landing');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete account');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    if (isLoading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex items-center justify-center">
                    <div className="glass-dark p-8 rounded-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto"></div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950">
                <MainNavbar showAuthLinks={false} />

                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
                                Account Settings
                            </h1>
                            <p className="text-gray-400">
                                Manage your profile, security, and preferred LLM provider.
                            </p>
                        </div>
                        <div className="glass-dark rounded-2xl px-4 py-3 flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-law flex items-center justify-center shadow-lg border border-white/10">
                                <UserCircleIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-200 font-medium">{user?.name || 'LegalEagle User'}</span>
                                <span className="text-xs text-gray-400 truncate max-w-[180px]">{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Profile & Password */}
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-dark rounded-2xl p-6 border border-white/10"
                            >
                                <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSavingProfile}
                                            className="bg-gradient-law px-4 py-2 rounded-lg text-sm font-semibold text-white btn-hover-lift disabled:opacity-50"
                                        >
                                            {isSavingProfile ? 'Saving...' : 'Save Profile'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="glass-dark rounded-2xl p-6 border border-white/10"
                            >
                                <h2 className="text-lg font-semibold text-white mb-4">Password</h2>
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.current_password}
                                            onChange={(e) =>
                                                setPasswordForm({ ...passwordForm, current_password: e.target.value })
                                            }
                                            className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.new_password}
                                                onChange={(e) =>
                                                    setPasswordForm({ ...passwordForm, new_password: e.target.value })
                                                }
                                                className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Confirm Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.confirm_password}
                                                onChange={(e) =>
                                                    setPasswordForm({
                                                        ...passwordForm,
                                                        confirm_password: e.target.value,
                                                    })
                                                }
                                                className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSavingPassword}
                                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gray-800 hover:bg-gray-700 transition disabled:opacity-50"
                                        >
                                            {isSavingPassword ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>

                        {/* LLM Settings */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-dark rounded-2xl p-6 border border-white/10"
                        >
                            <div className="flex items-center mb-4 space-x-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-law flex items-center justify-center shadow-lg border border-white/10">
                                    <KeyIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">LLM API Keys</h2>
                                    <p className="text-xs text-gray-400">
                                        Store API keys for your preferred LLM providers. You can choose the provider and
                                        model per conversation on the chat page.
                                    </p>
                                    {llmSettings && (
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Current default: <span className="font-medium text-gray-200">{llmSettings.preferred_provider}</span>{' '}
                                            · Model: <span className="font-mono">{llmSettings.model_name}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleLlmSubmit} className="space-y-4">
                                <div className="space-y-3 text-xs text-gray-400">
                                    <p>API keys are stored in your local database. Consider using a test key.</p>
                                </div>

                                <div className="space-y-3 mt-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1">
                                            OpenAI API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={llmKeys.openai_api_key}
                                            onChange={(e) =>
                                                setLlmKeys({ ...llmKeys, openai_api_key: e.target.value })
                                            }
                                            className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                                            placeholder={
                                                openaiConfigured ? '•••••••• (saved - enter to replace)' : 'sk-...'
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1">
                                            Gemini API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={llmKeys.gemini_api_key}
                                            onChange={(e) =>
                                                setLlmKeys({ ...llmKeys, gemini_api_key: e.target.value })
                                            }
                                            className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                                            placeholder={
                                                geminiConfigured ? '•••••••• (saved - enter to replace)' : 'AIza...'
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1">
                                            Claude API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={llmKeys.claude_api_key}
                                            onChange={(e) =>
                                                setLlmKeys({ ...llmKeys, claude_api_key: e.target.value })
                                            }
                                            className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                                            placeholder={
                                                claudeConfigured ? '•••••••• (saved - enter to replace)' : 'sk-ant-...'
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1">
                                            Groq API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={llmKeys.groq_api_key}
                                            onChange={(e) =>
                                                setLlmKeys({ ...llmKeys, groq_api_key: e.target.value })
                                            }
                                            className="w-full bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                                            placeholder={
                                                groqConfigured ? '•••••••• (saved - enter to replace)' : 'gsk_...'
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end mt-4">
                                    <button
                                        type="submit"
                                        disabled={isSavingLlm}
                                        className="bg-gradient-law px-4 py-2 rounded-lg text-sm font-semibold text-white btn-hover-lift disabled:opacity-50"
                                    >
                                        {isSavingLlm ? 'Saving...' : 'Save LLM Settings'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    {/* Danger zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="glass-dark rounded-2xl p-6 border border-red-500/40 bg-red-950/40"
                    >
                        <h2 className="text-lg font-semibold text-red-200 mb-2">Danger zone</h2>
                        <p className="text-sm text-red-100/80 mb-4">
                            Deleting your account will permanently remove your profile, uploaded documents, chat
                            history, and LLM settings from this device. This action cannot be undone.
                        </p>

                        <form onSubmit={handleDeleteAccount} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-red-100 mb-1">
                                        Type DELETE to confirm
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        className="w-full bg-red-900/40 border border-red-500/60 rounded-lg px-3 py-2 text-red-50 placeholder-red-300/70 focus:outline-none focus:ring-2 focus:ring-red-400 text-xs"
                                        placeholder="DELETE"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-red-100 mb-1">
                                        Confirm with your password
                                    </label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="w-full bg-red-900/40 border border-red-500/60 rounded-lg px-3 py-2 text-red-50 placeholder-red-300/70 focus:outline-none focus:ring-2 focus:ring-red-400 text-xs"
                                        placeholder="Your current password"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <p className="text-[11px] text-red-200/80">
                                    Once deleted, your data cannot be recovered.
                                </p>
                                <button
                                    type="submit"
                                    disabled={isDeletingAccount}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-red-50 bg-red-600 hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeletingAccount ? 'Deleting...' : 'Delete account'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </main>
            </div>
        </ProtectedRoute>
    );
};

export default AccountPage;

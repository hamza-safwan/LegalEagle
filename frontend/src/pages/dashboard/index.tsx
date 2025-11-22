import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { documentsAPI } from '@/lib/api';
import {
    DocumentTextIcon,
    PlusIcon,
    ChatBubbleLeftRightIcon,
    ArrowUpTrayIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import MainNavbar from '@/components/layout/MainNavbar';

interface Document {
    id: number;
    filename: string;
    original_name: string;
    file_size: number;
    upload_date: string;
    indexed: boolean;
}

const DashboardPage: React.FC = () => {
    const router = useRouter();
    const { user, loadUser } = useAuthStore();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number | null; name: string }>({
        open: false,
        id: null,
        name: '',
    });

    useEffect(() => {
        loadDocuments();
        loadUser();
    }, []);

    const loadDocuments = async () => {
        try {
            const response = await documentsAPI.getAll();
            setDocuments(response.data.documents);
        } catch (error) {
            toast.error('Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await documentsAPI.upload(formData);
            toast.success('Document uploaded successfully!');
            setDocuments([response.data.document, ...documents]);

            // Redirect to chat after 1 second
            setTimeout(() => {
                router.push(`/dashboard/chat/${response.data.document.id}`);
            }, 1000);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (id: number) => {
        try {
            await documentsAPI.delete(id);
            toast.success('Document deleted');
            setDocuments(documents.filter(doc => doc.id !== id));
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950">
                {/* Navbar with profile dropdown */}
                <MainNavbar showAuthLinks={false} />

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-display font-bold text-white mb-2">
                                    Welcome back, {user?.name || 'User'}
                                </h1>
                                <p className="text-gray-400">Manage your legal documents and start analyzing</p>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="glass-dark rounded-2xl px-4 py-3 self-start"
                            >
                                <p className="text-xs text-gray-400 mb-1">Quick Upload</p>
                                <label className="inline-flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.doc,.txt"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                    <span className="bg-gradient-law px-4 py-2 rounded-lg text-white text-sm font-semibold btn-hover-lift inline-flex items-center space-x-2">
                                        <ArrowUpTrayIcon className="h-4 w-4" />
                                        <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                                    </span>
                                </label>
                            </motion.div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="glass-dark p-6 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Total Documents</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {user?.stats?.documents || documents.length}
                                    </p>
                                </div>
                                <DocumentTextIcon className="h-12 w-12 text-primary-400" />
                            </div>
                        </div>

                        <div className="glass-dark p-6 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Total Chats</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {user?.stats?.chats || 0}
                                    </p>
                                </div>
                                <ChatBubbleLeftRightIcon className="h-12 w-12 text-secondary-400" />
                            </div>
                        </div>

                        <div className="glass-dark p-6 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Quick Upload</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Drag & drop coming soon
                                    </p>
                                </div>
                                <PlusIcon className="h-12 w-12 text-accent-400" />
                            </div>
                        </div>
                    </div>

                    {/* Documents List */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Your Documents</h2>

                        {isLoading ? (
                            <div className="glass-dark p-12 rounded-2xl text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto"></div>
                                <p className="text-gray-400 mt-4">Loading documents...</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="glass-dark p-12 rounded-2xl text-center">
                                <DocumentTextIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No documents yet</h3>
                                <p className="text-gray-400 mb-6">Upload your first legal document to get started</p>
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.doc,.txt"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <span className="bg-gradient-law px-6 py-3 rounded-lg text-white font-semibold btn-hover-lift inline-flex items-center space-x-2">
                                        <PlusIcon className="h-5 w-5" />
                                        <span>Upload Document</span>
                                    </span>
                                </label>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {documents.map((doc, index) => (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="glass-dark p-6 rounded-2xl card-hover cursor-pointer"
                                        onClick={() => router.push(`/dashboard/chat/${doc.id}`)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <DocumentTextIcon className="h-10 w-10 text-primary-400" />
                                            <span className={`px-2 py-1 rounded text-xs ${doc.indexed
                                                    ? 'bg-green-500 bg-opacity-20 text-green-400'
                                                    : 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                                                }`}>
                                                {doc.indexed ? 'Indexed' : 'Processing'}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-semibold text-white mb-2 truncate" title={doc.original_name}>
                                            {doc.original_name}
                                        </h3>

                                        <div className="text-sm text-gray-400 space-y-1">
                                            <p>Size: {formatFileSize(doc.file_size)}</p>
                                            <p>Uploaded: {formatDate(doc.upload_date)}</p>
                                        </div>

                                        <div className="mt-4 flex space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/chat/${doc.id}`);
                                                }}
                                                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
                                            >
                                                Chat
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteDialog({
                                                        open: true,
                                                        id: doc.id,
                                                        name: doc.original_name,
                                                    });
                                                }}
                                                className="bg-red-600/90 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-1"
                                            >
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete confirmation dialog */}
                <AnimatePresence>
                    {deleteDialog.open && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="glass-dark rounded-2xl p-6 max-w-sm w-full border border-white/10"
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="mt-1">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-1">
                                            Delete this document?
                                        </h3>
                                        <p className="text-sm text-gray-300 mb-4">
                                            “{deleteDialog.name}” will be removed permanently, including its chat
                                            history.
                                        </p>
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => setDeleteDialog({ open: false, id: null, name: '' })}
                                                className="px-4 py-2 rounded-lg text-sm text-gray-200 bg-gray-800/70 hover:bg-gray-700 transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (deleteDialog.id != null) {
                                                        await handleDeleteDocument(deleteDialog.id);
                                                    }
                                                    setDeleteDialog({ open: false, id: null, name: '' });
                                                }}
                                                className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
};

export default DashboardPage;

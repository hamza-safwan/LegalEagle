import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import { DocumentTextIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface MainNavbarProps {
    showAuthLinks?: boolean;
}

const MainNavbar: React.FC<MainNavbarProps> = ({ showAuthLinks = true }) => {
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuthStore();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement | null>(null);

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };

        if (isProfileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileOpen]);

    return (
        <nav className="fixed w-full z-50 glass-dark border-b border-gray-800/60 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/landing')}>
                        <DocumentTextIcon className="h-8 w-8 text-primary-400" />
                        <span className="text-2xl font-display font-bold text-white">LegalEagle</span>
                    </div>

                    <div className="flex items-center space-x-6">
                        {showAuthLinks && !isAuthenticated && (
                            <>
                                <Link href="/auth/login" className="text-gray-300 hover:text-white transition">
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="bg-gradient-law px-4 py-2 rounded-lg text-white font-semibold btn-hover-lift text-sm"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}

                        {isAuthenticated && (
                            <div className="relative" ref={profileRef}>
                                <button
                                    type="button"
                                    className="flex items-center space-x-3 focus:outline-none"
                                    onClick={() => setIsProfileOpen((open) => !open)}
                                >
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-sm text-gray-200 font-medium">
                                            {user?.name || 'Account'}
                                        </span>
                                        <span className="text-xs text-gray-400 max-w-[160px] truncate">
                                            {user?.email}
                                        </span>
                                    </div>
                                    <div className="w-9 h-9 rounded-full bg-gradient-law flex items-center justify-center shadow-lg shadow-primary-500/40 border border-white/10">
                                        <UserCircleIcon className="h-6 w-6 text-white" />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-3 w-56 rounded-2xl shadow-xl border border-white/10 overflow-hidden origin-top-right bg-gray-950/95 backdrop-blur-xl"
                                        >
                                            <div className="px-4 py-3 border-b border-white/5">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {user?.name || 'LegalEagle User'}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {user?.email}
                                                </p>
                                            </div>
                                            <div className="py-1">
                                                <button
                                                    onClick={() => router.push('/dashboard')}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/5 transition"
                                                >
                                                    Dashboard
                                                </button>
                                                <button
                                                    onClick={() => router.push('/account')}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/5 transition"
                                                >
                                                    Account
                                                </button>
                                            </div>
                                            <div className="py-1 border-t border-white/5">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default MainNavbar;

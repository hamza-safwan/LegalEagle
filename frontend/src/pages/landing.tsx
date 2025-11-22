import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    ShieldCheckIcon,
    BoltIcon,
    ArrowRightIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import MainNavbar from '@/components/layout/MainNavbar';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950">
            {/* Navbar */}
            <MainNavbar showAuthLinks />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Copy & primary CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1 border border-white/10 text-xs text-gray-200">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/90 text-slate-900 font-semibold">
                                <SparklesIcon className="h-3 w-3" />
                            </span>
                            <span className="font-medium tracking-tight">New</span>
                            <span className="text-gray-300/80">Live AI contract assistant for busy teams</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight">
                            Focus on the deal,
                            <br />
                            <span className="gradient-law-text">not the paperwork.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-300 max-w-xl">
                            LegalEagle sits next to you in every contract review—summarising clauses, flagging risks,
                            and answering questions in real time with RAG + GPT‑4.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/auth/signup">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-gradient-law px-8 py-4 rounded-xl text-white text-lg font-semibold btn-hover-lift flex items-center justify-center space-x-2"
                                >
                                    <span>Start free in 2 minutes</span>
                                    <ArrowRightIcon className="h-5 w-5" />
                                </motion.button>
                            </Link>

                            <button className="glass-dark px-8 py-4 rounded-xl text-white text-sm md:text-base font-semibold btn-hover-lift border border-white/10">
                                View product tour
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon className="h-4 w-4" />
                                <span>Private by design</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BoltIcon className="h-4 w-4" />
                                <span>Under 10 seconds per question</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="h-4 w-4" />
                                <span>No training data from your docs</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Hero visual */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="hidden lg:block"
                    >
                        <div className="relative">
                            <div className="animated-gradient rounded-3xl p-[1px] shadow-2xl shadow-emerald-500/20">
                                <div className="rounded-3xl bg-slate-950/90 p-6 border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Currently reviewing</p>
                                            <p className="text-sm font-medium text-gray-100">
                                                Series A Investment Agreement.pdf
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-300 text-xs px-3 py-1">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                            Live insights
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <div className="h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                                                <DocumentTextIcon className="h-5 w-5 text-sky-400" />
                                            </div>
                                            <div className="flex-1 bg-slate-900/80 border border-white/5 rounded-2xl px-4 py-3">
                                                <p className="text-xs text-gray-400 mb-1">You</p>
                                                <p className="text-sm text-gray-100">
                                                    Highlight the top 3 risks in this indemnity clause.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end">
                                            <div className="flex-1 max-w-md bg-emerald-500/10 border border-emerald-500/40 rounded-2xl px-4 py-3">
                                                <p className="text-xs text-emerald-300 mb-1">LegalEagle</p>
                                                <p className="text-sm text-gray-100">
                                                    I&apos;ve found three key issues: unlimited liability, broad
                                                    third‑party claims, and no cap on indirect losses. Want a safer
                                                    redline version?
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                                            <span>Backed by document‑level RAG over your uploads</span>
                                            <span className="inline-flex items-center gap-1">
                                                <SparklesIcon className="h-3 w-3" />
                                                GPT‑4, Claude, Gemini &amp; more
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                            Powerful Features
                        </h2>
                        <p className="text-xl text-gray-300">
                            Everything you need to understand your legal documents
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: DocumentTextIcon,
                                title: 'Multi-Format Support',
                                description: 'Upload PDFs, DOCX, or TXT files. We handle any contract format seamlessly.',
                            },
                            {
                                icon: ChatBubbleLeftRightIcon,
                                title: 'Natural Conversations',
                                description: 'Ask questions in plain English. Get clear, contextual answers instantly.',
                            },
                            {
                                icon: ShieldCheckIcon,
                                title: 'Secure & Private',
                                description: 'Your documents are encrypted and private. We never share your data.',
                            },
                            {
                                icon: BoltIcon,
                                title: 'Lightning Fast',
                                description: 'Advanced RAG pipeline delivers answers in seconds, not hours.',
                            },
                            {
                                icon: SparklesIcon,
                                title: 'AI-Powered Insights',
                                description: 'GPT-4 and custom legal models provide expert-level analysis.',
                            },
                            {
                                icon: ArrowRightIcon,
                                title: 'Easy Integration',
                                description: 'Simple API access for developers and teams to integrate.',
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-dark p-8 rounded-2xl card-hover"
                            >
                                <feature.icon className="h-12 w-12 text-primary-400 mb-4" />
                                <h3 className="text-2xl font-semibold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-300">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 px-4 bg-black bg-opacity-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-300">
                            From upload to insights in three simple steps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Upload Document',
                                description: 'Drag and drop your legal contract or browse to upload',
                            },
                            {
                                step: '02',
                                title: 'AI Analysis',
                                description: 'Our RAG pipeline indexes and analyzes your document',
                            },
                            {
                                step: '03',
                                title: 'Ask Questions',
                                description: 'Chat naturally and get instant, accurate answers',
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="text-center"
                            >
                                <div className="text-6xl font-bold gradient-law-text mb-4">{item.step}</div>
                                <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
                                <p className="text-gray-300">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-dark p-12 rounded-3xl"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                            Ready to Transform Your Legal Workflow?
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Join thousands of professionals using LegalEagle to analyze contracts faster and smarter.
                        </p>
                        <Link href="/auth/signup">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-law px-10 py-4 rounded-xl text-white text-lg font-semibold btn-hover-lift"
                            >
                                Get Started Free
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-gray-800">
                <div className="max-w-7xl mx-auto text-center text-gray-400">
                    <p>&copy; 2025 LegalEagle. All rights reserved.</p>
                    <div className="mt-4 space-x-6">
                        <a href="#" className="hover:text-white transition">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition">Terms of Service</a>
                        <a href="#" className="hover:text-white transition">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

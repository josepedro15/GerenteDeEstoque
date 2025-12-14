"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles, ArrowLeft, Brain } from "lucide-react";
import Link from "next/link";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[#050505]" />
                <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="p-6 lg:p-8 h-screen flex flex-col">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-4xl w-full flex-1 flex flex-col"
                >
                    {/* Header */}
                    <header className="mb-6 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <Link
                                    href="/dashboard"
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </Link>
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                                    className="relative"
                                >
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                                        <Bot size={28} className="text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-green-500 border-2 border-[#050505] animate-pulse">
                                        <Sparkles size={10} className="text-white" />
                                    </div>
                                </motion.div>
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
                                    >
                                        Assistente IA
                                        <span className="inline-block ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white uppercase tracking-wider">
                                            Online
                                        </span>
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-sm text-neutral-400"
                                    >
                                        Análises de estoque, sugestões de compra e estratégias de queima
                                    </motion.p>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm"
                            >
                                <Brain size={14} className="text-indigo-400" />
                                <span className="text-white font-medium">Gemini Pro</span>
                            </motion.div>
                        </div>
                    </header>

                    {/* Chat Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex-1 rounded-3xl border border-white/10 bg-neutral-900/50 backdrop-blur-xl overflow-hidden flex flex-col"
                    >
                        <ChatInterface />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

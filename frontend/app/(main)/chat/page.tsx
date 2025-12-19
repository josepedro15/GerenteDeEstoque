"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles, ArrowLeft, Brain } from "lucide-react";
import Link from "next/link";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen relative overflow-hidden flex flex-col bg-background">
            {/* Animated Background - only visible in dark mode */}
            <div className="absolute inset-0 -z-10 dark:block hidden">
                <div className="absolute inset-0 bg-background" />
                <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Header compacto */}
            <header className="shrink-0 px-4 py-2 md:px-6 md:py-3 border-b border-border">
                <div className="mx-auto max-w-6xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="p-2 rounded-xl bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                                <Bot size={20} className="text-foreground" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-3 w-3 rounded-full bg-green-500 border-2 border-background">
                                <Sparkles size={6} className="text-foreground" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                Assistente IA
                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-foreground uppercase tracking-wider">
                                    Online
                                </span>
                            </h1>
                            <p className="text-[11px] text-muted-foreground hidden sm:block">
                                Análises de estoque, sugestões de compra e estratégias de queima
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Container - ocupa todo o espaço */}
            <div className="flex-1 min-h-0">
                <div className="h-full">
                    <ChatInterface fullPage={true} />
                </div>
            </div>
        </div>
    );
}

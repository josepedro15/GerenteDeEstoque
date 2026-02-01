"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Bot, Sparkles, ArrowLeft, Package, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { ChatInterface } from "@/components/chat/chat-interface";
import { fetchAuthenticatedUserId } from "@/lib/chat-session";

// Lazy load ProductSidebar para evitar erros de hidratação
const ProductSidebar = dynamic(
    () => import("@/components/chat/ProductSidebar").then(mod => ({ default: mod.ProductSidebar })),
    {
        ssr: false,
        loading: () => (
            <div className="hidden lg:flex w-80 bg-card border-r border-border items-center justify-center">
                <Loader2 size={24} className="animate-spin text-blue-400" />
            </div>
        )
    }
);

export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mounted, setMounted] = useState(false);

    // State for Session Management
    const [userId, setUserId] = useState<string>("");
    const [sessionId, setSessionId] = useState<string>("");

    useEffect(() => {
        setMounted(true);

        // Load User
        fetchAuthenticatedUserId().then(uid => {
            if (uid) setUserId(uid);
        });

        // Load Session from LocalStorage or leave empty (let ChatInterface handle default)
        // But better to control it here if we want to sync with Sidebar
        const storedSession = localStorage.getItem('chat_session_id');
        if (storedSession) {
            setSessionId(storedSession);
        }
    }, []);

    const handleNewChat = () => {
        const newId = crypto.randomUUID();
        setSessionId(newId);
        localStorage.setItem('chat_session_id', newId);
        // Dispatch event if needed, but prop change should trigger ChatInterface reload
    };

    const handleSelectSession = (sid: string) => {
        setSessionId(sid);
        localStorage.setItem('chat_session_id', sid);
    };

    return (
        <div className="h-[calc(100dvh-4rem)] md:h-[100dvh] relative overflow-hidden flex bg-background">
            {/* Animated Background - only visible in dark mode */}
            <div className="absolute inset-0 -z-10 dark:block hidden">
                <div className="absolute inset-0 bg-background" />
                <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Product Sidebar (now includes History) */}
            {mounted && (
                <ProductSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    userId={userId}
                    sessionId={sessionId}
                    onSelectSession={handleSelectSession}
                    onNewChat={handleNewChat}
                />
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header compacto */}
                <header className="shrink-0 px-3 py-2 sm:px-4 md:px-6 md:py-3 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Toggle Sidebar Button */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-xl bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors"
                                title={sidebarOpen ? "Fechar barra lateral" : "Abrir barra lateral"}
                            >
                                <Package size={18} />
                            </button>

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
                            </div>
                        </div>

                        {/* Botão de limpar histórico (Mantido, mas agora limpa apenas a sessão atual) */}
                        <button
                            onClick={() => {
                                if (window.confirm("Tem certeza que deseja limpar o histórico desta conversa?")) {
                                    window.dispatchEvent(new CustomEvent('chat:clear-history'));
                                }
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-colors border border-red-500/20"
                            title="Limpar mensagens desta conversa"
                        >
                            <Trash2 size={16} />
                            <span className="text-sm font-medium hidden md:inline">Limpar</span>
                        </button>
                    </div>
                </header>

                {/* Chat Container - ocupa todo o espaço */}
                <div className="flex-1 min-h-0 relative">
                    <ChatInterface
                        fullPage={true}
                        hideHeader={true} // Ocultar o header interno pois já temos um externo
                        userId={userId}
                        sessionId={sessionId}
                        key={userId} // FORCE REMOUNT when userId is loaded so useChat gets the correct body
                    />
                </div>
            </div>
        </div>
    );
}


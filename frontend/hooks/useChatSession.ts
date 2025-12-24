"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getChatHistory } from "@/app/actions/chatHistory";
import { DEFAULT_MESSAGES } from "@/lib/defaults";

export interface ChatSession {
    sessionId: string;
    userId: string;
    isLoading: boolean;
}

/**
 * Hook para gerenciar sessão de chat
 * Inicializa sessionId do localStorage e userId do Supabase
 */
export function useChatSession() {
    const [sessionId, setSessionId] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Inicializar sessionId
        const stored = localStorage.getItem('chat_session_id');
        if (stored) {
            setSessionId(stored);
        } else {
            const newId = crypto.randomUUID();
            localStorage.setItem('chat_session_id', newId);
            setSessionId(newId);
        }

        // Buscar userId do Supabase
        async function fetchUser() {
            try {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUser();
    }, []);

    const resetSession = () => {
        const newId = crypto.randomUUID();
        localStorage.setItem('chat_session_id', newId);
        setSessionId(newId);
    };

    return {
        sessionId,
        userId,
        isLoading,
        resetSession,
        setSessionId
    };
}

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
    type?: 'text' | 'campaign' | 'campaign_plan';
    campaignData?: any;
    planData?: any;
}

/**
 * Hook para carregar histórico de chat
 */
export function useChatHistory(userId: string, sessionId: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        if (!userId || hasLoadedRef.current) return;

        const timeout = setTimeout(() => {
            if (isLoadingHistory) {
                console.warn("Timeout loading history");
                setIsLoadingHistory(false);
                setMessages([{
                    id: "welcome",
                    role: "assistant",
                    content: DEFAULT_MESSAGES.welcome
                }]);
                hasLoadedRef.current = true;
            }
        }, 3000);

        async function loadHistory() {
            setIsLoadingHistory(true);
            try {
                const sessions = await getChatHistory(userId, 100);

                if (sessions && sessions.length > 0) {
                    const latestSession = sessions[0];

                    // Continuar na mesma sessão
                    localStorage.setItem('chat_session_id', latestSession.session_id);

                    const historicMessages: Message[] = latestSession.messages.map(m => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        timestamp: m.timestamp
                    }));

                    setMessages(historicMessages);
                } else {
                    setMessages([{
                        id: "welcome",
                        role: "assistant",
                        content: DEFAULT_MESSAGES.welcome
                    }]);
                }

                hasLoadedRef.current = true;
            } catch (error) {
                console.error("Error loading history:", error);
                setMessages([{
                    id: "welcome",
                    role: "assistant",
                    content: DEFAULT_MESSAGES.welcome
                }]);
                hasLoadedRef.current = true;
            } finally {
                clearTimeout(timeout);
                setIsLoadingHistory(false);
            }
        }

        loadHistory();

        return () => clearTimeout(timeout);
    }, [userId]);

    return {
        messages,
        setMessages,
        isLoadingHistory
    };
}

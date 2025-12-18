"use server";

import { supabase } from "@/lib/supabase";

// Types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
}

export interface ChatSession {
    session_id: string;
    messages: ChatMessage[];
    last_activity: string;
}

interface ChatHistoryRow {
    id: string;
    user_id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata: Record<string, unknown>;
    route: string | null;
    tokens_used: number | null;
    created_at: string;
}

/**
 * Busca o histórico de chat do usuário
 * Retorna as sessões ordenadas por atividade mais recente
 */
export async function getChatHistory(userId: string, limit = 100): Promise<ChatSession[]> {
    try {
        const { data, error } = await supabase
            .from('chat_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Supabase error fetching chat history:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Agrupa mensagens por sessão
        const sessionsMap: Record<string, ChatSession> = {};
        
        (data as ChatHistoryRow[]).forEach(row => {
            const sid = row.session_id || 'default';
            
            if (!sessionsMap[sid]) {
                sessionsMap[sid] = {
                    session_id: sid,
                    messages: [],
                    last_activity: row.created_at
                };
            }
            
            // Só adiciona mensagens de user e assistant (ignora system)
            if (row.role === 'user' || row.role === 'assistant') {
                sessionsMap[sid].messages.push({
                    id: row.id,
                    role: row.role,
                    content: row.content,
                    metadata: row.metadata,
                    timestamp: row.created_at
                });
            }
        });

        // Ordena mensagens dentro de cada sessão (cronológico)
        Object.values(sessionsMap).forEach(session => {
            session.messages.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
        });

        // Retorna sessões ordenadas por última atividade
        return Object.values(sessionsMap).sort((a, b) => 
            new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
        );

    } catch (error) {
        console.error("Error fetching chat history:", error);
        return [];
    }
}

/**
 * Busca mensagens de uma sessão específica
 */
export async function getSessionMessages(userId: string, sessionId: string): Promise<ChatMessage[]> {
    try {
        const { data, error } = await supabase
            .from('chat_history')
            .select('*')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching session messages:", error);
            return [];
        }

        return (data as ChatHistoryRow[])
            .filter(row => row.role === 'user' || row.role === 'assistant')
            .map(row => ({
                id: row.id,
                role: row.role as 'user' | 'assistant',
                content: row.content,
                metadata: row.metadata,
                timestamp: row.created_at
            }));

    } catch (error) {
        console.error("Error fetching session messages:", error);
        return [];
    }
}

/**
 * Salva uma nova mensagem no histórico
 */
export async function saveChatMessage(
    userId: string,
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>,
    route?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('chat_history')
            .insert({
                user_id: userId,
                session_id: sessionId,
                role,
                content,
                metadata: metadata || {},
                route: route || null
            })
            .select('id')
            .single();

        if (error) {
            console.error("Error saving chat message:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };

    } catch (error) {
        console.error("Error saving chat message:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Salva múltiplas mensagens de uma vez (batch)
 */
export async function saveChatMessages(
    userId: string,
    sessionId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string; metadata?: Record<string, unknown> }>,
    route?: string
): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        const entries = messages.map(msg => ({
            user_id: userId,
            session_id: sessionId,
            role: msg.role,
            content: msg.content,
            metadata: msg.metadata || {},
            route: route || null
        }));

        const { error } = await supabase
            .from('chat_history')
            .insert(entries);

        if (error) {
            console.error("Error saving chat messages:", error);
            return { success: false, count: 0, error: error.message };
        }

        return { success: true, count: entries.length };

    } catch (error) {
        console.error("Error saving chat messages:", error);
        return { success: false, count: 0, error: String(error) };
    }
}

/**
 * Limpa o histórico de uma sessão específica
 */
export async function clearChatSession(userId: string, sessionId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('chat_history')
            .delete()
            .eq('user_id', userId)
            .eq('session_id', sessionId);

        if (error) {
            console.error("Error clearing chat session:", error);
            return false;
        }

        return true;

    } catch (error) {
        console.error("Error clearing chat session:", error);
        return false;
    }
}

/**
 * Limpa todo o histórico do usuário
 */
export async function clearAllChatHistory(userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('chat_history')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error("Error clearing all chat history:", error);
            return false;
        }

        return true;

    } catch (error) {
        console.error("Error clearing all chat history:", error);
        return false;
    }
}

/**
 * Conta o total de mensagens do usuário
 */
export async function getChatMessageCount(userId: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('chat_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) {
            console.error("Error counting messages:", error);
            return 0;
        }

        return count || 0;

    } catch (error) {
        console.error("Error counting messages:", error);
        return 0;
    }
}

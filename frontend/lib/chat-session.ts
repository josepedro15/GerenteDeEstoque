import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

export function getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return crypto.randomUUID();
    const stored = localStorage.getItem('chat_session_id');
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem('chat_session_id', newId);
    return newId;
}

export function getAuthenticatedUserId(): string | null {
    // This is a synchronous check if we have it in memory/context, 
    // but for now we might just rely on fetchAuthenticatedUserId
    if (typeof window === 'undefined') return null;
    return null; // Implement if we have a global auth store
}

export async function fetchAuthenticatedUserId(): Promise<string | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

export async function getChatHistory(sessionId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching chat history:', error);
        return [];
    }
    return data;
}

export async function saveChatMessage(message: {
    session_id: string;
    user_id?: string | null;
    role: 'user' | 'assistant';
    content: string;
}) {
    const supabase = createClient();
    const { error } = await supabase.from('chat_history').insert([
        {
            session_id: message.session_id,
            user_id: message.user_id,
            role: message.role,
            content: message.content,
            metadata: {}, // Add metadata if needed
        },
    ]);

    if (error) {
        console.error('Error saving chat message:', error);
    }
}

export function clearChatSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('chat_session_id');
}

// @ts-nocheck
'use client';

import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send, Maximize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils'; // Assuming this exists, or I will use standard template literal

export function ChatComponent() {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat();
    const router = useRouter();

    useEffect(() => {
        const handleSendProduct = (e: any) => {
            const productData = e.detail;
            setIsOpen(true);

            // Send the formatted message to the chat
            append({
                role: 'user',
                content: JSON.stringify(productData, null, 2)
            });
        };

        window.addEventListener('chat:send-product', handleSendProduct);
        return () => window.removeEventListener('chat:send-product', handleSendProduct);
    }, [append]);

    const handleExpand = () => {
        setIsOpen(false);
        router.push('/chat');
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 h-[500px] w-[350px] overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl sm:w-[400px]">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-white/5 p-3 border-b border-white/5">
                        <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Assistente IA
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExpand}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 hover:text-white text-xs font-medium transition-all border border-indigo-500/30"
                            >
                                <Maximize2 size={14} />
                                Expandir
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex h-[380px] flex-col gap-4 overflow-y-auto p-4">
                        {messages.length === 0 && (
                            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                                <p>Olá! Pergunte sobre o estoque, itens em falta ou sugestões de compra.</p>
                            </div>
                        )}
                        {messages.map((m: any) => (
                            <div
                                key={m.id}
                                className={cn(
                                    "max-w-[85%] rounded-xl p-3 text-sm",
                                    m.role === 'user'
                                        ? "self-end bg-primary text-primary-foreground"
                                        : "self-start bg-white/10 text-white"
                                )}
                            >
                                <span className="block font-bold text-xs opacity-50 mb-1">
                                    {m.role === 'user' ? 'Você' : 'IA'}
                                </span>
                                {m.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="self-start rounded-xl bg-white/10 p-3 text-sm text-white">
                                <span className="animate-pulse">Digitando...</span>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="border-t border-white/5 bg-white/5 p-4">
                        <div className="flex gap-2">
                            <input
                                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Pergunte sobre o estoque..."
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center rounded-lg bg-primary px-3 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
            >
                <MessageCircle size={28} />
            </button>
        </div>
    );
}

// Minimal cn utility in case it's missing (though 'clsx' and 'tailwind-merge' are in package.json)
// function cn(...classes: (string | undefined | null | false)[]) {
//   return classes.filter(Boolean).join(' ');
// }

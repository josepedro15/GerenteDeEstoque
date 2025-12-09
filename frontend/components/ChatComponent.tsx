'use client';

import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils'; // Assuming this exists, or I will use standard template literal

export function ChatComponent() {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 h-[500px] w-[350px] overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl sm:w-[400px]">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-white/5 p-4 border-b border-white/5">
                        <h3 className="font-semibold text-white">Assistente IA</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-white"
                        >
                            <X size={18} />
                        </button>
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

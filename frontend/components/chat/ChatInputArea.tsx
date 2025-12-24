"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputAreaProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    placeholder?: string;
}

export function ChatInputArea({
    onSendMessage,
    isLoading,
    placeholder = "Digite sua mensagem..."
}: ChatInputAreaProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSendMessage(input.trim());
        setInput("");

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    return (
        <div className="border-t border-border bg-background p-4">
            <div className="mx-auto flex max-w-3xl gap-3">
                <div className="relative flex-1">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={isLoading}
                        rows={1}
                        className={cn(
                            "w-full resize-none rounded-xl border border-border bg-accent/50 px-4 py-3 pr-12",
                            "text-sm text-foreground placeholder:text-muted-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "min-h-[48px] max-h-[120px]"
                        )}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2",
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            "bg-indigo-600 text-white transition-all",
                            "hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
                Pressione Enter para enviar • Shift+Enter para nova linha
            </p>
        </div>
    );
}

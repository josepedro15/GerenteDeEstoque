"use client";

import { useState } from "react";
import { ChatInterface } from "./chat-interface";
import { MessageCircle, X, Maximize2, Minimize2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/contexts/ChatContext";

export function GlobalChatWidget() {
    const { isOpen, toggleChat } = useChat();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`rounded-2xl border border-border bg-card backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isExpanded
                            ? "w-[800px] h-[80vh]"
                            : "w-[400px] h-[600px] max-h-[80vh]"
                            }`}
                    >
                        {/* Header do Widget */}
                        <div className="flex items-center justify-between p-3 border-b border-border bg-accent shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="font-medium text-foreground text-sm">Assistente IA</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                    title={isExpanded ? "Reduzir" : "Expandir"}
                                >
                                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                                <button
                                    onClick={toggleChat}
                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                                    title="Fechar"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Interface sem header próprio */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <ChatInterface fullPage={false} hideHeader />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleChat}
                className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {isOpen ? <X size={24} className="text-white" /> : <MessageCircle size={28} className="text-white" />}
            </motion.button>
        </div>
    );
}

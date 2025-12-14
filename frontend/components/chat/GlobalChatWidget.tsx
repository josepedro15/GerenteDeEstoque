"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInterface } from "./chat-interface";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function GlobalChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleOpenPage = () => {
        setIsOpen(false);
        router.push('/chat');
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[400px] h-[600px] max-h-[80vh] rounded-2xl border border-white/10 bg-[#0f0f11]/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Assistente IA
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleOpenPage}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-white text-xs font-medium transition-all border border-blue-500/30"
                                >
                                    <ExternalLink size={14} />
                                    Abrir Página
                                </button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Interface wrapped */}
                        <div className="flex-1 overflow-hidden relative">
                            <ChatInterface />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {isOpen ? <X size={24} className="text-white" /> : <MessageCircle size={28} className="text-white" />}
            </motion.button>
        </div>
    );
}

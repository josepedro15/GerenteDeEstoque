"use client";

import { useState } from "react";
import { ChatInterface } from "./chat-interface";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function GlobalChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

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
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <MessageCircle size={18} className="text-blue-400" />
                                Assistente IA
                            </h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => setIsOpen(false)}>
                                <X size={18} />
                            </Button>
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

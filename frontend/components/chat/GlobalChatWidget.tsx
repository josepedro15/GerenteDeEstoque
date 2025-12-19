"use client";

import { ChatInterface } from "./chat-interface";
import { MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/contexts/ChatContext";

export function GlobalChatWidget() {
    const { isOpen, toggleChat } = useChat();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[400px] h-[600px] max-h-[80vh] rounded-2xl border border-white/10 bg-[#1a1c23] backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Chat Interface - header is handled inside ChatInterface when fullPage=false */}
                        <ChatInterface />
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


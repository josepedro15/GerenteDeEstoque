"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
    isOpen: boolean;
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    sendProductMessage: (product: any) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    // We can't directly call "sendMessage" here easily as it's a server action, 
    // but we can expose a hook or state that the ChatComponent listens to.
    // For now, let's control visibility.
    // To send a message "automatically" when opening, we might need a "pendingMessage" state.
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);

    const toggleChat = () => setIsOpen(prev => !prev);
    const openChat = () => setIsOpen(true);
    const closeChat = () => setIsOpen(false);

    const sendProductMessage = (product: any) => {
        setIsOpen(true);
        // We will implement a custom event or a shared state that the Chat Interface listens to.
        // For simplicity, let's dispatch a custom window event or use a robust state management.
        // Or better: The ChatInterface will consume this Context too.

        // Let's store the product to be processed by ChatInterface
        if (typeof window !== "undefined") {
            const event = new CustomEvent("chat:send-product", { detail: product });
            window.dispatchEvent(event);
        }
    };

    return (
        <ChatContext.Provider value={{ isOpen, toggleChat, openChat, closeChat, sendProductMessage }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}

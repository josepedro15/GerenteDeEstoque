"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ActionPlanData {
    action: string;
    alertType: string;
    alertLabel: string;
    totalQuantity: number;
    totalValue: number;
    message: string;
    user_id?: string;
}

interface ChatContextType {
    isOpen: boolean;
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    sendProductMessage: (product: any) => void;
    sendActionPlanMessage: (data: ActionPlanData) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => setIsOpen(prev => !prev);
    const openChat = () => setIsOpen(true);
    const closeChat = () => setIsOpen(false);

    const sendProductMessage = (product: any) => {
        setIsOpen(true);
        // Dispara evento para o ChatInterface processar
        if (typeof window !== "undefined") {
            const event = new CustomEvent("chat:send-product", { detail: product });
            window.dispatchEvent(event);
        }
    };

    const sendActionPlanMessage = (data: ActionPlanData) => {
        setIsOpen(true);
        // Dispara evento para o ChatInterface processar
        if (typeof window !== "undefined") {
            const event = new CustomEvent("chat:send-action-plan", { detail: data });
            window.dispatchEvent(event);
        }
    };

    return (
        <ChatContext.Provider value={{ isOpen, toggleChat, openChat, closeChat, sendProductMessage, sendActionPlanMessage }}>
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

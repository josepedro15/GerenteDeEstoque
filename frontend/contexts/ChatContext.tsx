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
        // Dispara evento após o chat estar montado (setState é assíncrono; o widget só renderiza ChatInterface quando isOpen === true)
        if (typeof window !== "undefined") {
            setTimeout(() => {
                const event = new CustomEvent("chat:send-product", { detail: product });
                window.dispatchEvent(event);
            }, 150);
        }
    };

    const sendActionPlanMessage = (data: ActionPlanData) => {
        setIsOpen(true);
        // Dispara evento para o ChatInterface processar
        // Usa setTimeout para garantir que o chat esteja montado
        if (typeof window !== "undefined") {
            setTimeout(() => {
                const event = new CustomEvent("chat:send-action-plan", { detail: data });
                window.dispatchEvent(event);
            }, 100);
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

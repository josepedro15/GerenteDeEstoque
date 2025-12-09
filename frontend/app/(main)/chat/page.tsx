import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-theme(spacing.24))] flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight text-white/90 mb-6">
                Assistente de Compras
            </h1>
            <div className="flex-1 rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden flex flex-col">
                <ChatInterface />
            </div>
        </div>
    );
}

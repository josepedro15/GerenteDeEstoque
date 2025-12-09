"use client";

import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";

export function ExplainButton({ product }: { product: any }) {
    const { sendProductMessage } = useChat();

    return (
        <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
            onClick={() => sendProductMessage(product)}
            title="Perguntar pra IA"
        >
            <MessageSquarePlus className="h-4 w-4" />
        </Button>
    );
}

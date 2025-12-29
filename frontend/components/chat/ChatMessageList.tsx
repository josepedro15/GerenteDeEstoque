"use client";

import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Message } from "@/hooks/useChatSession";
import { CampaignCard } from "@/components/chat/CampaignCard";
import { StrategicPlanCard } from "@/components/chat/StrategicPlanCard";

interface ChatMessageListProps {
    messages: Message[];
    userAvatar: string | null;
    isLoading: boolean;
    isGeneratingAssets: boolean;
    onApproveAndGenerate?: (products: any[]) => void;
}

// Clean markdown content - remove JSON routing metadata and markdown code fences
const cleanContent = (text: string): string => {
    let cleaned = text;
    
    // Remove markdown code fences
    cleaned = cleaned.replace(/^```markdown\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    
    // Detectar e remover JSON de roteamento no início (formato: "json {...}" ou "{...}")
    const trimmed = cleaned.trim();
    
    // Verificar se começa com "json" seguido de {
    const jsonPrefixMatch = trimmed.match(/^json\s*(\{)/i);
    const startsWithBrace = trimmed.startsWith('{');
    
    if (jsonPrefixMatch || startsWithBrace) {
        // Encontrar onde o JSON começa
        const jsonStartIndex = trimmed.indexOf('{');
        
        if (jsonStartIndex !== -1) {
            // Balancear chaves para encontrar o fim do JSON
            let braceCount = 0;
            let jsonEndIndex = -1;
            
            for (let i = jsonStartIndex; i < trimmed.length; i++) {
                if (trimmed[i] === '{') braceCount++;
                else if (trimmed[i] === '}') braceCount--;
                
                if (braceCount === 0) {
                    jsonEndIndex = i;
                    break;
                }
            }
            
            if (jsonEndIndex !== -1) {
                // Extrair o conteúdo após o JSON
                const afterJson = trimmed.substring(jsonEndIndex + 1).trim();
                
                // Se há conteúdo significativo após o JSON, usar esse conteúdo
                if (afterJson.length > 20) {
                    // Remover possíveis artefatos de formatação
                    cleaned = afterJson
                        .replace(/^---\s*/, '')
                        .replace(/^\s*```\s*/, '')
                        .trim();
                }
            }
        }
    }
    
    return cleaned;
};

// Markdown components - use any for compatibility with react-markdown types
const markdownComponents: Record<string, React.ComponentType<any>> = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-sm">{children}</li>,
    table: ({ children }) => <div className="overflow-x-auto my-3"><table className="min-w-full text-xs border-collapse">{children}</table></div>,
    thead: ({ children }) => <thead className="bg-zinc-800/50">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-zinc-700/50">{children}</tr>,
    th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-zinc-300">{children}</th>,
    td: ({ children }) => <td className="px-3 py-2 text-zinc-400">{children}</td>,
    h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-foreground">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-foreground">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-foreground">{children}</h3>,
    h4: ({ children }) => <h4 className="text-sm font-semibold mb-1 text-foreground">{children}</h4>,
    hr: () => <hr className="my-3 border-zinc-700" />,
    blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-500 pl-3 italic text-zinc-400 my-2">{children}</blockquote>,
    code: ({ children }) => <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-400">{children}</code>,
};

export function ChatMessageList({
    messages,
    userAvatar,
    isLoading,
    isGeneratingAssets,
    onApproveAndGenerate
}: ChatMessageListProps) {
    return (
        <>
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={cn(
                        "flex gap-3 p-4",
                        msg.role === "user" ? "bg-accent/30" : ""
                    )}
                >
                    {/* Avatar */}
                    <div
                        className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            msg.role === "user"
                                ? "bg-gradient-to-br from-indigo-500 to-purple-500"
                                : "bg-gradient-to-br from-emerald-500 to-teal-500"
                        )}
                    >
                        {msg.role === "user" ? (
                            userAvatar ? (
                                <img src={userAvatar} alt="User" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <User className="h-4 w-4 text-white" />
                            )
                        ) : (
                            <Bot className="h-4 w-4 text-white" />
                        )}
                    </div>

                    {/* Message content */}
                    <div className="flex-1 overflow-hidden">
                        <div className="mb-1 text-xs font-medium text-muted-foreground">
                            {msg.role === "user" ? "Você" : "Assistente"}
                        </div>

                        {/* Campaign Card */}
                        {msg.type === 'campaign' && msg.campaignData ? (
                            <CampaignCard
                                campaign={msg.campaignData.campaign}
                                products={msg.campaignData.products}
                            />
                        ) : msg.type === 'campaign_plan' && msg.planData ? (
                            <StrategicPlanCard
                                plan={msg.planData}
                                onApprove={onApproveAndGenerate ? () => onApproveAndGenerate(msg.planData.produtos || []) : () => { }}
                                isLoading={isGeneratingAssets}
                            />
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none text-sm text-foreground">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={markdownComponents}
                                >
                                    {cleanContent(msg.content)}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
                <div className="flex gap-3 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                        <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1 pt-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                    </div>
                </div>
            )}
        </>
    );
}

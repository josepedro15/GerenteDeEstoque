"use client";

import { useState } from "react";
import { Instagram, MessageCircle, Printer, Copy, Check, Download, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignCardProps {
    campaign: any;
    products?: Array<{ id: string; nome: string; preco: number }>;
    onSave?: () => void;
    onClose?: () => void;
}

export function CampaignCard({ campaign, products = [], onSave, onClose }: CampaignCardProps) {
    const [activeTab, setActiveTab] = useState<'instagram' | 'whatsapp' | 'physical'>('instagram');
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDownload = () => {
        // Criar texto para download
        const content = `
CAMPANHA DE MARKETING
=====================
Data: ${new Date().toLocaleDateString('pt-BR')}
Produtos: ${products.map(p => p.nome).join(', ')}

--- INSTAGRAM ---
${campaign?.channels?.instagram?.copy || 'N/A'}

--- WHATSAPP ---
${campaign?.channels?.whatsapp?.script || 'N/A'}

--- PONTO DE VENDA ---
Headline: ${campaign?.channels?.physical?.headline || 'N/A'}
Subheadline: ${campaign?.channels?.physical?.subheadline || 'N/A'}
Oferta: ${campaign?.channels?.physical?.offer || 'N/A'}
        `.trim();

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campanha_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!campaign?.channels) {
        return (
            <div className="rounded-2xl border border-border bg-card/50 p-6 text-center">
                <p className="text-muted-foreground">Erro ao gerar campanha</p>
            </div>
        );
    }

    const tabs = [
        { id: 'instagram' as const, label: 'Instagram', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-500' },
        { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500' },
        { id: 'physical' as const, label: 'PDV', icon: Printer, color: 'text-orange-500', bg: 'bg-orange-500' },
    ];

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg w-full max-w-xl mx-auto">
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            🎨 Campanha Gerada
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            {products.length} produto(s) • {new Date().toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="p-2 rounded-lg bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors"
                            title="Download"
                        >
                            <Download size={16} />
                        </button>
                        {onSave && (
                            <button
                                onClick={onSave}
                                className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                                title="Salvar"
                            >
                                <Save size={16} />
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                            activeTab === tab.id
                                ? `text-foreground border-b-2 ${tab.id === 'instagram' ? 'border-pink-500' : tab.id === 'whatsapp' ? 'border-green-500' : 'border-orange-500'}`
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon size={16} className={activeTab === tab.id ? tab.color : ''} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Instagram */}
                {activeTab === 'instagram' && (
                    <div className="space-y-4">
                        {/* Imagem do Instagram (base64 ou URL) */}
                        {(campaign.channels.instagram?.imageUrl || campaign.channels.instagram?.imageBase64 || campaign.channels.instagram?.image) && (
                            <div className="bg-neutral-950 rounded-xl p-4 flex items-center justify-center">
                                <div className="relative rounded-xl overflow-hidden shadow-2xl max-w-sm">
                                    <img
                                        src={
                                            campaign.channels.instagram.imageBase64?.startsWith('data:')
                                                ? campaign.channels.instagram.imageBase64
                                                : campaign.channels.instagram.imageBase64
                                                    ? `data:image/png;base64,${campaign.channels.instagram.imageBase64}`
                                                    : campaign.channels.instagram.image?.startsWith('data:')
                                                        ? campaign.channels.instagram.image
                                                        : campaign.channels.instagram.image
                                                            ? `data:image/png;base64,${campaign.channels.instagram.image}`
                                                            : campaign.channels.instagram.imageUrl
                                        }
                                        alt="Instagram Post"
                                        className="w-full h-auto max-h-80 object-contain"
                                    />
                                    {campaign.channels.instagram.sticker && (
                                        <div className="absolute bottom-4 right-4">
                                            <span className="bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1.5 rounded-lg text-xs font-bold text-white uppercase">
                                                {campaign.channels.instagram.sticker}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="bg-accent rounded-xl p-4 relative">
                            <button
                                onClick={() => handleCopy(campaign.channels.instagram?.copy || '', 'instagram')}
                                className="absolute top-3 right-3 p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
                            >
                                {copied === 'instagram' ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                            <h4 className="text-xs font-medium text-pink-400 mb-2 flex items-center gap-1">
                                <Instagram size={12} /> Legenda
                            </h4>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                                {campaign.channels.instagram?.copy || 'Sem conteúdo'}
                            </p>
                        </div>
                        {campaign.channels.instagram?.imagePrompt && (
                            <div className="bg-pink-500/5 rounded-xl p-3 border border-pink-500/10">
                                <h5 className="text-xs font-bold text-pink-400 uppercase mb-1">Prompt da Imagem</h5>
                                <p className="text-xs text-muted-foreground">{campaign.channels.instagram.imagePrompt}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* WhatsApp */}
                {activeTab === 'whatsapp' && (
                    <div className="space-y-4">
                        <div className="bg-[#0b141a] rounded-xl overflow-hidden">
                            <div className="bg-[#202c33] p-3 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center">
                                    <MessageCircle size={14} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="text-white font-medium text-sm">Cliente</h4>
                                    <span className="text-[#8696a0] text-[10px]">online</span>
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="bg-[#005c4b] rounded-lg rounded-tr-none p-3 relative group max-w-[90%] ml-auto">
                                    <button
                                        onClick={() => handleCopy(campaign.channels.whatsapp?.script || '', 'whatsapp')}
                                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-[#202c33] text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {copied === 'whatsapp' ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                    <p className="text-sm text-[#e9edef] whitespace-pre-wrap">
                                        {campaign.channels.whatsapp?.script || 'Sem conteúdo'}
                                    </p>
                                    <div className="flex justify-end items-center gap-1 mt-1">
                                        <span className="text-[10px] text-[#8696a0]">10:42</span>
                                        <Check size={10} className="text-[#53bdeb]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {campaign.channels.whatsapp?.trigger && (
                            <div className="text-xs text-muted-foreground">
                                Gatilho: <span className="text-green-400">{campaign.channels.whatsapp.trigger}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* PDV */}
                {activeTab === 'physical' && (
                    <div className="space-y-4">
                        {/* Imagem do Poster (base64 ou URL) */}
                        {(campaign.channels.physical?.posterUrl || campaign.channels.physical?.posterBase64 || campaign.channels.physical?.poster || campaign.channels.physical?.image) && (
                            <div className="flex justify-center">
                                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border max-w-md">
                                    <img
                                        src={
                                            campaign.channels.physical.posterBase64?.startsWith('data:')
                                                ? campaign.channels.physical.posterBase64
                                                : campaign.channels.physical.posterBase64
                                                    ? `data:image/png;base64,${campaign.channels.physical.posterBase64}`
                                                    : campaign.channels.physical.poster?.startsWith('data:')
                                                        ? campaign.channels.physical.poster
                                                        : campaign.channels.physical.poster
                                                            ? `data:image/png;base64,${campaign.channels.physical.poster}`
                                                            : campaign.channels.physical.image?.startsWith('data:')
                                                                ? campaign.channels.physical.image
                                                                : campaign.channels.physical.image
                                                                    ? `data:image/png;base64,${campaign.channels.physical.image}`
                                                                    : campaign.channels.physical.posterUrl
                                        }
                                        alt="Poster PDV"
                                        className="w-full h-auto max-h-96 object-contain"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Fallback: Card de texto se não houver imagem */}
                        {!campaign.channels.physical?.posterUrl && !campaign.channels.physical?.posterBase64 && !campaign.channels.physical?.poster && !campaign.channels.physical?.image && (
                            <div className="bg-white text-black p-6 rounded-xl border-4 border-yellow-400 text-center">
                                <h2 className="text-2xl font-black uppercase text-red-600 mb-2">
                                    {campaign.channels.physical?.headline || 'PROMOÇÃO'}
                                </h2>
                                <p className="text-lg font-bold border-b-2 border-black pb-2 mb-4">
                                    {campaign.channels.physical?.subheadline || 'Aproveite!'}
                                </p>
                                <div className="bg-yellow-400 p-4 rounded-lg border-2 border-dashed border-black">
                                    <p className="text-xl font-black">
                                        {campaign.channels.physical?.offer || 'Oferta Especial'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => handleCopy(
                                `${campaign.channels.physical?.headline}\n${campaign.channels.physical?.subheadline}\n${campaign.channels.physical?.offer}`,
                                'physical'
                            )}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors text-sm"
                        >
                            {copied === 'physical' ? <Check size={14} /> : <Copy size={14} />}
                            {copied === 'physical' ? 'Copiado!' : 'Copiar textos'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

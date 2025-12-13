"use client";

import { motion } from "framer-motion";
import { Instagram, MessageCircle, Printer, Copy, Check, Megaphone } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';

export function CampaignResult({ campaign }: { campaign: any }) {
    const [activeTab, setActiveTab] = useState<'instagram' | 'whatsapp' | 'physical'>('instagram');
    const [copied, setCopied] = useState(false);

    if (!campaign || !campaign.channels) {
        return (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
                <div className="mb-4 rounded-full bg-pink-500/10 p-6">
                    <Megaphone className="text-pink-500/50" size={48} />
                </div>
                <h3 className="text-lg font-medium text-white">
                    {campaign ? "Resposta da IA Incompleta" : "Nenhuma Campanha Gerada"}
                </h3>
                <p className="text-muted-foreground">
                    {campaign
                        ? "A IA respondeu, mas não gerou os canais esperados. Tente novamente."
                        : "Selecione produtos no Radar para a IA criar seus materiais."}
                </p>
            </div>
        );
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full"
        >
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden flex flex-col h-[600px]">
                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-black/20">
                    <button
                        onClick={() => setActiveTab('instagram')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${activeTab === 'instagram' ? 'bg-pink-500/20 text-pink-400 border-b-2 border-pink-500' : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Instagram size={18} /> Instagram
                    </button>
                    <button
                        onClick={() => setActiveTab('whatsapp')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${activeTab === 'whatsapp' ? 'bg-green-500/20 text-green-400 border-b-2 border-green-500' : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <MessageCircle size={18} /> WhatsApp / CRM
                    </button>
                    <button
                        onClick={() => setActiveTab('physical')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${activeTab === 'physical' ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500' : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Printer size={18} /> Ponto de Venda
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'instagram' && (
                        <div className="space-y-6">
                            <div className="flex gap-6">
                                {/* Visual Mockup */}
                                <div className="w-1/3 aspect-[4/5] bg-neutral-900 rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden group">
                                    {campaign.channels.instagram.imageUrl ? (
                                        <>
                                            <img
                                                src={campaign.channels.instagram.imageUrl}
                                                alt="Generated Campaign"
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded inline-block w-fit">
                                                    {campaign.channels.instagram.sticker}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded inline-block w-fit mb-2">
                                                {campaign.channels.instagram.sticker}
                                            </span>
                                            <p className="text-white text-xs opacity-75">Visual suggestion based on prompt</p>
                                        </div>
                                    )}

                                    {!campaign.channels.instagram.imageUrl && (
                                        <span className="text-white/20 text-xs text-center px-4 relative z-10">
                                            {campaign.channels.instagram.imagePrompt}
                                        </span>
                                    )}
                                </div>

                                {/* Copy Actions */}
                                <div className="flex-1 space-y-4">
                                    <div className="rounded-xl border border-white/10 bg-black/40 p-4 relative">
                                        <button
                                            onClick={() => handleCopy(campaign.channels.instagram.copy)}
                                            className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                        >
                                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                                            {campaign.channels.instagram.copy}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                                        <h4 className="text-pink-400 text-sm font-bold mb-1">Dica de Imagem 📸</h4>
                                        <p className="text-xs text-pink-200/80">{campaign.channels.instagram.imagePrompt}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <div className="max-w-md mx-auto bg-[#075E54] rounded-2xl p-4 shadow-2xl relative">
                            {/* WhatsApp Window Mock */}
                            <div className="bg-[#DCF8C6] text-black rounded-lg p-3 mb-2 rounded-tr-none shadow-sm relative">
                                <button
                                    onClick={() => handleCopy(campaign.channels.whatsapp.script)}
                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                                >
                                    {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-gray-600" />}
                                </button>
                                <p className="text-sm whitespace-pre-wrap">
                                    {campaign.channels.whatsapp.script}
                                </p>
                                <span className="text-[10px] text-gray-500 block text-right mt-1">10:42</span>
                            </div>

                            <div className="mt-8 p-3 bg-white/10 rounded-lg border border-white/20">
                                <h4 className="text-white text-sm font-bold mb-1">Gatilho Mental Utilizado 🧠</h4>
                                <p className="text-xs text-green-100">{campaign.channels.whatsapp.trigger}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'physical' && (
                        <div className="space-y-6 text-center">
                            {campaign.channels.physical.posterUrl ? (
                                <div className="max-w-md mx-auto bg-white p-2 rounded-xl shadow-2xl transform rotate-1 border-4 border-white">
                                    <img
                                        src={campaign.channels.physical.posterUrl}
                                        alt="Cartaz Gerado"
                                        className="w-full h-auto rounded"
                                    />
                                </div>
                            ) : (
                                <div className="max-w-md mx-auto bg-white text-black p-8 rounded-xl shadow-2xl transform rotate-1 border-4 border-yellow-400">
                                    <h2 className="text-3xl font-black uppercase mb-2 tracking-tighter text-red-600">
                                        {campaign.channels.physical.headline}
                                    </h2>
                                    <p className="text-lg font-bold mb-6 border-b-2 border-black pb-4">
                                        {campaign.channels.physical.subheadline}
                                    </p>
                                    <div className="bg-yellow-400 p-4 rounded-lg transform -rotate-2 mb-4">
                                        <p className="text-2xl font-black">{campaign.channels.physical.offer}</p>
                                    </div>
                                    <p className="text-sm font-medium opacity-60 mt-4">Oferta válida enquanto durarem os estoques.</p>
                                </div>
                            )}

                            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 inline-block text-left">
                                <h4 className="text-orange-400 text-sm font-bold mb-1">Especificações de Impressão 🖨</h4>
                                <p className="text-xs text-orange-200/80">{campaign.channels.physical.layout}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Instagram, MessageCircle, Printer, Copy, Check, Megaphone, Smartphone, Download, Share2 } from "lucide-react";
import { useState } from "react";

export function CampaignResult({ campaign }: { campaign: any }) {
    const [activeTab, setActiveTab] = useState<'instagram' | 'whatsapp' | 'physical'>('instagram');
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    if (!campaign || !campaign.channels) {
        return (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-white/5 bg-neutral-900/50 p-12 text-center backdrop-blur-sm">
                <div className="mb-6 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-8 shadow-inner shadow-white/5">
                    <Megaphone className="text-pink-400" size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                    {campaign ? "Resposta da IA Incompleta" : "Aguardando Campanha"}
                </h3>
                <p className="text-neutral-400 max-w-sm mx-auto">
                    {campaign
                        ? "A IA respondeu, mas não gerou os canais esperados. Tente novamente."
                        : "Selecione produtos no Radar para a IA criar seus materiais de marketing."}
                </p>
            </div>
        );
    }

    const tabs = [
        { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
        { id: 'whatsapp', label: 'WhatsApp / CRM', icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        { id: 'physical', label: 'Ponto de Venda', icon: Printer, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    ];

    const currentTab = tabs.find(t => t.id === activeTab);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full bg-neutral-900 rounded-3xl border border-white/5 shadow-2xl overflow-hidden"
        >
            {/* Header / Tabs */}
            <div className="flex items-center gap-2 p-2 bg-neutral-950/50 border-b border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${activeTab === tab.id
                                ? 'text-white bg-white/10 shadow-lg'
                                : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                            }`}
                    >
                        <tab.icon size={18} className={activeTab === tab.id ? tab.color : ''} />
                        <span className="relative z-10">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className={`absolute inset-0 opacity-20 ${tab.bg}`}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area with smooth transitions */}
            <div className="flex-1 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 overflow-y-auto relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'instagram' && (
                        <motion.div
                            key="instagram"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col lg:flex-row gap-8 h-full"
                        >
                            {/* Phone Mockup */}
                            <div className="w-full lg:w-[45%] flex items-center justify-center bg-neutral-950 rounded-2xl border border-white/5 p-4 relative group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 to-purple-500/5 rounded-2xl" />

                                <div className="relative w-full max-w-[320px] aspect-[9/16] bg-black rounded-[3rem] border-8 border-neutral-800 shadow-2xl overflow-hidden">
                                    {/* Mockup Screen Content */}
                                    <div className="absolute top-0 left-0 w-full h-8 bg-black z-20 flex justify-center items-center">
                                        <div className="w-20 h-4 bg-neutral-800 rounded-full" />
                                    </div>

                                    {/* User Header */}
                                    <div className="mt-8 px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-neutral-900/90 backdrop-blur-md z-10 relative">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-[2px]">
                                            <div className="w-full h-full rounded-full bg-neutral-800" />
                                        </div>
                                        <div className="text-xs text-white font-semibold">sua.loja</div>
                                    </div>

                                    {/* Image Area */}
                                    <div className="relative w-full aspect-[4/5] bg-neutral-800 group-hover:scale-[1.02] transition-transform duration-500">
                                        {campaign.channels.instagram.imageUrl ? (
                                            <img
                                                src={campaign.channels.instagram.imageUrl}
                                                alt="Instagram Post"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                                    <Instagram className="text-white/20" size={32} />
                                                </div>
                                                <p className="text-xs text-white/40 font-mono">{campaign.channels.instagram.imagePrompt}</p>
                                            </div>
                                        )}

                                        {/* Sticker Overlay */}
                                        {campaign.channels.instagram.sticker && (
                                            <div className="absolute bottom-4 right-4 max-w-[80%]">
                                                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2 rounded-xl shadow-lg transform rotate-2 hover:rotate-0 transition-transform">
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                                        {campaign.channels.instagram.sticker}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Bar Mockup */}
                                    <div className="px-4 py-3 flex justify-between items-center bg-neutral-900 text-white">
                                        <div className="flex gap-4">
                                            <div className="w-5 h-5 rounded-full border border-white" />
                                            <div className="w-5 h-5 rounded-full border border-white" />
                                            <div className="w-5 h-5 rounded-full border border-white" />
                                        </div>
                                        <div className="w-5 h-5 rounded-full border border-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Caption & Actions */}
                            <div className="flex-1 flex flex-col gap-4">
                                <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-6 relative group hover:border-white/10 transition-colors">
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={() => handleCopy(campaign.channels.instagram.copy, 'insta-copy')}
                                            className="p-2 rounded-lg bg-black/50 hover:bg-pink-500 text-white/50 hover:text-white transition-all"
                                            title="Copiar Legenda"
                                        >
                                            {copied === 'insta-copy' ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <h4 className="text-sm font-medium text-pink-400 mb-3 flex items-center gap-2">
                                        <Instagram size={14} /> Legenda do Post
                                    </h4>
                                    <div className="h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed font-light">
                                            {campaign.channels.instagram.copy}
                                        </p>
                                    </div>
                                </div>

                                {/* Prompt Info (Collapsed/Small) */}
                                <div className="bg-neutral-900/50 rounded-xl border border-white/5 p-4 flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                                        <Megaphone size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Prompt da Imagem</span>
                                        <p className="text-xs text-neutral-500 line-clamp-2 hover:line-clamp-none transition-all cursor-help">
                                            {campaign.channels.instagram.imagePrompt}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <motion.div
                            key="whatsapp"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex justify-center h-full items-start pt-4"
                        >
                            <div className="w-full max-w-md bg-[#0b141a] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[500px]">
                                {/* WhatsApp Header */}
                                <div className="bg-[#202c33] p-4 flex items-center gap-3 border-b border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-white text-xs">
                                        <Printer size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white text-sm font-medium">Cliente Vip</h4>
                                        <span className="text-[#8696a0] text-xs">online</span>
                                    </div>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 bg-[#0b141a] p-4 space-y-4 overflow-y-auto bg-opacity-90 relative"
                                    style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'overlay' }}>

                                    <div className="flex justify-center mb-4">
                                        <span className="bg-[#1f2c34] text-[#8696a0] text-[10px] uppercase font-bold px-2 py-1 rounded-lg shadow-sm">Hoje</span>
                                    </div>

                                    {/* Message Bubble */}
                                    <div className="bg-[#005c4b] rounded-lg rounded-tr-none p-3 shadow-md max-w-[85%] ml-auto relative group">
                                        <button
                                            onClick={() => handleCopy(campaign.channels.whatsapp.script, 'wa-script')}
                                            className="absolute -top-2 -right-2 p-1.5 bg-[#202c33] rounded-full text-white/50 hover:text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {copied === 'wa-script' ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                        <p className="text-sm text-[#e9edef] whitespace-pre-wrap leading-relaxed">
                                            {campaign.channels.whatsapp.script}
                                        </p>
                                        <div className="flex justify-end items-end gap-1 mt-1">
                                            <span className="text-[10px] text-[#8696a0]">10:42</span>
                                            <Check size={12} className="text-[#53bdeb]" />
                                        </div>
                                    </div>
                                </div>

                                {/* Trigger Info Footer */}
                                <div className="bg-[#202c33] p-3 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-[#8696a0]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Gatilho usado: <span className="text-white font-medium">{campaign.channels.whatsapp.trigger}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'physical' && (
                        <motion.div
                            key="physical"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center h-full"
                        >
                            <div className="w-full max-w-2xl flex-1 flex flex-col gap-6">
                                {/* Poster Visualization */}
                                {campaign.channels.physical.posterUrl ? (
                                    <div className="relative w-full aspect-[16/9] bg-neutral-800 rounded-xl overflow-hidden shadow-2xl group border border-white/10">
                                        <img
                                            src={campaign.channels.physical.posterUrl}
                                            alt="Poster Gerado"
                                            className="w-full h-full object-contain bg-neutral-900"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <button className="p-3 bg-white rounded-full text-black hover:bg-neutral-200 transition-colors">
                                                <Download size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleCopy(campaign.channels.physical.headline, 'poster-copy')}
                                                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                                            >
                                                {copied === 'poster-copy' ? <Check size={20} /> : <Copy size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white text-black p-8 rounded-xl shadow-2xl transform rotate-1 border-8 border-yellow-400 max-w-md mx-auto relative group">
                                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-md z-10" />
                                        <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-md z-10" />

                                        <h2 className="text-4xl font-black uppercase mb-2 tracking-tighter text-red-600 leading-none">
                                            {campaign.channels.physical.headline}
                                        </h2>
                                        <p className="text-xl font-bold mb-6 border-b-4 border-black pb-4">
                                            {campaign.channels.physical.subheadline}
                                        </p>
                                        <div className="bg-yellow-400 p-6 rounded-lg transform -rotate-1 mb-4 shadow-sm border-2 border-black border-dashed">
                                            <p className="text-3xl font-black text-center">{campaign.channels.physical.offer}</p>
                                        </div>
                                        <p className="text-sm font-bold opacity-60 mt-4 text-center uppercase tracking-widest">Oferta Limitada</p>
                                    </div>
                                )}

                                {/* Specs Card */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-orange-500/10 rounded-xl border border-orange-500/20 p-4">
                                        <h4 className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">Headline Principal</h4>
                                        <p className="text-sm text-white font-medium">{campaign.channels.physical.headline}</p>
                                    </div>
                                    <div className="bg-orange-500/10 rounded-xl border border-orange-500/20 p-4">
                                        <h4 className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">Instruções de Layout</h4>
                                        <p className="text-xs text-orange-200/80 leading-relaxed">{campaign.channels.physical.layout}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

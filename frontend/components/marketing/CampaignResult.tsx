"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Instagram, MessageCircle, Printer, Copy, Check, Megaphone, X, Sparkles, ChevronRight, Eye } from "lucide-react";
import { useState } from "react";

export function CampaignResult({ campaign }: { campaign: any }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'instagram' | 'whatsapp' | 'physical'>('instagram');
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    // Empty State
    if (!campaign || !campaign.channels) {
        return (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-white/5 bg-neutral-900/50 p-12 text-center backdrop-blur-sm min-h-[400px]">
                <div className="mb-6 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-8 shadow-inner shadow-white/5">
                    <Megaphone className="text-pink-400" size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Aguardando Campanha</h3>
                <p className="text-neutral-400 max-w-sm mx-auto">
                    Selecione produtos no Radar para a IA criar seus materiais de marketing.
                </p>
            </div>
        );
    }

    const tabs = [
        { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-500' },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500' },
        { id: 'physical', label: 'Ponto de Venda', icon: Printer, color: 'text-orange-500', bg: 'bg-orange-500' },
    ];

    return (
        <>
            {/* Preview Card - Always Visible */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-950 overflow-hidden shadow-2xl"
            >
                {/* Success Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/25">
                                <Sparkles size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Campanha Gerada!</h3>
                                <p className="text-sm text-neutral-400">Conteúdo pronto para 3 canais</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors shadow-lg"
                        >
                            <Eye size={16} />
                            Ver Campanha Completa
                        </button>
                    </div>
                </div>

                {/* Quick Preview */}
                <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                        {tabs.map((tab, i) => (
                            <motion.button
                                key={tab.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => { setActiveTab(tab.id as any); setIsModalOpen(true); }}
                                className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left"
                            >
                                <div className={`w-10 h-10 rounded-xl ${tab.bg}/20 flex items-center justify-center mb-3`}>
                                    <tab.icon size={20} className={tab.color} />
                                </div>
                                <h4 className="text-sm font-medium text-white mb-1">{tab.label}</h4>
                                <p className="text-xs text-neutral-500 line-clamp-2">
                                    {tab.id === 'instagram' && campaign.channels.instagram?.copy?.slice(0, 60) + '...'}
                                    {tab.id === 'whatsapp' && campaign.channels.whatsapp?.script?.slice(0, 60) + '...'}
                                    {tab.id === 'physical' && campaign.channels.physical?.headline}
                                </p>
                                <div className="flex items-center gap-1 mt-3 text-xs text-neutral-600 group-hover:text-pink-400 transition-colors">
                                    Ver detalhes <ChevronRight size={12} />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-5xl max-h-[90vh] bg-neutral-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-neutral-950/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600">
                                        <Sparkles size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Resultado da Campanha</h2>
                                        <p className="text-xs text-neutral-500">Explore o conteúdo gerado pela IA</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-2 p-3 bg-neutral-950/30 border-b border-white/5 shrink-0">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                                ? 'text-white bg-white/10'
                                                : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <tab.icon size={18} className={activeTab === tab.id ? tab.color : ''} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <AnimatePresence mode="wait">
                                    {/* Instagram Tab */}
                                    {activeTab === 'instagram' && (
                                        <motion.div
                                            key="instagram"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="grid lg:grid-cols-2 gap-8"
                                        >
                                            {/* Image Preview */}
                                            <div className="bg-neutral-950 rounded-2xl border border-white/5 p-6 flex items-center justify-center">
                                                {campaign.channels.instagram.imageUrl ? (
                                                    <div className="relative rounded-xl overflow-hidden shadow-2xl max-w-sm">
                                                        <img
                                                            src={campaign.channels.instagram.imageUrl}
                                                            alt="Instagram Post"
                                                            className="w-full h-auto"
                                                        />
                                                        {campaign.channels.instagram.sticker && (
                                                            <div className="absolute bottom-4 right-4">
                                                                <span className="bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1.5 rounded-lg text-xs font-bold text-white uppercase">
                                                                    {campaign.channels.instagram.sticker}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <Instagram className="mx-auto text-white/20 mb-4" size={48} />
                                                        <p className="text-sm text-neutral-500 max-w-xs mx-auto">{campaign.channels.instagram.imagePrompt}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Caption */}
                                            <div className="space-y-4">
                                                <div className="bg-white/5 rounded-2xl border border-white/5 p-6 relative">
                                                    <button
                                                        onClick={() => handleCopy(campaign.channels.instagram.copy, 'insta')}
                                                        className="absolute top-4 right-4 p-2 rounded-lg bg-pink-500/20 hover:bg-pink-500 text-pink-400 hover:text-white transition-all"
                                                    >
                                                        {copied === 'insta' ? <Check size={16} /> : <Copy size={16} />}
                                                    </button>
                                                    <h4 className="text-sm font-medium text-pink-400 mb-4 flex items-center gap-2">
                                                        <Instagram size={16} /> Legenda do Post
                                                    </h4>
                                                    <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                                                        {campaign.channels.instagram.copy}
                                                    </p>
                                                </div>

                                                <div className="bg-pink-500/5 rounded-xl border border-pink-500/10 p-4">
                                                    <h5 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2">Prompt da Imagem</h5>
                                                    <p className="text-xs text-neutral-500">{campaign.channels.instagram.imagePrompt}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* WhatsApp Tab */}
                                    {activeTab === 'whatsapp' && (
                                        <motion.div
                                            key="whatsapp"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="max-w-lg mx-auto"
                                        >
                                            <div className="bg-[#0b141a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                                                {/* Header */}
                                                <div className="bg-[#202c33] p-4 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-neutral-600 flex items-center justify-center">
                                                        <MessageCircle size={18} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-medium">Cliente VIP</h4>
                                                        <span className="text-[#8696a0] text-xs">online</span>
                                                    </div>
                                                </div>

                                                {/* Chat */}
                                                <div className="p-4 min-h-[300px]" style={{ background: '#0b141a url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'overlay' }}>
                                                    <div className="flex justify-center mb-4">
                                                        <span className="bg-[#1f2c34] text-[#8696a0] text-[10px] uppercase font-bold px-2 py-1 rounded">Hoje</span>
                                                    </div>
                                                    <div className="bg-[#005c4b] rounded-lg rounded-tr-none p-3 max-w-[85%] ml-auto relative group">
                                                        <button
                                                            onClick={() => handleCopy(campaign.channels.whatsapp.script, 'wa')}
                                                            className="absolute -top-2 -right-2 p-1.5 bg-[#202c33] rounded-full text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            {copied === 'wa' ? <Check size={12} /> : <Copy size={12} />}
                                                        </button>
                                                        <p className="text-sm text-[#e9edef] whitespace-pre-wrap">{campaign.channels.whatsapp.script}</p>
                                                        <div className="flex justify-end items-center gap-1 mt-1">
                                                            <span className="text-[10px] text-[#8696a0]">10:42</span>
                                                            <Check size={12} className="text-[#53bdeb]" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="bg-[#202c33] p-3 border-t border-white/5">
                                                    <div className="flex items-center gap-2 text-xs text-[#8696a0]">
                                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                                        Gatilho: <span className="text-white font-medium">{campaign.channels.whatsapp.trigger}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Physical Tab */}
                                    {activeTab === 'physical' && (
                                        <motion.div
                                            key="physical"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-6"
                                        >
                                            {/* Poster */}
                                            <div className="flex justify-center">
                                                {campaign.channels.physical.posterUrl ? (
                                                    <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10 max-w-2xl">
                                                        <img
                                                            src={campaign.channels.physical.posterUrl}
                                                            alt="Poster"
                                                            className="w-full h-auto"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="bg-white text-black p-8 rounded-xl shadow-2xl transform rotate-1 border-8 border-yellow-400 max-w-md">
                                                        <h2 className="text-4xl font-black uppercase mb-2 text-red-600">{campaign.channels.physical.headline}</h2>
                                                        <p className="text-xl font-bold mb-6 border-b-4 border-black pb-4">{campaign.channels.physical.subheadline}</p>
                                                        <div className="bg-yellow-400 p-6 rounded-lg -rotate-1 border-2 border-black border-dashed">
                                                            <p className="text-3xl font-black text-center">{campaign.channels.physical.offer}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                                <div className="bg-orange-500/10 rounded-xl border border-orange-500/20 p-4">
                                                    <h4 className="text-orange-400 text-xs font-bold uppercase mb-2">Headline</h4>
                                                    <p className="text-white font-medium">{campaign.channels.physical.headline}</p>
                                                </div>
                                                <div className="bg-orange-500/10 rounded-xl border border-orange-500/20 p-4">
                                                    <h4 className="text-orange-400 text-xs font-bold uppercase mb-2">Layout</h4>
                                                    <p className="text-xs text-orange-200/80">{campaign.channels.physical.layout}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

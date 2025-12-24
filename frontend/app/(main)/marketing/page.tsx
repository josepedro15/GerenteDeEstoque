"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Calendar, Package, Trash2, Eye, X, Instagram, MessageCircle, Printer, Copy, Check, Loader2, Save, FileText } from "lucide-react";
import { getAllCampaigns, deleteCampaign, SavedCampaign } from "@/app/actions/marketing";
import { cn } from "@/lib/utils";
import { TemplateSelector } from "@/components/marketing/TemplateSelector";
import { SaveTemplateDialog } from "@/components/marketing/SaveTemplateDialog";

export default function CampaignHistoryPage() {
    const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState<SavedCampaign | null>(null);
    const [activeTab, setActiveTab] = useState<'instagram' | 'whatsapp' | 'physical'>('instagram');
    const [copied, setCopied] = useState<string | null>(null);
    const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

    // Carregar campanhas
    useEffect(() => {
        async function loadCampaigns() {
            setLoading(true);
            try {
                const data = await getAllCampaigns(50);
                setCampaigns(data);
            } catch (err) {
                console.error("Erro ao carregar campanhas:", err);
            } finally {
                setLoading(false);
            }
        }
        loadCampaigns();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Deseja arquivar esta campanha?")) return;

        const success = await deleteCampaign(id);
        if (success) {
            setCampaigns(campaigns.filter(c => c.id !== id));
            if (selectedCampaign?.id === id) {
                setSelectedCampaign(null);
            }
        }
    };

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text || '');
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-background" />
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-7xl"
                >
                    {/* Header */}
                    <header className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                                <History size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                    Histórico de Campanhas
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {campaigns.length} campanha(s) gerada(s)
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <TemplateSelector onSelectTemplate={(t) => console.log('Template selected:', t)} />
                        </div>
                        <div className="mt-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    </header>

                    {/* Content */}
                    <div className="grid gap-6 lg:grid-cols-12">
                        {/* Lista de Campanhas */}
                        <div className="lg:col-span-5">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-3">
                                    <Loader2 size={32} className="animate-spin text-purple-400" />
                                    <span className="text-muted-foreground">Carregando campanhas...</span>
                                </div>
                            ) : campaigns.length === 0 ? (
                                <div className="rounded-2xl border border-border bg-card/50 p-12 text-center">
                                    <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                                        <History size={32} className="text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma campanha ainda</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Gere campanhas no Bate-papo para vê-las aqui.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {campaigns.map((campaign) => (
                                        <motion.div
                                            key={campaign.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "rounded-xl border p-4 cursor-pointer transition-all",
                                                selectedCampaign?.id === campaign.id
                                                    ? "border-purple-500 bg-purple-500/10"
                                                    : "border-border bg-card/50 hover:bg-card"
                                            )}
                                            onClick={() => setSelectedCampaign(campaign)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Calendar size={14} className="text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDate(campaign.created_at)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Package size={14} className="text-purple-400" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            {campaign.produtos?.length || 0} produto(s)
                                                        </span>
                                                    </div>
                                                    {campaign.produtos && campaign.produtos.length > 0 && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                            {campaign.produtos.map((p: any) => p.nome).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedCampaign(campaign); }}
                                                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-purple-400 transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id); }}
                                                        className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Detalhes da Campanha */}
                        <div className="lg:col-span-7">
                            {selectedCampaign ? (
                                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                                    {/* Header */}
                                    <div className="p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-foreground">Detalhes da Campanha</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(selectedCampaign.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSaveTemplateOpen(true)}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-foreground text-xs font-medium transition-colors"
                                                >
                                                    <Save size={14} />
                                                    <span className="hidden sm:inline">Salvar Template</span>
                                                </button>
                                                <button
                                                    onClick={() => setSelectedCampaign(null)}
                                                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground lg:hidden"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex border-b border-border">
                                        {[
                                            { id: 'instagram' as const, label: 'Instagram', icon: Instagram, color: 'text-pink-500', border: 'border-pink-500' },
                                            { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500', border: 'border-green-500' },
                                            { id: 'physical' as const, label: 'PDV', icon: Printer, color: 'text-orange-500', border: 'border-orange-500' },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                                                    activeTab === tab.id
                                                        ? `text-foreground border-b-2 ${tab.border}`
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
                                        {activeTab === 'instagram' && (
                                            <div className="space-y-4">
                                                <div className="bg-accent rounded-xl p-4 relative">
                                                    <button
                                                        onClick={() => handleCopy(selectedCampaign.instagram_copy || '', 'instagram')}
                                                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
                                                    >
                                                        {copied === 'instagram' ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                    <h4 className="text-xs font-medium text-pink-400 mb-2 flex items-center gap-1">
                                                        <Instagram size={12} /> Legenda
                                                    </h4>
                                                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                                                        {selectedCampaign.instagram_copy || 'Sem conteúdo'}
                                                    </p>
                                                </div>
                                                {selectedCampaign.instagram_image_prompt && (
                                                    <div className="bg-pink-500/5 rounded-xl p-3 border border-pink-500/10">
                                                        <h5 className="text-xs font-bold text-pink-400 uppercase mb-1">Prompt da Imagem</h5>
                                                        <p className="text-xs text-muted-foreground">{selectedCampaign.instagram_image_prompt}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

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
                                                                onClick={() => handleCopy(selectedCampaign.whatsapp_script || '', 'whatsapp')}
                                                                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-[#202c33] text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                {copied === 'whatsapp' ? <Check size={12} /> : <Copy size={12} />}
                                                            </button>
                                                            <p className="text-sm text-[#e9edef] whitespace-pre-wrap">
                                                                {selectedCampaign.whatsapp_script || 'Sem conteúdo'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedCampaign.whatsapp_trigger && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Gatilho: <span className="text-green-400">{selectedCampaign.whatsapp_trigger}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'physical' && (
                                            <div className="space-y-4">
                                                <div className="bg-white text-black p-6 rounded-xl border-4 border-yellow-400 text-center">
                                                    <h2 className="text-2xl font-black uppercase text-red-600 mb-2">
                                                        {selectedCampaign.physical_headline || 'PROMOÇÃO'}
                                                    </h2>
                                                    <p className="text-lg font-bold border-b-2 border-black pb-2 mb-4">
                                                        {selectedCampaign.physical_subheadline || 'Aproveite!'}
                                                    </p>
                                                    <div className="bg-yellow-400 p-4 rounded-lg border-2 border-dashed border-black">
                                                        <p className="text-xl font-black">
                                                            {selectedCampaign.physical_offer || 'Oferta Especial'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleCopy(
                                                        `${selectedCampaign.physical_headline}\n${selectedCampaign.physical_subheadline}\n${selectedCampaign.physical_offer}`,
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
                            ) : (
                                <div className="rounded-2xl border border-border bg-card/50 p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                                    <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                                        <Eye size={32} className="text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground mb-2">Selecione uma campanha</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Clique em uma campanha à esquerda para ver os detalhes.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            <SaveTemplateDialog
                campaign={selectedCampaign}
                open={saveTemplateOpen}
                onOpenChange={setSaveTemplateOpen}
                onSaved={() => {
                    // Opcional: mostrar toast de sucesso
                }}
            />
        </div >
    );
}

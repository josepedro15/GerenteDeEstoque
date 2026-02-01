"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { History, Calendar, Package, Trash2, Eye, X, Loader2, Plus, TrendingUp } from "lucide-react";
import { getAllCampaigns, deleteCampaign, SavedCampaign } from "@/app/actions/marketing";
import { cn } from "@/lib/utils";
import { CampaignViewer } from "@/components/marketing/CampaignViewer";

export default function CampaignHistoryPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState<SavedCampaign | null>(null);


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

            <div className="p-4 sm:p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-7xl"
                >
                    {/* Header */}
                    <header className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                                    <History size={24} className="sm:hidden text-white" />
                                    <History size={28} className="hidden sm:block text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                                        Histórico de Campanhas
                                    </h1>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {campaigns.length} campanha(s) gerada(s)
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/chat')}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25 w-full sm:w-auto"
                            >
                                <Plus size={18} />
                                Gerar Nova Campanha
                            </button>
                        </div>
                        <div className="mt-4 sm:mt-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
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
                        <div className="lg:col-span-7 h-full flex flex-col">
                            {selectedCampaign ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full max-h-[calc(100vh-10rem)] shadow-sm"
                                >
                                    {/* Header */}
                                    <div className="p-4 border-b border-border bg-gradient-to-r from-purple-500/5 to-pink-500/5 flex-shrink-0">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                                                    {selectedCampaign.campaign_data?.report.title || 'Detalhes da Campanha'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {formatDate(selectedCampaign.created_at)}
                                                    </p>
                                                    {selectedCampaign.campaign_data && (
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium border border-purple-200">
                                                            IA V2
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedCampaign(null)}
                                                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground lg:hidden"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content Scrollable Area */}
                                    <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-muted/5 scrollbar-thin">
                                        {selectedCampaign.campaign_data ? (
                                            <CampaignViewer strategy={selectedCampaign.campaign_data} />
                                        ) : (
                                            <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                                <p className="font-medium mb-1">Visualização detalhada indisponível</p>
                                                <p className="text-sm opacity-70">Esta campanha foi criada em uma versão anterior do sistema.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="rounded-2xl border border-border bg-card/30 p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px] border-dashed">
                                    <div className="mx-auto w-20 h-20 rounded-full bg-purple-500/5 flex items-center justify-center mb-6 ring-1 ring-purple-500/20">
                                        <Eye size={36} className="text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground mb-2">Selecione uma campanha</h3>
                                    <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                                        Clique em uma campanha na lista à esquerda para ver os detalhes completos, estratégias e criativos.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

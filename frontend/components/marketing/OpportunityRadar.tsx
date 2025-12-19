"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingDown, X, Loader2, CheckCircle2, Megaphone, AlertCircle, Search } from "lucide-react";
import { generateCampaign, getExcessStockProducts, ProductCandidate } from "@/app/actions/marketing";

// UI Components for the Modal
function StartCampaignButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group flex w-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/20 bg-accent p-12 transition-all hover:bg-accent hover:border-pink-500/50"
        >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-500/10 text-pink-500 group-hover:scale-110 transition-transform">
                <Megaphone size={40} />
            </div>
            <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground">Criar Nova Campanha</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    Selecione manualmente os produtos com excesso de estoque e deixe a IA criar todo o material de divulgação.
                </p>
            </div>
        </button>
    );
}

function ProductListSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 w-full rounded-xl bg-accent animate-pulse" />
            ))}
        </div>
    );
}

export function OpportunityRadar({ onCampaignGenerated }: { onCampaignGenerated: (data: any) => void }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [products, setProducts] = useState<ProductCandidate[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");

    // Fetch products when modal opens
    useEffect(() => {
        if (isModalOpen) {
            setLoading(true);
            setSearchTerm(""); // Reset search on open
            getExcessStockProducts()
                .then(data => setProducts(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isModalOpen]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelect = (id: string) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(i => i !== id));
        } else {
            if (selected.length >= 10) return; // Max 10 limit
            setSelected([...selected, id]);
        }
    };

    const handleGenerate = async () => {
        if (selected.length === 0) return;
        setGenerating(true);
        try {
            const result = await generateCampaign(selected);
            onCampaignGenerated(result);
            setIsModalOpen(false); // Close on success
        } catch (error) {
            console.error("Failed to generate:", error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <>
            {/* Main Trigger */}
            <StartCampaignButton onClick={() => setIsModalOpen(true)} />

            {/* Selection Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-background shadow-2xl h-[600px] flex flex-col"
                        >
                            {/* Header */}
                            <div className="shrink-0 border-b border-border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Selecionar Produtos (Excesso)</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Escolha até 10 itens para a campanha. ({selected.length}/10)
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar produto..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-accent py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                                {loading ? (
                                    <ProductListSkeleton />
                                ) : filteredProducts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <AlertCircle size={32} className="mb-2" />
                                        <p>Nenhum produto encontrado.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredProducts.map((item) => {
                                            const isSelected = selected.includes(item.id);
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleSelect(item.id)}
                                                    className={`cursor-pointer group relative flex items-center justify-between overflow-hidden rounded-xl border p-4 transition-all ${isSelected
                                                        ? "border-pink-500 bg-pink-500/10"
                                                        : "border-border bg-accent hover:bg-accent hover:border-white/20"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg bg-accent text-muted-foreground group-hover:text-foreground`}>
                                                            <TrendingDown size={18} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{item.name}</h4>
                                                            <p className="text-xs text-muted-foreground">Cobertura: {item.coverage} dias • Estoque: {item.stock}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-semibold text-foreground">R$ {item.price.toFixed(2)}</span>
                                                        <div className={`h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-pink-500 bg-pink-500 text-foreground' : 'border-white/20'
                                                            }`}>
                                                            {isSelected && <CheckCircle2 size={14} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-border p-6 bg-muted">
                                <button
                                    onClick={handleGenerate}
                                    disabled={selected.length === 0 || generating}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 py-4 font-bold text-foreground transition-all hover:bg-pink-500 hover:shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                                    {generating ? "Gerando Campanha..." : `Gerar Campanha (${selected.length})`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

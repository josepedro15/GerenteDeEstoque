"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Loader2, Check, Star } from "lucide-react";
import { getUserTemplates, getPublicTemplates, deleteTemplate, type CampaignTemplate } from "@/app/actions/templates";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
    onSelectTemplate: (template: CampaignTemplate) => void;
    className?: string;
}

export function TemplateSelector({ onSelectTemplate, className }: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
    const [publicTemplates, setPublicTemplates] = useState<CampaignTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'mine' | 'public'>('mine');

    useEffect(() => {
        async function loadTemplates() {
            setIsLoading(true);
            try {
                const [mine, shared] = await Promise.all([
                    getUserTemplates(),
                    getPublicTemplates()
                ]);
                setTemplates(mine);
                setPublicTemplates(shared);
            } catch (error) {
                console.error("Error loading templates:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const handleDelete = async (templateId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir este template?")) return;

        const success = await deleteTemplate(templateId);
        if (success) {
            setTemplates(prev => prev.filter(t => t.id !== templateId));
        }
    };

    const handleSelect = (template: CampaignTemplate) => {
        onSelectTemplate(template);
        setIsOpen(false);
    };

    const currentList = activeTab === 'mine' ? templates : publicTemplates;

    return (
        <div className={cn("relative", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-sm"
            >
                <FileText size={16} className="text-indigo-400" />
                <span>Templates</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-border bg-muted/50">
                            <h3 className="font-semibold text-sm">Templates de Campanha</h3>
                            <p className="text-xs text-muted-foreground">Reutilize configurações de campanhas anteriores</p>
                        </div>

                        <div className="flex border-b border-border">
                            <button
                                onClick={() => setActiveTab('mine')}
                                className={cn(
                                    "flex-1 px-4 py-2 text-xs font-medium transition-colors",
                                    activeTab === 'mine'
                                        ? "bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Meus Templates ({templates.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('public')}
                                className={cn(
                                    "flex-1 px-4 py-2 text-xs font-medium transition-colors",
                                    activeTab === 'public'
                                        ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Star size={12} className="inline mr-1" />
                                Públicos ({publicTemplates.length})
                            </button>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : currentList.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground text-sm">
                                    <FileText className="mx-auto h-8 w-8 mb-2 opacity-30" />
                                    <p>Nenhum template encontrado</p>
                                    {activeTab === 'mine' && (
                                        <p className="text-xs mt-1">Salve sua primeira campanha como template!</p>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {currentList.map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleSelect(template)}
                                            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-sm truncate text-foreground">
                                                        {template.name}
                                                    </p>
                                                    {template.description && (
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                            {template.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {template.usage_count > 0 && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                Usado {template.usage_count}x
                                                            </span>
                                                        )}
                                                        {template.is_public && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                                                                Público
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 ml-2">
                                                    {activeTab === 'mine' && (
                                                        <button
                                                            onClick={(e) => handleDelete(template.id, e)}
                                                            className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                    <Check size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

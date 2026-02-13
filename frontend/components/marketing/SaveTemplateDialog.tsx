"use client";

import { useState } from "react";
import { X, Save, Loader2, FileText } from "lucide-react";
import { createTemplate } from "@/app/actions/templates";
import type { SavedCampaign } from "@/app/actions/marketing";
import { cn } from "@/lib/utils";

interface SaveTemplateDialogProps {
    campaign: SavedCampaign | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export function SaveTemplateDialog({ campaign, open, onOpenChange, onSaved }: SaveTemplateDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!open) return null;

    const handleSave = async () => {
        if (!campaign || !name.trim()) return;

        setIsLoading(true);
        try {
            const templateData = {
                channels: {
                    instagram: {
                        copyTemplate: campaign.instagram_copy || undefined,
                        imagePromptTemplate: campaign.instagram_image_prompt || undefined
                    },
                    whatsapp: {
                        scriptTemplate: campaign.whatsapp_script || undefined,
                        triggerTemplate: campaign.whatsapp_trigger || undefined
                    },
                    physical: {
                        headlineTemplate: campaign.physical_headline || undefined,
                        subheadlineTemplate: campaign.physical_subheadline || undefined,
                        offerTemplate: campaign.physical_offer || undefined
                    }
                },
                context: campaign.analise_dados?.sugestao || "Template gerado a partir de campanha"
            };

            const result = await createTemplate(name, description, templateData, isPublic);

            if (result.success) {
                onSaved();
                onOpenChange(false);
                setName("");
                setDescription("");
                setIsPublic(false);
            } else {
                alert(`Erro ao salvar template: ${result.error}`);
            }
        } catch (error) {
            console.error("Error saving template:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <FileText size={18} className="text-purple-400" />
                        Salvar como Template
                    </h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nome do Template</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Queima de Estoque Verão"
                            className="w-full h-10 rounded-lg border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 transition-shadow"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o propósito deste template..."
                            className="w-full min-h-[80px] rounded-lg border border-border bg-muted p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 transition-shadow"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-foreground">Template Público</label>
                            <p className="text-xs text-muted-foreground">
                                Compartilhar este template com outros usuários
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPublic(!isPublic)}
                            className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
                                isPublic ? "bg-purple-600" : "bg-zinc-700"
                            )}
                        >
                            <span
                                className={cn(
                                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                    isPublic ? "translate-x-5" : "translate-x-0"
                                )}
                            />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end gap-2">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !name.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Salvar Template
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

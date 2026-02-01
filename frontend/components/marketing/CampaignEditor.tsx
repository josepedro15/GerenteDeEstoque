"use client";

import { useState, useEffect } from "react";
import { CampaignStrategy } from "@/app/actions/marketing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, Copy, Check, MessageCircle, Instagram, Store, CalendarDays, Printer, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUpcomingSeasonality, SeasonalityEvent } from "@/lib/seasonality";
import { TimelineVisualizer } from "@/components/marketing/TimelineVisualizer";
import { BudgetOptimizer, BudgetStrategy } from "@/components/marketing/BudgetOptimizer";

interface CampaignEditorProps {
    strategy: CampaignStrategy;
    onBack: () => void;
    onSend: (finalStrategy: CampaignStrategy, visualUrl?: string) => void;
    isSending: boolean;
}

export function CampaignEditor({ strategy, onBack, onSend, isSending }: CampaignEditorProps) {
    const [editableStrategy, setEditableStrategy] = useState<CampaignStrategy>(strategy);
    const [activeTab, setActiveTab] = useState("report");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [upcomingEvent, setUpcomingEvent] = useState<SeasonalityEvent | null>(null);

    useEffect(() => {
        const events = getUpcomingSeasonality();
        if (events.length > 0 && events[0].daysUntil <= 60) {
            setUpcomingEvent(events[0]);
        }
    }, []);

    // State for Visuals
    const [generatingVisual, setGeneratingVisual] = useState<'instagram' | 'physical' | null>(null);
    const [visuals, setVisuals] = useState<{ instagram?: string, physical?: string }>({});
    const [visualCandidates, setVisualCandidates] = useState<{ instagram?: (string | null)[], physical?: (string | null)[] }>({});

    // Action: Generate Image
    const handleGenerateImage = async (type: 'instagram' | 'physical') => {
        const prompt = type === 'instagram'
            ? editableStrategy.channels.instagram.image_prompt
            : editableStrategy.channels.physical.image_prompt;

        if (!prompt) {
            alert("Prompt de imagem não encontrado.");
            return;
        }

        setGeneratingVisual(type);
        try {
            const { generateMarketingImage } = await import("@/app/actions/nanobanana");
            // Map 'physical' UI type to 'pdv' API type
            const apiType = type === 'physical' ? 'pdv' : type;
            const result = await generateMarketingImage(prompt, apiType);

            if (result.success && result.imageUrl) {
                setVisuals(prev => ({ ...prev, [type]: result.imageUrl }));
            } else {
                alert("Erro ao gerar imagem: " + (result.error || "Desconhecido"));
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao conectar com API.");
        } finally {
            setGeneratingVisual(null);
        }
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const updateChannel = (channel: 'whatsapp' | 'instagram' | 'physical', field: string, value: string) => {
        setEditableStrategy(prev => ({
            ...prev,
            channels: {
                ...prev.channels,
                [channel]: {
                    ...prev.channels[channel as keyof typeof prev.channels],
                    [field]: value
                }
            }
        }));
    };

    const handlePriceUpdate = (index: number, field: string, value: string | number) => {
        const newPricing = [...(editableStrategy.pricing_strategy || [])];
        newPricing[index] = { ...newPricing[index], [field]: value };
        setEditableStrategy(prev => ({ ...prev, pricing_strategy: newPricing }));
    };

    const renderWhatsAppPreview = (text: string) => {
        // Simple bold parser for *text*
        // Note: property is 'script' (fixed typo from backend)
        const parts = text.split(/(\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('*') && part.endsWith('*')) {
                return <b key={i}>{part.slice(1, -1)}</b>;
            }
            return part;
        });
    };

    const handleExport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Relatório: ${editableStrategy.report.title}</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
                        h1 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                        h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                        .metric { display: inline-block; background: #f4f4f5; padding: 10px 15px; border-radius: 8px; margin-right: 10px; font-size: 14px; }
                        .metric strong { display: block; font-size: 18px; color: #000; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
                        th { text-align: left; border-bottom: 2px solid #ddd; padding: 8px; background: #f9f9f9; }
                        td { border-bottom: 1px solid #eee; padding: 8px; }
                        .tactic { font-style: italic; color: #666; }
                        .channel-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-top: 15px; background: #fff; }
                        .channel-header { font-weight: bold; color: #555; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${editableStrategy.report.title}</h1>
                    <p style="font-size: 1.1em; color: #555;">${editableStrategy.report.hook}</p>
                    
                    <div style="margin: 20px 0;">
                        <div class="metric">Público-Alvo: <strong>${editableStrategy.report.target_audience}</strong></div>
                    </div>

                    <h2>🛒 Estratégia de Preços & Produtos</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th style="text-align: right;">Custo</th>
                                <th style="text-align: right;">Preço Sugerido</th>
                                <th style="text-align: right;">Margem</th>
                                <th style="text-align: right;">Desc.</th>
                                <th>Tática</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${editableStrategy.pricing_strategy?.map(item => `
                                <tr>
                                    <td>${item.product_name}</td>
                                    <td style="text-align: right;">R$ ${item.cost}</td>
                                    <td style="text-align: right; font-weight: bold;">R$ ${item.suggested_price}</td>
                                    <td style="text-align: right;">${item.margin_percent}%</td>
                                    <td style="text-align: right; color: red;">-${item.discount_percent}%</td>
                                    <td class="tactic">${item.tactic}</td>
                                </tr>
                            `).join('') || ''}
                        </tbody>
                    </table>

                    <h2>📢 Canais de Divulgação</h2>
                    
                    <div class="channel-box">
                        <div class="channel-header">📱 WhatsApp</div>
                        <p style="white-space: pre-wrap; font-family: monospace; background: #f0fdf4; padding: 10px; border-radius: 5px;">${editableStrategy.channels.whatsapp.script}</p>
                        <p style="font-size: 0.8em; color: #666; margin-top:5px;">Gatilho: ${editableStrategy.channels.whatsapp.trigger}</p>
                    </div>

                    <div class="channel-box">
                        <div class="channel-header">📸 Instagram</div>
                        <p style="white-space: pre-wrap;">${editableStrategy.channels.instagram.copy}</p>
                        <div style="margin-top: 10px; padding: 10px; background: #fdf2f8; border-radius: 5px; font-size: 0.9em;">
                            <strong>Prompt Imagem:</strong> ${editableStrategy.channels.instagram.image_prompt}
                        </div>
                    </div>

                    <div class="channel-box">
                        <div class="channel-header">🏪 Loja Física (PDV)</div>
                        <h3 style="margin: 5px 0;">${editableStrategy.channels.physical.headline}</h3>
                        <p>${editableStrategy.channels.physical.subheadline}</p>
                        <p style="color: #dc2626; font-weight: bold; font-size: 1.2em;">${editableStrategy.channels.physical.offer}</p>
                    </div>

                    <div style="margin-top: 40px; text-align: center; color: #999; font-size: 0.8em;">
                        Gerado por Gerente de Estoque AI • ${new Date().toLocaleDateString()}
                    </div>
                    
                    <script>
                        setTimeout(() => { window.print(); }, 500);
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    <ArrowLeft size={16} /> Voltar
                </Button>
                <div className="flex items-center gap-3">
                    {upcomingEvent && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold border border-amber-200 animate-pulse">
                            <CalendarDays size={14} />
                            {upcomingEvent.name} em {upcomingEvent.daysUntil} dias ({upcomingEvent.date.getDate()}/{upcomingEvent.date.getMonth() + 1})
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="gap-2"
                        title="Imprimir ou Salvar PDF"
                    >
                        <Printer size={16} />
                        <span className="hidden sm:inline">Relatório</span>
                    </Button>
                    <Button
                        onClick={() => {
                            // Prioritize Instagram visual, then physical
                            const visualToSend = visuals.instagram || visuals.physical;
                            onSend(editableStrategy, visualToSend);
                        }}
                        disabled={isSending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-900/20"
                    >
                        <Send size={16} />
                        {isSending ? "Enviando..." : "Enviar para Marketing"}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
                    <TabsTrigger value="report">Estratégia</TabsTrigger>
                    <TabsTrigger value="dissemination">Divulgação</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                    <TabsTrigger value="instagram">Instagram</TabsTrigger>
                    <TabsTrigger value="physical">Loja Física</TabsTrigger>
                </TabsList>

                {/* STRATEGY REPORT TAB */}
                <TabsContent value="report" className="mt-6 space-y-6">
                    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold flex items-center justify-between">
                                {strategy.report.title}
                                <Badge variant="outline" className="text-blue-600 border-blue-200">Estratégia</Badge>
                            </CardTitle>
                            <CardDescription>Análise da Campanha Gerada pela IA</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-background rounded-lg border shadow-sm">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Público-Alvo</h3>
                                    <p className="text-foreground font-medium">{editableStrategy.report.target_audience}</p>
                                </div>
                                <div className="p-4 bg-background rounded-lg border shadow-sm">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Gancho (Hook)</h3>
                                    <p className="text-foreground font-medium text-emerald-600">{editableStrategy.report.hook}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-background rounded-lg border shadow-sm">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Análise de Coerência (Mix)</h3>
                                <p className="leading-relaxed">{editableStrategy.report.coherence_analysis}</p>
                            </div>

                            <div className="p-4 bg-background rounded-lg border shadow-sm">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">ESTRATÉGIA DE PRECIFICAÇÃO (Editável)</h3>
                                {editableStrategy.pricing_strategy && editableStrategy.pricing_strategy.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
                                                    <th className="text-left py-2 font-medium w-[200px]">Produto</th>
                                                    <th className="text-right py-2 font-medium w-[100px]">Custo</th>
                                                    <th className="text-right py-2 font-medium w-[100px]">Preço Orig.</th>
                                                    <th className="text-right py-2 font-medium w-[120px]">Sugestão</th>
                                                    <th className="text-right py-2 font-medium w-[80px]">Desc. %</th>
                                                    <th className="text-right py-2 font-medium w-[80px]">Margem %</th>
                                                    <th className="text-left pl-4 py-2 font-medium">Tática</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {editableStrategy.pricing_strategy.map((item, idx) => (
                                                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                                                        <td className="py-2 pr-2 font-medium">{item.product_name}</td>
                                                        <td className="text-right py-2 px-1">
                                                            <Input
                                                                type="number"
                                                                className="h-8 w-full text-right"
                                                                value={item.cost}
                                                                onChange={e => handlePriceUpdate(idx, 'cost', Number(e.target.value))}
                                                            />
                                                        </td>
                                                        <td className="text-right py-2 px-1 text-muted-foreground line-through">
                                                            R$ {item.original_price?.toFixed(2)}
                                                        </td>
                                                        <td className="text-right py-2 px-1">
                                                            <Input
                                                                type="number"
                                                                className="h-8 w-full text-right font-bold text-emerald-600"
                                                                value={item.suggested_price}
                                                                onChange={e => handlePriceUpdate(idx, 'suggested_price', Number(e.target.value))}
                                                            />
                                                        </td>
                                                        <td className="text-right py-2 px-1">
                                                            <Input
                                                                type="number"
                                                                className="h-8 w-full text-right text-red-500"
                                                                value={item.discount_percent}
                                                                onChange={e => handlePriceUpdate(idx, 'discount_percent', Number(e.target.value))}
                                                            />
                                                        </td>
                                                        <td className="text-right py-2 px-1">
                                                            <div className="flex items-center justify-end h-8 text-xs">{item.margin_percent}%</div>
                                                        </td>
                                                        <td className="pl-4 py-2">
                                                            <Input
                                                                className="h-8 w-full text-xs italic"
                                                                value={item.tactic}
                                                                onChange={e => handlePriceUpdate(idx, 'tactic', e.target.value)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground italic">Nenhuma estratégia de preço detalhada disponível para este relatório.</p>
                                )}
                            </div>

                            <div className="p-4 bg-background rounded-lg border shadow-sm">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Feedback do Mix ABC</h3>
                                <div className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                    <p className="text-sm">{editableStrategy.report.mix_feedback}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB: DISSEMINATION --- */}
                <TabsContent value="dissemination" className="mt-6 space-y-6">
                    <Card className="border-indigo-100 dark:border-indigo-900/50">
                        <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 pb-4">
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                <Send size={20} />
                                <CardTitle>Estratégia de Divulgação</CardTitle>
                            </div>
                            <CardDescription>Canais, Táticas e Cronograma</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pt-6 space-y-6">
                            {editableStrategy.dissemination_strategy ? (
                                <>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-muted-foreground">Canais Sugeridos</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {editableStrategy.dissemination_strategy.channels?.map((channel, i) => (
                                                    <Badge key={i} variant="secondary" className="px-3 py-1">{channel}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        {editableStrategy.dissemination_strategy.estimated_reach && (
                                            <div className="p-4 bg-muted/30 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-1">Alcance Estimado</h3>
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="text-indigo-600" size={20} />
                                                    <span className="text-lg font-bold">{editableStrategy.dissemination_strategy.estimated_reach}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-muted-foreground">Alocação de Verba (Sugestão)</h3>
                                            <h3 className="text-sm font-semibold text-muted-foreground">Alocação de Verba (Sugestão)</h3>
                                            <BudgetOptimizer
                                                value={editableStrategy.dissemination_strategy.budget_allocation}
                                                onChange={newBudget => setEditableStrategy(prev => ({
                                                    ...prev,
                                                    dissemination_strategy: {
                                                        ...prev.dissemination_strategy!,
                                                        budget_allocation: newBudget
                                                    }
                                                }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground">Táticas de Tráfego & Engajamento</h3>
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                            {editableStrategy.dissemination_strategy.tactics?.map((tactic, i) => (
                                                <li key={i}>{tactic}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground">Cronograma (Timeline)</h3>
                                        <TimelineVisualizer
                                            events={editableStrategy.dissemination_strategy.timeline}
                                            onChange={newEvents => setEditableStrategy(prev => ({
                                                ...prev,
                                                dissemination_strategy: {
                                                    ...prev.dissemination_strategy!,
                                                    timeline: newEvents
                                                }
                                            }))}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>Nenhuma estratégia de divulgação gerada. Gere a campanha novamente para incluir este módulo.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB: WHATSAPP --- */}
                <TabsContent value="whatsapp" className="mt-6 grid md:grid-cols-2 gap-6">
                    <Card className="flex flex-col h-full border-emerald-100 dark:border-emerald-900/50">
                        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 pb-4">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                <MessageCircle size={20} />
                                <CardTitle>WhatsApp</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Gatilho de Envio</label>
                                <Input
                                    value={editableStrategy.channels.whatsapp.trigger}
                                    onChange={(e) => updateChannel('whatsapp', 'trigger', e.target.value)}
                                    className="bg-muted/30"
                                />
                            </div>
                            <div className="space-y-2 flex-1 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-muted-foreground">Mensagem (Script)</label>
                                    <div className="flex items-center gap-2">
                                        {editableStrategy.channels.whatsapp.script_options?.map((opt, idx) => (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[10px] px-2"
                                                onClick={() => updateChannel('whatsapp', 'script', opt)}
                                            >
                                                Opção {idx + 1}
                                            </Button>
                                        ))}
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(editableStrategy.channels.whatsapp?.script || '', 'wa')}>
                                            {copiedField === 'wa' ? <Check size={12} /> : <Copy size={12} />}
                                        </Button>
                                    </div>
                                </div>
                                <Textarea
                                    value={editableStrategy.channels.whatsapp?.script || ''}
                                    onChange={(e) => updateChannel('whatsapp', 'script', e.target.value)}
                                    className="min-h-[300px] flex-1 font-mono text-sm bg-stone-50 dark:bg-stone-900/50 leading-relaxed p-4 border-stone-200"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="bg-slate-100 rounded-3xl p-4 border-4 border-slate-200 h-fit max-w-sm mx-auto shadow-xl">
                        <div className="bg-[#DCF8C6] rounded-lg p-3 text-sm shadow-sm relative text-black mb-2">
                            <p className="whitespace-pre-wrap">
                                {renderWhatsAppPreview(editableStrategy.channels.whatsapp?.script || '')}
                            </p>
                            <span className="text-[10px] text-gray-500 block text-right mt-1">10:42</span>
                        </div>
                    </div>
                </TabsContent>

                {/* --- TAB: INSTAGRAM --- */}
                <TabsContent value="instagram" className="mt-6 space-y-6">
                    <Card className="flex flex-col h-full border-pink-100 dark:border-pink-900/50">
                        <CardHeader className="bg-pink-50/50 dark:bg-pink-950/20 pb-4">
                            <div className="flex items-center gap-2 text-pink-700 dark:text-pink-400">
                                <Instagram size={20} />
                                <CardTitle>Instagram</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-6 space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-muted-foreground">Legenda (Copy)</label>
                                    <div className="flex gap-1">
                                        {editableStrategy.channels.instagram.copy_options?.map((opt, idx) => (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[10px] px-2"
                                                onClick={() => updateChannel('instagram', 'copy', opt)}
                                            >
                                                Opção {idx + 1}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <Textarea
                                    value={editableStrategy.channels.instagram.copy}
                                    onChange={(e) => updateChannel('instagram', 'copy', e.target.value)}
                                    className="min-h-[150px] text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Prompt para Imagem (IA)</label>
                                <Textarea
                                    value={editableStrategy.channels.instagram.image_prompt}
                                    onChange={(e) => updateChannel('instagram', 'image_prompt', e.target.value)}
                                    className="min-h-[80px] text-xs bg-muted/30 font-mono text-muted-foreground"
                                    placeholder="Prompt em inglês para gerar a imagem..."
                                />
                            </div>

                            {/* --- Image Generation Options --- */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-muted-foreground">Opções Visuais (IA)</h3>
                                    <Button
                                        size="sm"
                                        onClick={async () => {
                                            if (!editableStrategy.channels.instagram.image_options) {
                                                // Fallback if options missing
                                                handleGenerateImage('instagram');
                                                return;
                                            }

                                            setGeneratingVisual('instagram');
                                            try {
                                                const { generateMarketingImage } = await import("@/app/actions/nanobanana");

                                                // Generate for all 3 options
                                                const promises = editableStrategy.channels.instagram.image_options.map(async (opt, idx) => {
                                                    // Add delay to avoid rate limits if necessary, or just parallel
                                                    const res = await generateMarketingImage(opt.prompt, 'instagram');
                                                    return { idx, url: res.imageUrl };
                                                });

                                                const results = await Promise.all(promises);

                                                // Update visuals state with multiple images
                                                // We'll store them as active options in a temporary state or just override visual.instagram for selected
                                                // Let's create a new state for 'candidates'
                                                const newCandidates = { ...visualCandidates };
                                                newCandidates.instagram = results.map(r => r.url || null);
                                                setVisualCandidates(newCandidates);

                                                // Default select headers
                                                if (results[0].url) {
                                                    setVisuals(prev => ({ ...prev, instagram: results[0].url }));
                                                }

                                            } catch (e) {
                                                console.error(e);
                                                alert("Erro ao gerar imagens.");
                                            } finally {
                                                setGeneratingVisual(null);
                                            }
                                        }}
                                        disabled={generatingVisual === 'instagram'}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white h-7 text-xs"
                                    >
                                        <Sparkles size={12} className="mr-1" />
                                        {generatingVisual === 'instagram' ? "Gerando Variações..." : "Gerar 3 Opções"}
                                    </Button>
                                </div>

                                {editableStrategy.channels.instagram.image_options && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {editableStrategy.channels.instagram.image_options.map((option, idx) => {
                                            const candidateUrl = visualCandidates.instagram?.[idx];
                                            const isSelected = visuals.instagram === candidateUrl && candidateUrl;

                                            // Fallback for prompt display if no image yet
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => candidateUrl && setVisuals(prev => ({ ...prev, instagram: candidateUrl }))}
                                                    className={cn(
                                                        "relative group cursor-pointer rounded-lg border-2 transition-all overflow-hidden aspect-square bg-muted/20 flex flex-col",
                                                        isSelected ? "border-purple-500 ring-2 ring-purple-200" : "border-transparent hover:border-purple-300"
                                                    )}
                                                >
                                                    {candidateUrl ? (
                                                        <>
                                                            <img src={candidateUrl} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1 shadow-md">
                                                                    <Check size={12} />
                                                                </div>
                                                            )}
                                                            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-white text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {option.title}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex-1 p-3 flex flex-col justify-between">
                                                            <div>
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conceito {idx + 1}</span>
                                                                <p className="text-xs font-semibold leading-tight mt-1 text-foreground/80">{option.title}</p>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground line-clamp-4 italic bg-white/50 p-1 rounded">
                                                                "{option.prompt}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Selected Large Preview (Optional, or just keep what was there but updated) */}
                                {visuals.instagram && !editableStrategy.channels.instagram.image_options && (
                                    <div className="border rounded-xl p-4 flex flex-col items-center justify-center bg-muted/10 min-h-[200px]">
                                        <img src={visuals.instagram} alt="Instagram Art" className="rounded-lg shadow-md w-full object-cover max-h-[400px]" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB: PHYSICAL (PDV) --- */}
                <TabsContent value="physical" className="mt-6 space-y-6">
                    <Card className="flex flex-col h-full border-orange-100 dark:border-orange-900/50">
                        <CardHeader className="bg-orange-50/50 dark:bg-orange-950/20 pb-4">
                            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                                <Store size={20} />
                                <CardTitle>Ponto de Venda</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Manchete (Cartaz)</label>
                                <Input
                                    value={editableStrategy.channels.physical.headline}
                                    onChange={(e) => updateChannel('physical', 'headline', e.target.value)}
                                    className="font-bold text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Oferta Principal</label>
                                <Input
                                    value={editableStrategy.channels.physical.offer}
                                    onChange={(e) => updateChannel('physical', 'offer', e.target.value)}
                                    className="text-red-500 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Sub-título / Detalhes</label>
                                <Textarea
                                    value={editableStrategy.channels.physical.subheadline || ''}
                                    onChange={(e) => updateChannel('physical', 'subheadline', e.target.value)}
                                    className="h-[80px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Prompt do Cartaz (IA)</label>
                                <Textarea
                                    value={editableStrategy.channels.physical.image_prompt || ''}
                                    onChange={(e) => updateChannel('physical', 'image_prompt', e.target.value)}
                                    className="min-h-[80px] text-xs bg-muted/30 font-mono text-muted-foreground"
                                    placeholder="Prompt em inglês para gerar o cartaz..."
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-muted-foreground">Opções de Cartaz (IA)</h3>
                                    <Button
                                        size="sm"
                                        onClick={async () => {
                                            if (!editableStrategy.channels.physical.image_options) {
                                                handleGenerateImage('physical');
                                                return;
                                            }

                                            setGeneratingVisual('physical');
                                            try {
                                                const { generateMarketingImage } = await import("@/app/actions/nanobanana");

                                                const promises = editableStrategy.channels.physical.image_options.map(async (opt, idx) => {
                                                    const res = await generateMarketingImage(opt.prompt, 'pdv');
                                                    return { idx, url: res.imageUrl };
                                                });

                                                const results = await Promise.all(promises);

                                                const newCandidates = { ...visualCandidates };
                                                newCandidates.physical = results.map(r => r.url || null);
                                                setVisualCandidates(newCandidates);

                                                if (results[0].url) {
                                                    setVisuals(prev => ({ ...prev, physical: results[0].url }));
                                                }

                                            } catch (e) {
                                                console.error(e);
                                                alert("Erro ao gerar cartazes.");
                                            } finally {
                                                setGeneratingVisual(null);
                                            }
                                        }}
                                        disabled={generatingVisual === 'physical'}
                                        className="bg-gradient-to-r from-orange-400 to-red-500 text-white h-7 text-xs"
                                    >
                                        <Store className="mr-1" size={12} />
                                        {generatingVisual === 'physical' ? "Criando Cartazes..." : "Gerar 3 Opções"}
                                    </Button>
                                </div>

                                {editableStrategy.channels.physical.image_options && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {editableStrategy.channels.physical.image_options.map((option, idx) => {
                                            const candidateUrl = visualCandidates.physical?.[idx];
                                            const isSelected = visuals.physical === candidateUrl && candidateUrl;

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => candidateUrl && setVisuals(prev => ({ ...prev, physical: candidateUrl }))}
                                                    className={cn(
                                                        "relative group cursor-pointer rounded-lg border-2 transition-all overflow-hidden aspect-[3/4] bg-muted/20 flex flex-col",
                                                        isSelected ? "border-orange-500 ring-2 ring-orange-200" : "border-transparent hover:border-orange-300"
                                                    )}
                                                >
                                                    {candidateUrl ? (
                                                        <>
                                                            <img src={candidateUrl} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1 shadow-md">
                                                                    <Check size={12} />
                                                                </div>
                                                            )}
                                                            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-white text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {option.title}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex-1 p-3 flex flex-col justify-between">
                                                            <div>
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cartaz {idx + 1}</span>
                                                                <p className="text-xs font-semibold leading-tight mt-1 text-foreground/80">{option.title}</p>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground line-clamp-4 italic bg-white/50 p-1 rounded">
                                                                "{option.prompt}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {visuals.physical && !editableStrategy.channels.physical.image_options && (
                                    <div className="border rounded-xl p-4 flex flex-col items-center justify-center bg-muted/10 min-h-[300px]">
                                        <img src={visuals.physical} alt="PDV Poster" className="rounded-lg shadow-md w-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </CardContent>

                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

"use client";

import { useState } from "react";
import { CampaignStrategy } from "@/app/actions/marketing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Instagram, Store, Send, Check, TrendingUp, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignViewerProps {
    strategy: CampaignStrategy;
}

export function CampaignViewer({ strategy }: CampaignViewerProps) {
    const [activeTab, setActiveTab] = useState("report");
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const renderWhatsAppPreview = (text: string) => {
        const parts = text.split(/(\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('*') && part.endsWith('*')) {
                return <b key={i}>{part.slice(1, -1)}</b>;
            }
            return part;
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-[750px] mx-auto bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="report" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Estratégia</TabsTrigger>
                    <TabsTrigger value="dissemination" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Divulgação</TabsTrigger>
                    <TabsTrigger value="whatsapp" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">WhatsApp</TabsTrigger>
                    <TabsTrigger value="instagram" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Instagram</TabsTrigger>
                    <TabsTrigger value="physical" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Loja Física</TabsTrigger>
                </TabsList>

                {/* STRATEGY REPORT TAB */}
                <TabsContent value="report" className="mt-6 space-y-6">
                    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/10">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold flex items-center justify-between">
                                {strategy.report.title}
                                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Estratégia</Badge>
                            </CardTitle>
                            <CardDescription>Análise da Campanha Gerada pela IA</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-background rounded-lg border shadow-sm">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Público-Alvo</h3>
                                    <p className="text-foreground font-medium text-sm leading-relaxed">{strategy.report.target_audience}</p>
                                </div>
                                <div className="p-4 bg-background rounded-lg border shadow-sm">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Gancho (Hook)</h3>
                                    <p className="text-foreground font-medium text-purple-600 text-sm leading-relaxed">{strategy.report.hook}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-background rounded-lg border shadow-sm">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Análise de Coerência (Mix)</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{strategy.report.coherence_analysis}</p>
                            </div>

                            <div className="p-4 bg-background rounded-lg border shadow-sm">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">ESTRATÉGIA DE PRECIFICAÇÃO</h3>
                                {strategy.pricing_strategy && strategy.pricing_strategy.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground bg-muted/20">
                                                    <th className="text-left py-2 px-2 font-medium">Produto</th>
                                                    <th className="text-right py-2 px-2 font-medium">Custo</th>
                                                    <th className="text-right py-2 px-2 font-medium">Preço Orig.</th>
                                                    <th className="text-right py-2 px-2 font-medium">Sugestão</th>
                                                    <th className="text-right py-2 px-2 font-medium">Desc. %</th>
                                                    <th className="text-right py-2 px-2 font-medium">Margem %</th>
                                                    <th className="text-left pl-4 py-2 px-2 font-medium">Tática</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {strategy.pricing_strategy.map((item, idx) => (
                                                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                                        <td className="py-2 px-2 font-medium">{item.product_name}</td>
                                                        <td className="text-right py-2 px-2 text-muted-foreground">R$ {item.cost}</td>
                                                        <td className="text-right py-2 px-2 text-muted-foreground line-through decoration-red-400">
                                                            R$ {item.original_price?.toFixed(2)}
                                                        </td>
                                                        <td className="text-right py-2 px-2 font-bold text-emerald-600 bg-emerald-50/50 rounded-md">
                                                            R$ {item.suggested_price}
                                                        </td>
                                                        <td className="text-right py-2 px-2 text-red-500 font-medium">
                                                            -{item.discount_percent}%
                                                        </td>
                                                        <td className="text-right py-2 px-2 font-medium text-slate-700">
                                                            {item.margin_percent}%
                                                        </td>
                                                        <td className="pl-4 py-2 px-2 italic text-xs text-muted-foreground">
                                                            {item.tactic}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground italic">Nenhuma estratégia de preço detalhada disponível.</p>
                                )}
                            </div>

                            <div className="p-4 bg-background rounded-lg border shadow-sm flex items-start gap-3">
                                <div className="p-2 bg-green-100 rounded-full text-green-600 shrink-0">
                                    <Check className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase mb-1">Feedback do Mix</h3>
                                    <p className="text-sm">{strategy.report.mix_feedback}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB: DISSEMINATION --- */}
                <TabsContent value="dissemination" className="mt-6 space-y-6">
                    <Card className="border-indigo-100 dark:border-indigo-900/50">
                        <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 pb-4 border-b border-indigo-100">
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Send size={20} />
                                </div>
                                <CardTitle>Estratégia de Divulgação</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-6 space-y-6">
                            {strategy.dissemination_strategy ? (
                                <>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                                Canais Sugeridos
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {strategy.dissemination_strategy.channels?.map((channel, i) => (
                                                    <Badge key={i} variant="secondary" className="px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                                                        {channel}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        {strategy.dissemination_strategy.estimated_reach && (
                                            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex flex-col justify-center">
                                                <h3 className="text-xs font-bold text-indigo-600 uppercase mb-1 flex items-center gap-1">
                                                    <TrendingUp size={14} /> Alcance Estimado
                                                </h3>
                                                <span className="text-2xl font-bold text-indigo-900">{strategy.dissemination_strategy.estimated_reach}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-muted-foreground">Cronograma (Timeline)</h3>
                                        <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6 my-2">
                                            {(strategy.dissemination_strategy.timeline || []).map((event, idx) => (
                                                <div key={idx} className="relative">
                                                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 shadow-sm" />
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                                        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wide w-fit">
                                                            {event.day}
                                                        </span>
                                                        <h4 className="font-bold text-sm text-foreground">{event.title}</h4>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/50">
                                                        {event.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {strategy.dissemination_strategy.budget_allocation && (
                                        <div className="space-y-3 pt-4 border-t">
                                            <h3 className="text-sm font-semibold text-muted-foreground">Sugestão de Verba</h3>
                                            <div className="grid sm:grid-cols-2 gap-3">
                                                {(strategy.dissemination_strategy.budget_allocation.allocations || []).map((alloc, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border shadow-sm">
                                                        <span className="font-medium text-slate-700">{alloc.channel}</span>
                                                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{alloc.percentage}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>Nenhuma estratégia de divulgação disponível.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB: WHATSAPP --- */}
                <TabsContent value="whatsapp" className="mt-6">
                    <div className="grid lg:grid-cols-12 gap-6">
                        {/* Preview */}
                        <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
                            <div className="bg-slate-100 rounded-[2.5rem] p-4 border-[8px] border-slate-200 w-full max-w-[320px] shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-6 bg-slate-300 mx-auto w-1/2 rounded-b-xl z-10" />
                                <div className="h-full bg-[#efeae2] rounded-[1.5rem] overflow-hidden flex flex-col pt-8 pb-4 px-2 bg-opacity-50"
                                    style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                        <div className="bg-white rounded-lg p-2 rounded-tl-none shadow-sm max-w-[85%] text-xs">
                                            <p className="text-gray-800">Seu cliente vai receber assim: 👇</p>
                                        </div>
                                        <div className="bg-[#d9fdd3] rounded-lg p-3 rounded-tr-none shadow-sm ml-auto max-w-[90%] text-sm relative group text-gray-900">
                                            <p className="whitespace-pre-wrap leading-relaxed">
                                                {renderWhatsAppPreview(strategy.channels.whatsapp.script || 'Script não definido')}
                                            </p>
                                            <span className="text-[10px] text-gray-500 block text-right mt-1 flex items-center justify-end gap-0.5">
                                                10:42 <Check size={12} className="text-blue-500" />
                                            </span>
                                        </div>
                                    </div>
                                    {/* Fake Input */}
                                    <div className="mt-2 bg-white rounded-full h-10 mx-2 flex items-center px-4 text-gray-400 text-xs">
                                        Mensagem
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
                            <Card>
                                <CardHeader className="pb-3 border-b">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <MessageCircle size={20} className="text-green-600" />
                                            Script para WhatsApp
                                        </CardTitle>
                                        <button
                                            onClick={() => handleCopy(strategy.channels.whatsapp.script || '', 'whatsapp')}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                                copied === 'whatsapp'
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                            )}
                                        >
                                            {copied === 'whatsapp' ? <Check size={16} /> : <Copy size={16} />}
                                            {copied === 'whatsapp' ? "Copiado!" : "Copiar"}
                                        </button>
                                    </div>
                                    <CardDescription>
                                        Copie e cole na sua ferramenta de disparo ou envie manualmente.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="p-4 bg-muted/30 rounded-lg border font-mono text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                        {strategy.channels.whatsapp.script}
                                    </div>

                                    {strategy.channels.whatsapp.trigger && (
                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                            <span className="font-bold">🔥 Gatilho de Urgência:</span> {strategy.channels.whatsapp.trigger}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- TAB: INSTAGRAM --- */}
                <TabsContent value="instagram" className="mt-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="md:col-span-1 h-fit">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Instagram size={20} className="text-pink-600" />
                                        <CardTitle>Legenda (Copy)</CardTitle>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(strategy.channels.instagram.copy || '', 'instagram')}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                            copied === 'instagram'
                                                ? "bg-pink-100 text-pink-700"
                                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                        )}
                                    >
                                        {copied === 'instagram' ? <Check size={16} /> : <Copy size={16} />}
                                        {copied === 'instagram' ? "Copiado!" : "Copiar"}
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 border rounded-lg bg-gray-50/50 min-h-[200px] text-sm whitespace-pre-wrap leading-relaxed">
                                    {strategy.channels.instagram.copy}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Sugestão Visual</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-1 rounded-xl shadow-lg">
                                        <div className="bg-white rounded-lg p-4 h-full flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
                                            {/* Placeholder for actual image if we had one generating on the fly, for now prompt */}
                                            <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mb-2">
                                                <Instagram size={32} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Conceito Criativo</h4>
                                                <p className="text-sm text-gray-500 mt-1">Use este prompt para criar a imagem:</p>
                                            </div>
                                            <div className="bg-gray-100 p-3 rounded text-xs font-mono text-left w-full break-words">
                                                {strategy.channels.instagram.image_prompt}
                                            </div>
                                            <button
                                                onClick={() => handleCopy(strategy.channels.instagram.image_prompt || '', 'insta_prompt')}
                                                className="text-xs text-pink-600 hover:underline font-medium"
                                            >
                                                {copied === 'insta_prompt' ? "Copiado!" : "Copiar Prompt"}
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- TAB: PHYSICAL --- */}
                <TabsContent value="physical" className="mt-6 space-y-6">
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Poster Preview */}
                        <div className="flex flex-col gap-4">
                            <div className="relative group perspective-1000">
                                <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative bg-white text-black p-8 rounded-xl border-8 border-yellow-400 text-center shadow-2xl transform transition-transform group-hover:scale-[1.02]">
                                    <div className="absolute top-0 inset-x-0 h-2 bg-red-600/20"></div>
                                    <h2 className="text-4xl font-black uppercase text-red-600 mb-2 leading-none tracking-tight">
                                        {strategy.channels.physical.headline}
                                    </h2>
                                    <p className="text-xl font-bold border-b-4 border-black pb-4 mb-6">
                                        {strategy.channels.physical.subheadline}
                                    </p>
                                    <div className="bg-yellow-400 p-6 rounded-lg border-4 border-dashed border-black transform -rotate-1 shadow-sm">
                                        <p className="text-3xl font-black text-black drop-shadow-sm">
                                            {strategy.channels.physical.offer}
                                        </p>
                                    </div>
                                    <div className="mt-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Oferta Válida por Tempo Limitado
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleCopy(
                                    `${strategy.channels.physical.headline}\n${strategy.channels.physical.subheadline}\n${strategy.channels.physical.offer}`,
                                    'physical'
                                )}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-all shadow-md font-bold"
                            >
                                {copied === 'physical' ? <Check size={18} /> : <Copy size={18} />}
                                {copied === 'physical' ? "Copiado!" : "Copiar Texto do Cartaz"}
                            </button>
                        </div>

                        {/* Details */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Store size={20} className="text-orange-600" />
                                        <CardTitle>Detalhes do PDV</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Layout Sugerido</h4>
                                        <p className="text-sm bg-muted/30 p-3 rounded-lg border">{strategy.channels.physical.layout || "Destaque na entrada da loja com ilhas de produtos."}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase">Prompt Visual</h4>
                                            <button
                                                onClick={() => handleCopy(strategy.channels.physical.image_prompt || '', 'physical_prompt')}
                                                className="text-[10px] text-orange-600 hover:underline font-bold"
                                            >
                                                {copied === 'physical_prompt' ? "COPIADO" : "COPIAR"}
                                            </button>
                                        </div>
                                        <code className="block p-3 bg-black/5 text-xs rounded border text-muted-foreground">
                                            {strategy.channels.physical.image_prompt}
                                        </code>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

"use client";

import { motion } from "framer-motion";
import { Rocket, Clock, Lightbulb, CheckCircle2, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type RoadmapStatus = "in_progress" | "planned" | "considering" | "completed";

interface RoadmapItem {
    id: string;
    title: string;
    description: string;
    status: RoadmapStatus;
    eta?: string;
    tags?: string[];
}

const roadmapData: RoadmapItem[] = [
    // Em Desenvolvimento
    {
        id: "1",
        title: "Sistema Multi-Filiais",
        description: "Alternar visualização de dados entre múltiplas lojas da rede. Dashboard, produtos e análises filtrados por filial.",
        status: "in_progress",
        eta: "Janeiro 2025",
        tags: ["Core", "Dashboard"]
    },
    {
        id: "2",
        title: "Central de Ajuda",
        description: "Página completa de tutorial e documentação de todas funcionalidades da plataforma.",
        status: "in_progress",
        eta: "Janeiro 2025",
        tags: ["UX"]
    },
    // Planejado - Curto Prazo
    {
        id: "3",
        title: "Relatórios Exportáveis",
        description: "Exportar dashboard, lista de compras e histórico de campanhas em PDF e Excel.",
        status: "planned",
        eta: "Janeiro 2025",
        tags: ["Relatórios"]
    },
    {
        id: "4",
        title: "Notificações por Email",
        description: "Alertas automáticos de ruptura de estoque, resumo diário e oportunidades.",
        status: "planned",
        eta: "Janeiro 2025",
        tags: ["Alertas", "Automação"]
    },
    {
        id: "5",
        title: "UX Mobile Otimizada",
        description: "Melhorias de responsividade: sidebar, tabelas, cards e gestures touch.",
        status: "planned",
        eta: "Janeiro 2025",
        tags: ["UX", "Mobile"]
    },
    // Planejado - Médio Prazo
    {
        id: "6",
        title: "Dashboard Comparativo",
        description: "Comparar performance entre filiais, períodos e categorias. Gráficos de tendência temporal.",
        status: "planned",
        eta: "Fevereiro 2025",
        tags: ["Analytics"]
    },
    {
        id: "7",
        title: "Gestão de Fornecedores",
        description: "Página de fornecedores com histórico de lead times, avaliação de performance e integração com pedidos.",
        status: "planned",
        eta: "Fevereiro 2025",
        tags: ["Fornecedores", "Core"]
    },
    {
        id: "8",
        title: "Pedidos de Compra Automáticos",
        description: "Sugestão automática baseada em ROP, geração de PDF e envio por email ao fornecedor.",
        status: "planned",
        eta: "Março 2025",
        tags: ["Automação", "Compras"]
    },
    {
        id: "9",
        title: "Histórico e Auditoria",
        description: "Log completo de ações do usuário, histórico de alterações de estoque e timeline de atividades.",
        status: "planned",
        eta: "Março 2025",
        tags: ["Auditoria", "Segurança"]
    },
    {
        id: "10",
        title: "Previsão de Demanda com IA",
        description: "Machine Learning para prever demanda futura (30/60/90 dias) considerando sazonalidade.",
        status: "planned",
        eta: "Abril 2025",
        tags: ["IA", "Analytics"]
    },
    // Em Consideração
    {
        id: "11",
        title: "Integração com WhatsApp Business",
        description: "Enviar campanhas de marketing diretamente para WhatsApp Business API.",
        status: "considering",
        tags: ["Marketing", "Integração"]
    },
    {
        id: "12",
        title: "Integrações com ERPs",
        description: "Sync automático com Bling, Tiny, Omie e outros sistemas de gestão.",
        status: "considering",
        tags: ["Integração", "ERP"]
    },
    {
        id: "13",
        title: "Integrações E-commerce",
        description: "Conectar com Shopify, WooCommerce, Nuvemshop para gestão omnichannel.",
        status: "considering",
        tags: ["Integração", "E-commerce"]
    },
    {
        id: "14",
        title: "App Mobile Nativo",
        description: "Aplicativo React Native/Flutter com notificações push e scan de código de barras.",
        status: "considering",
        tags: ["Mobile", "App"]
    },
    {
        id: "15",
        title: "Analytics Avançado",
        description: "Gráficos interativos, cohort analysis, heatmap de vendas e análise de margem.",
        status: "considering",
        tags: ["Analytics", "BI"]
    },
    {
        id: "16",
        title: "Colaboração em Equipe",
        description: "Comentários em produtos, tarefas atribuídas, notificações internas e permissões por papel.",
        status: "considering",
        tags: ["Colaboração", "UX"]
    },
    {
        id: "17",
        title: "Multi-Tenant / SaaS",
        description: "Isolamento de dados por empresa, onboarding, planos e cobrança via Stripe.",
        status: "considering",
        tags: ["Plataforma", "Negócio"]
    },
    // Concluído
    {
        id: "18",
        title: "Chat com IA",
        description: "Assistente inteligente para análise de estoque, sugestões de compra e geração de campanhas.",
        status: "completed",
        tags: ["IA", "Core"]
    },
    {
        id: "19",
        title: "Geração de Campanhas de Marketing",
        description: "IA gera materiais para Instagram, WhatsApp e PDV automaticamente.",
        status: "completed",
        tags: ["Marketing", "IA"]
    },
    {
        id: "20",
        title: "Análise Curva ABC",
        description: "Classificação automática de produtos por importância de vendas.",
        status: "completed",
        tags: ["Analytics"]
    },
    {
        id: "21",
        title: "Dashboard de Estoque",
        description: "Visão geral com KPIs, gráficos de status e alertas em tempo real.",
        status: "completed",
        tags: ["Dashboard", "Core"]
    },
    {
        id: "22",
        title: "Simulador de Cenários",
        description: "Simular impacto de promoções e ajustes de estoque.",
        status: "completed",
        tags: ["Simulação"]
    },
    {
        id: "23",
        title: "Página de Roadmap",
        description: "Timeline visual de próximas funcionalidades e atualizações.",
        status: "completed",
        tags: ["UX"]
    }
];

const statusConfig: Record<RoadmapStatus, { label: string; icon: typeof Rocket; color: string; bg: string }> = {
    in_progress: {
        label: "Em Desenvolvimento",
        icon: Rocket,
        color: "text-blue-500",
        bg: "bg-blue-500/10 border-blue-500/30"
    },
    planned: {
        label: "Planejado",
        icon: Calendar,
        color: "text-purple-500",
        bg: "bg-purple-500/10 border-purple-500/30"
    },
    considering: {
        label: "Em Consideração",
        icon: Lightbulb,
        color: "text-amber-500",
        bg: "bg-amber-500/10 border-amber-500/30"
    },
    completed: {
        label: "Concluído",
        icon: CheckCircle2,
        color: "text-green-500",
        bg: "bg-green-500/10 border-green-500/30"
    }
};

function RoadmapCard({ item, index }: { item: RoadmapItem; index: number }) {
    const config = statusConfig[item.status];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "rounded-xl border p-5 transition-all hover:shadow-lg",
                config.bg
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon size={18} className={config.color} />
                    <span className={cn("text-xs font-medium", config.color)}>
                        {config.label}
                    </span>
                </div>
                {item.eta && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        {item.eta}
                    </span>
                )}
            </div>
            <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
            {item.tags && (
                <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                        <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground border border-border"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

export default function RoadmapPage() {
    const inProgress = roadmapData.filter(i => i.status === "in_progress");
    const planned = roadmapData.filter(i => i.status === "planned");
    const considering = roadmapData.filter(i => i.status === "considering");
    const completed = roadmapData.filter(i => i.status === "completed");

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-background" />
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-6xl"
                >
                    {/* Header */}
                    <header className="mb-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
                                <Rocket size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                    Roadmap
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Próximas funcionalidades e atualizações planejadas
                                </p>
                            </div>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    </header>

                    {/* Em Desenvolvimento */}
                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Rocket size={20} className="text-blue-500" />
                            <h2 className="text-lg font-semibold text-foreground">Em Desenvolvimento</h2>
                            <ArrowRight size={16} className="text-muted-foreground animate-pulse" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {inProgress.map((item, i) => (
                                <RoadmapCard key={item.id} item={item} index={i} />
                            ))}
                        </div>
                    </section>

                    {/* Planejado */}
                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar size={20} className="text-purple-500" />
                            <h2 className="text-lg font-semibold text-foreground">Planejado</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {planned.map((item, i) => (
                                <RoadmapCard key={item.id} item={item} index={i} />
                            ))}
                        </div>
                    </section>

                    {/* Em Consideração */}
                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb size={20} className="text-amber-500" />
                            <h2 className="text-lg font-semibold text-foreground">Em Consideração</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {considering.map((item, i) => (
                                <RoadmapCard key={item.id} item={item} index={i} />
                            ))}
                        </div>
                    </section>

                    {/* Concluído */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 size={20} className="text-green-500" />
                            <h2 className="text-lg font-semibold text-foreground">Concluído Recentemente</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {completed.map((item, i) => (
                                <RoadmapCard key={item.id} item={item} index={i} />
                            ))}
                        </div>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}

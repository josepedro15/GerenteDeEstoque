"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    BookOpen,
    LayoutDashboard,
    Package,
    MessageCircle,
    Megaphone,
    Settings,
    ChevronRight,
    BarChart3,
    TrendingUp,
    AlertTriangle,
    Sparkles,
    Target,
    ShoppingCart,
    Printer,
    HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpSection {
    id: string;
    title: string;
    icon: typeof BookOpen;
    color: string;
    description: string;
    topics: {
        title: string;
        content: string;
    }[];
}

const helpSections: HelpSection[] = [
    {
        id: "dashboard",
        title: "Dashboard",
        icon: LayoutDashboard,
        color: "text-blue-500",
        description: "Visão geral do seu estoque com métricas e alertas em tempo real.",
        topics: [
            {
                title: "KPIs Principais",
                content: "No topo do dashboard você encontra os indicadores chave: Total em Estoque (valor financeiro investido), Itens em Ruptura (produtos sem estoque), Nível de Serviço (% de itens com estoque saudável) e Oportunidades (produtos com excesso que podem ser promovidos)."
            },
            {
                title: "Gráfico Curva ABC",
                content: "Visualize a distribuição dos seus produtos por importância de vendas. Produtos A são os mais vendidos (geralmente 20% dos itens = 80% do faturamento), B são intermediários e C são os de menor giro."
            },
            {
                title: "Status de Estoque",
                content: "Gráfico de pizza mostrando quantos produtos estão: Saudável (cobertura ideal), Atenção (baixa cobertura), Crítico/Ruptura (sem estoque), e Excesso (cobertura muito alta)."
            },
            {
                title: "Alertas",
                content: "Lista de situações que precisam de ação imediata, como rupturas de produtos A, excessos significativos ou tendências de queda."
            }
        ]
    },
    {
        id: "products",
        title: "Produtos",
        icon: Package,
        color: "text-emerald-500",
        description: "Lista completa de produtos com filtros avançados e análise detalhada.",
        topics: [
            {
                title: "Tabela de Produtos",
                content: "Visualize todos os produtos com informações de estoque atual, dias de cobertura, curva ABC e status. Clique em qualquer linha para ver detalhes."
            },
            {
                title: "Filtros",
                content: "Use os filtros para encontrar rapidamente: por status (Ruptura, Atenção, Saudável, Excesso), por curva ABC (A, B, C) ou busca por nome/SKU."
            },
            {
                title: "Cobertura de Estoque",
                content: "A coluna 'Cobertura' mostra quantos dias o estoque atual durará com base na média de vendas. Menos de 7 dias é crítico, 7-15 é atenção, 15-60 é ideal, acima de 60 é excesso."
            },
            {
                title: "Ações em Lote",
                content: "Selecione múltiplos produtos e use o botão 'Analisar Selecionados' para enviar ao chat para análise detalhada pela IA."
            }
        ]
    },
    {
        id: "chat",
        title: "Bate-papo com IA",
        icon: MessageCircle,
        color: "text-indigo-500",
        description: "Assistente inteligente para análises, sugestões de compra e geração de campanhas.",
        topics: [
            {
                title: "Análise de Estoque",
                content: "Pergunte sobre a situação geral do estoque, produtos específicos ou categorias. Exemplo: 'Qual a situação dos produtos da curva A?' ou 'Quais produtos estão em ruptura?'"
            },
            {
                title: "Sugestões de Compra",
                content: "Peça recomendações de reposição baseadas em histórico de vendas. Exemplo: 'Monte um pedido de compra para os itens críticos' ou 'Quanto devo comprar do produto X?'"
            },
            {
                title: "Geração de Campanhas",
                content: "A partir da página de Produtos, selecione itens com excesso e clique em 'Gerar Campanha'. A IA criará materiais para Instagram, WhatsApp e Ponto de Venda."
            },
            {
                title: "Plano Estratégico",
                content: "Ao solicitar uma campanha, a IA primeiro analisa o mix de produtos (Curva ABC) e sugere ajustes para maximizar resultados. Você aprova antes de gerar os materiais finais."
            }
        ]
    },
    {
        id: "marketing",
        title: "Campanhas de Marketing",
        icon: Megaphone,
        color: "text-pink-500",
        description: "Histórico de campanhas geradas e materiais prontos para uso.",
        topics: [
            {
                title: "Histórico de Campanhas",
                content: "Todas as campanhas geradas pelo chat ficam salvas aqui. Veja a data, produtos incluídos e acesse os materiais."
            },
            {
                title: "Material para Instagram",
                content: "Legenda pronta com hashtags e call-to-action otimizados para conversão de produtos com excesso de estoque."
            },
            {
                title: "Script para WhatsApp",
                content: "Mensagem pronta para enviar a clientes via WhatsApp, incluindo gatilho de promoção e urgência."
            },
            {
                title: "Material para PDV",
                content: "Textos de headline, subheadline e oferta prontos para cartazes de ponto de venda."
            }
        ]
    },
    {
        id: "settings",
        title: "Configurações",
        icon: Settings,
        color: "text-gray-500",
        description: "Personalize seu perfil e preferências do sistema.",
        topics: [
            {
                title: "Perfil",
                content: "Atualize seu nome, cargo e foto de perfil que aparece no sidebar."
            },
            {
                title: "Tema",
                content: "Alterne entre modo claro e escuro usando o botão no sidebar."
            },
            {
                title: "Notificações",
                content: "Configure alertas por email para rupturas e oportunidades (em breve)."
            }
        ]
    }
];

const faqItems = [
    {
        q: "Como a IA calcula as sugestões de compra?",
        a: "A IA analisa o histórico de vendas, calcula a média diária, considera o lead time do fornecedor e o estoque de segurança para sugerir a quantidade ideal de reposição."
    },
    {
        q: "O que significa 'Cobertura de Estoque'?",
        a: "É quantos dias o estoque atual durará mantendo a média de vendas. Por exemplo, 30 dias significa que você tem produto para 1 mês de vendas."
    },
    {
        q: "Como funciona a Curva ABC?",
        a: "Produtos A são os 20% que geram ~80% do faturamento (alta prioridade). B são intermediários. C são os de menor giro mas ainda necessários no mix."
    },
    {
        q: "Posso editar os materiais de campanha gerados?",
        a: "Sim! Os textos são sugestões. Use o botão de copiar para colar em seu editor favorito e ajustar conforme necessário."
    },
    {
        q: "Os dados são atualizados em tempo real?",
        a: "Os dados são sincronizados periodicamente com seu ERP. A frequência depende da integração configurada (geralmente diária ou horária)."
    }
];

export default function HelpPage() {
    const [activeSection, setActiveSection] = useState<string>("dashboard");
    const currentSection = helpSections.find(s => s.id === activeSection) || helpSections[0];

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-background" />
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-6xl"
                >
                    {/* Header */}
                    <header className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-600 shadow-lg shadow-indigo-500/25">
                                <BookOpen size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                    Central de Ajuda
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Aprenda a usar todas as funcionalidades da plataforma
                                </p>
                            </div>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    </header>

                    <div className="grid gap-6 lg:grid-cols-12">
                        {/* Navigation */}
                        <nav className="lg:col-span-3 space-y-1">
                            {helpSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                                        activeSection === section.id
                                            ? "bg-accent border border-border"
                                            : "hover:bg-accent/50"
                                    )}
                                >
                                    <section.icon size={20} className={section.color} />
                                    <span className={cn(
                                        "font-medium",
                                        activeSection === section.id ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {section.title}
                                    </span>
                                    {activeSection === section.id && (
                                        <ChevronRight size={16} className="ml-auto text-muted-foreground" />
                                    )}
                                </button>
                            ))}

                            <div className="pt-4 mt-4 border-t border-border">
                                <button
                                    onClick={() => setActiveSection("faq")}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                                        activeSection === "faq"
                                            ? "bg-accent border border-border"
                                            : "hover:bg-accent/50"
                                    )}
                                >
                                    <HelpCircle size={20} className="text-amber-500" />
                                    <span className={cn(
                                        "font-medium",
                                        activeSection === "faq" ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        Perguntas Frequentes
                                    </span>
                                </button>
                            </div>
                        </nav>

                        {/* Content */}
                        <div className="lg:col-span-9">
                            {activeSection !== "faq" ? (
                                <motion.div
                                    key={activeSection}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="rounded-2xl border border-border bg-card p-6"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <currentSection.icon size={28} className={currentSection.color} />
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">
                                                {currentSection.title}
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                {currentSection.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {currentSection.topics.map((topic, i) => (
                                            <div key={i} className="border-l-2 border-border pl-4 hover:border-primary transition-colors">
                                                <h3 className="font-semibold text-foreground mb-2">
                                                    {topic.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {topic.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="rounded-2xl border border-border bg-card p-6"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <HelpCircle size={28} className="text-amber-500" />
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">
                                                Perguntas Frequentes
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                Dúvidas comuns sobre a plataforma
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {faqItems.map((item, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-accent/50 border border-border">
                                                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs flex items-center justify-center font-bold">
                                                        ?
                                                    </span>
                                                    {item.q}
                                                </h3>
                                                <p className="text-sm text-muted-foreground pl-8">
                                                    {item.a}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

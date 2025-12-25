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
        id: "getting-started",
        title: "Primeiros Passos",
        icon: Sparkles,
        color: "text-purple-500",
        description: "Como começar a usar a plataforma SmartOrders.",
        topics: [
            {
                title: "O que é o SmartOrders?",
                content: "O SmartOrders é uma plataforma inteligente de gestão de estoque que usa Inteligência Artificial para analisar seus dados, sugerir compras otimizadas e gerar campanhas de marketing para produtos com excesso. Ele integra com seu ERP para manter os dados sempre atualizados."
            },
            {
                title: "Navegação Principal",
                content: "Use o menu lateral (sidebar) para navegar entre as páginas: Dashboard (visão geral), Produtos (lista completa), Bate-papo (assistente IA), Campanhas (marketing), Roadmap (próximas features) e Ajuda (esta página). No topo há o seletor de Filial para alternar entre lojas."
            },
            {
                title: "Tema Claro/Escuro",
                content: "Clique no ícone de sol/lua no menu lateral para alternar entre tema claro e escuro conforme sua preferência."
            },
            {
                title: "Seletor de Filial",
                content: "Se sua rede tem múltiplas lojas, use o dropdown 'Filial' no topo do sidebar para alternar entre elas. Selecione 'Todas as Filiais' para ver dados consolidados ou escolha uma loja específica."
            },
            {
                title: "Fluxo Típico de Uso",
                content: "1) Acesse o Dashboard para ver a situação geral. 2) Identifique problemas (rupturas, excessos). 3) Use o Chat para pedir análises detalhadas. 4) Para excessos, gere campanhas de marketing. 5) Para rupturas, peça sugestões de compra à IA."
            }
        ]
    },
    {
        id: "dashboard",
        title: "Dashboard",
        icon: LayoutDashboard,
        color: "text-blue-500",
        description: "Visão geral do seu estoque com métricas e alertas em tempo real.",
        topics: [
            {
                title: "KPIs Principais",
                content: "No topo do dashboard você encontra 4 indicadores chave: Total em Estoque (valor financeiro investido em R$), Itens em Ruptura (produtos zerados que precisam reposição urgente), Nível de Serviço (% de itens com estoque saudável, ideal acima de 95%) e Oportunidades (produtos com excesso que podem ser promovidos)."
            },
            {
                title: "Interpretando os KPIs",
                content: "🔴 Ruptura alta = urgência de compra. 🟡 Nível de serviço baixo = risco de perder vendas. 🟢 Oportunidades = capital parado que pode ser convertido. Clique em qualquer KPI para ver os produtos relacionados."
            },
            {
                title: "Gráfico Curva ABC",
                content: "Visualize a distribuição dos seus produtos por importância. Curva A = 20% dos itens gerando ~80% do faturamento (alta prioridade). Curva B = produtos intermediários. Curva C = menor giro mas necessários no mix. Use isso para priorizar ações."
            },
            {
                title: "Gráfico Status de Estoque",
                content: "Gráfico de pizza mostrando a saúde do estoque: 🟢 Saudável (cobertura 15-60 dias), 🟡 Atenção (7-15 dias), 🔴 Crítico/Ruptura (<7 dias ou zero), 🟠 Excesso (>60 dias). Monitore para manter mais verde que vermelho."
            },
            {
                title: "Lista de Alertas",
                content: "Cards de situações que precisam de ação imediata: rupturas de produtos Curva A (urgente!), excessos significativos, tendências de queda nas vendas. Cada alerta tem um botão para analisar no Chat."
            },
            {
                title: "Período de Análise",
                content: "Por padrão, o sistema analisa os últimos 90 dias de vendas para calcular médias e tendências. Este período é configurável pelos administradores."
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
                content: "Visualize todos os produtos com: Nome, SKU, Estoque Atual (unidades), Cobertura (dias), Curva ABC e Status. As colunas são ordenáveis - clique no título para ordenar. Linhas coloridas indicam status (vermelho = crítico, amarelo = atenção, verde = saudável, laranja = excesso)."
            },
            {
                title: "Barra de Busca",
                content: "Busque por nome do produto ou código SKU. A busca é instantânea e funciona parcialmente (digite parte do nome). Combine com filtros para resultados mais precisos."
            },
            {
                title: "Filtros por Status",
                content: "Use os botões de filtro para ver apenas: Ruptura (estoque zero), Atenção (cobertura baixa), Saudável (cobertura ideal) ou Excesso (estoque demais). Útil para focar em ações específicas."
            },
            {
                title: "Filtros por Curva ABC",
                content: "Filtre para ver apenas produtos A (mais importantes), B (intermediários) ou C (menor giro). Priorize resolver rupturas da Curva A primeiro!"
            },
            {
                title: "Entendendo Cobertura",
                content: "A coluna 'Cobertura' mostra quantos dias o estoque atual durará com base na média de vendas: < 7 dias = 🔴 Crítico (repor urgente). 7-15 dias = 🟡 Atenção. 15-60 dias = 🟢 Ideal. > 60 dias = 🟠 Excesso."
            },
            {
                title: "Seleção Múltipla",
                content: "Use o checkbox para selecionar múltiplos produtos. Depois clique em 'Analisar Selecionados' para enviar ao Chat para análise detalhada pela IA, ou 'Gerar Campanha' para criar materiais de marketing."
            },
            {
                title: "Detalhes do Produto",
                content: "Clique em qualquer linha para abrir um modal com informações detalhadas: histórico de vendas, evolução de estoque, fornecedor, custo, preço, margem e ações rápidas."
            },
            {
                title: "Paginação",
                content: "Se você tem muitos produtos, use a paginação no rodapé da tabela para navegar. O sistema carrega os dados de forma otimizada para performance."
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
                title: "O que você pode perguntar",
                content: "A IA entende perguntas em linguagem natural sobre: situação geral do estoque, análise de produtos específicos, sugestões de compra, identificação de problemas, tendências de venda e geração de campanhas de marketing."
            },
            {
                title: "Exemplos de Análise de Estoque",
                content: "• 'Qual a situação geral do meu estoque?' • 'Quais produtos da Curva A estão em ruptura?' • 'Me mostre os itens com excesso de estoque' • 'Como está o produto [nome]?' • 'Quais categorias precisam de atenção?'"
            },
            {
                title: "Exemplos de Sugestões de Compra",
                content: "• 'Monte um pedido de compra para os itens críticos' • 'Quanto devo comprar do produto X?' • 'Quais produtos precisam de reposição urgente?' • 'Sugira compras para 30 dias de cobertura' • 'Liste os itens para comprar ordenados por prioridade'"
            },
            {
                title: "Geração de Campanhas",
                content: "Para gerar campanhas de marketing: 1) Vá em Produtos, 2) Selecione itens com excesso, 3) Clique em 'Gerar Campanha'. A IA primeiro analisa o mix (Curva ABC) e sugere ajustes, depois gera os materiais após sua aprovação."
            },
            {
                title: "Plano Estratégico de Campanha",
                content: "Ao solicitar uma campanha, a IA analisa: mix de curvas ABC (ideal ter produtos A, B e C), descontos sugeridos por produto, duração recomendada, nome da campanha e estimativa de resultado. Revise e aprove antes de gerar os materiais finais."
            },
            {
                title: "Histórico de Conversa",
                content: "O chat salva o histórico da sua sessão. Use o botão de lixeira no topo para limpar e iniciar uma nova conversa. O histórico fica salvo por 30 dias."
            },
            {
                title: "Dica: Seja Específico",
                content: "Quanto mais contexto você der, melhor a resposta. Compare: 'análise de estoque' (genérico) vs 'análise de estoque dos produtos Curva A que estão em ruptura há mais de 7 dias' (específico)."
            },
            {
                title: "Widget Flutuante",
                content: "O chat também está disponível como widget flutuante em qualquer página - clique no ícone de chat no canto inferior direito. Útil para consultas rápidas sem sair da tela atual."
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
                title: "Página de Campanhas",
                content: "Aqui ficam salvas todas as campanhas geradas pelo Chat. Você pode ver a data de criação, produtos incluídos e acessar os materiais a qualquer momento. Use o botão 'Gerar Nova Campanha' para ir ao Chat."
            },
            {
                title: "Material para Instagram",
                content: "Legenda otimizada para feed/stories com: copy persuasivo, emojis relevantes, hashtags estratégicas, call-to-action claro. Copie e cole diretamente no Instagram ou adapte conforme necessário."
            },
            {
                title: "Script para WhatsApp",
                content: "Mensagem pronta para disparar via WhatsApp aos clientes. Inclui: saudação personalizada, oferta clara, gatilhos de urgência ('só hoje!', 'últimas unidades'), e CTA para resposta rápida."
            },
            {
                title: "Material para PDV",
                content: "Textos prontos para cartazes de ponto de venda: headline impactante, subheadline explicativo, oferta destacada com preço/desconto. Ideal para imprimir ou usar em TVs de loja."
            },
            {
                title: "Copiando Materiais",
                content: "Cada material tem um botão de copiar. Clique para copiar o texto para a área de transferência e colar em qualquer lugar: editores, redes sociais, ferramentas de design."
            },
            {
                title: "Editando Materiais",
                content: "Os textos gerados são sugestões otimizadas. Você pode e deve adaptar ao tom de voz da sua marca, adicionar informações específicas (endereço, horário), e ajustar valores se necessário."
            },
            {
                title: "Imagens de Campanha",
                content: "Quando disponíveis, as campanhas incluem sugestões de imagem para Instagram e PDV. Baixe clicando nelas ou use como referência para criar as suas."
            }
        ]
    },
    {
        id: "simulator",
        title: "Simulador",
        icon: TrendingUp,
        color: "text-cyan-500",
        description: "Simule cenários de promoções e ajustes de estoque.",
        topics: [
            {
                title: "O que é o Simulador",
                content: "O Simulador permite testar cenários hipotéticos: 'Se eu der 30% de desconto no produto X, quanto preciso vender para zerar o excesso?'. Veja o impacto antes de tomar decisões."
            },
            {
                title: "Configurando Cenário",
                content: "Escolha: produto(s) para simular, tipo de ação (promoção, reposição, descontinuar), variáveis (desconto %, aumento de vendas esperado, prazo). O sistema calcula os resultados."
            },
            {
                title: "Resultados da Simulação",
                content: "Veja projeções de: estoque após período, impacto no faturamento, margem resultante, dias até ruptura ou normalização. Compare cenários lado a lado."
            },
            {
                title: "Salvando Simulações",
                content: "Simulações interessantes podem ser salvas para revisão posterior ou para apresentar à equipe. Exporte em PDF se necessário."
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
                title: "Perfil do Usuário",
                content: "Atualize seu nome, cargo e foto de perfil. Essas informações aparecem no sidebar e são usadas para personalizar as interações com o Chat."
            },
            {
                title: "Tema Visual",
                content: "Escolha entre tema claro (ideal para ambientes bem iluminados) ou escuro (mais confortável para uso prolongado). O sistema salva sua preferência automaticamente."
            },
            {
                title: "Notificações (Em Breve)",
                content: "Configure alertas por email: frequência (imediato, diário, semanal), tipos de alerta (rupturas, excessos, oportunidades), e limites personalizados."
            },
            {
                title: "Segurança",
                content: "Gerencie sua senha, configure autenticação de dois fatores (2FA) e veja o histórico de acessos à sua conta."
            },
            {
                title: "Integrações",
                content: "Veja e gerencie as integrações ativas com seu ERP, e-commerce ou outras ferramentas. Status de sincronização e logs de erros."
            }
        ]
    }
];

const faqItems = [
    // Conceitos Básicos
    {
        q: "O que significa 'Cobertura de Estoque'?",
        a: "É quantos dias o estoque atual durará mantendo a média de vendas. Por exemplo, 30 dias = produto para 1 mês. Menos de 7 dias é crítico, mais de 60 dias é excesso."
    },
    {
        q: "Como funciona a Curva ABC?",
        a: "Produtos A são os ~20% que geram ~80% do faturamento (prioridade máxima para não faltar). B são intermediários (~30% dos itens, ~15% do faturamento). C são os de menor giro (~50% dos itens, ~5% do faturamento) mas ainda necessários no mix."
    },
    {
        q: "Qual a diferença entre Ruptura e Atenção?",
        a: "Ruptura = estoque ZERO, você já perdeu vendas. Atenção = estoque baixo (7-15 dias), ainda tem tempo de repor antes de zerar. Priorize resolver rupturas primeiro!"
    },
    {
        q: "O que é Nível de Serviço?",
        a: "É o percentual de produtos com estoque saudável (nem em ruptura, nem em excesso). Ideal é acima de 95%. Abaixo de 90% indica problemas sérios na gestão."
    },
    // IA e Chat
    {
        q: "Como a IA calcula as sugestões de compra?",
        a: "A IA analisa: histórico de vendas (média, sazonalidade), estoque atual, lead time do fornecedor (tempo de entrega), estoque de segurança (margem para variações), e ponto de reposição (ROP) para sugerir a quantidade ideal."
    },
    {
        q: "A IA considera sazonalidade?",
        a: "Sim! O sistema analisa padrões históricos para identificar picos sazonais (ex: mais vendas em dezembro) e ajusta as sugestões de compra e alertas de acordo."
    },
    {
        q: "Posso confiar 100% nas sugestões da IA?",
        a: "Use as sugestões como ponto de partida. A IA é ótima para análises de volume, mas você conhece fatores externos (promoções planejadas, tendências de mercado, novos concorrentes) que ela não tem acesso."
    },
    // Campanhas
    {
        q: "Posso editar os materiais de campanha gerados?",
        a: "Sim e deve! Os textos são sugestões otimizadas para conversão. Adapte ao tom da sua marca, adicione informações locais (endereço, horário) e ajuste valores conforme sua estratégia."
    },
    {
        q: "Por que a campanha recomenda mix ABC?",
        a: "Campanhas só com produtos C (baixo giro) atraem menos clientes. Incluir produtos A (populares) como 'iscas' aumenta o tráfego, e os clientes acabam levando os produtos C em promoção também."
    },
    {
        q: "Com que frequência devo criar campanhas?",
        a: "Depende do seu excesso. Para lojas físicas, campanhas semanais/quinzenais funcionam bem. Para e-commerce, você pode ser mais frequente. Monitore os resultados e ajuste."
    },
    // Técnico
    {
        q: "Os dados são atualizados em tempo real?",
        a: "Depende da integração. Normalmente os dados são sincronizados a cada hora ou diariamente. Veja em Configurações > Integrações a última sincronização."
    },
    {
        q: "Posso acessar de dispositivo móvel?",
        a: "Sim! A plataforma é responsiva e funciona em celulares e tablets. O layout se adapta automaticamente. App nativo está no roadmap futuro."
    },
    {
        q: "Meus dados estão seguros?",
        a: "Sim. Usamos criptografia em trânsito (HTTPS) e em repouso. Autenticação via Supabase com opção de 2FA. Seus dados nunca são compartilhados com terceiros."
    },
    {
        q: "Como é calculado o Ponto de Reposição (ROP)?",
        a: "ROP = (Demanda Média Diária × Lead Time) + Estoque de Segurança. Quando seu estoque chega nesse nível, é hora de pedir mais. O estoque de segurança é calculado com base na variabilidade das vendas."
    },
    {
        q: "Posso exportar relatórios?",
        a: "Sim! Use os botões de exportar em cada página para baixar dados em Excel ou PDF. Ideal para apresentações e análises externas."
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

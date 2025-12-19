"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Bot, Zap, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.2
        }
    }
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-purple-500/30 overflow-hidden relative">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.6, 0.4], // Increased opacity
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-purple-600/30 blur-[100px]" // Bigger and brighter
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3], // Increased opacity
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                    className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[100px]" // Bigger and brighter
                />
            </div>

            {/* Navbar */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-50 border-b border-border bg-black/50 backdrop-blur-xl"
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-foreground shadow-lg shadow-purple-500/20">
                            S
                        </div>
                        <span className="text-lg font-bold tracking-tight">SmartOrders</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Entrar
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
                        >
                            Começar Agora
                        </Link>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 lg:pt-32 text-center">
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer}
                    className="max-w-5xl mx-auto"
                >
                    <motion.div
                        variants={fadeInUp}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 mb-8 backdrop-blur-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-foreground/80">Sistema V 1.0 Online</span>
                    </motion.div>

                    <motion.h1
                        variants={fadeInUp}
                        className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl"
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            Controle de Estoque
                        </span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-gradient-x bg-[length:200%_auto]">
                            Inteligente & Ágil.
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={fadeInUp}
                        className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed"
                    >
                        Gerencie fornecedores, evite rupturas e otimize suas compras com o poder da Inteligência Artificial.
                        Tudo em uma interface moderna que trabalha por você.
                    </motion.p>

                    <motion.div
                        variants={fadeInUp}
                        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/login"
                            className="group relative flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-black transition-all hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            Acessar Plataforma
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            href="/login"
                            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-border bg-accent px-8 text-base font-medium text-foreground transition-all hover:bg-accent"
                        >
                            Ver Demonstração
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Dashboard Preview (Visual Mockup) */}
                <motion.div
                    initial={{ opacity: 0, y: 100, rotateX: 20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1, delay: 0.5, type: "spring" }}
                    className="mt-20 relative w-full max-w-6xl px-4"
                >
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-2xl opacity-40 animate-pulse" />
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#0F0F0F] border border-border shadow-2xl flex items-center justify-center group ring-1 ring-white/10">
                        {/* Abstract UI Elements - More Visible Now */}
                        <div className="absolute inset-0 p-8 flex flex-col gap-6 opacity-80">
                            {/* Fake Header */}
                            <div className="h-8 w-full border-b border-border flex items-center justify-between pb-4">
                                <div className="h-4 w-32 rounded bg-accent" />
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 rounded-full bg-accent" />
                                    <div className="h-8 w-8 rounded-full bg-accent" />
                                </div>
                            </div>

                            {/* Fake KPIs */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="h-24 rounded-xl bg-accent border border-border p-4">
                                    <div className="h-8 w-8 rounded bg-purple-500/20 mb-2" />
                                    <div className="h-4 w-16 rounded bg-accent" />
                                </div>
                                <div className="h-24 rounded-xl bg-accent border border-border p-4">
                                    <div className="h-8 w-8 rounded bg-blue-500/20 mb-2" />
                                    <div className="h-4 w-16 rounded bg-accent" />
                                </div>
                                <div className="h-24 rounded-xl bg-accent border border-border p-4">
                                    <div className="h-8 w-8 rounded bg-green-500/20 mb-2" />
                                    <div className="h-4 w-16 rounded bg-accent" />
                                </div>
                                <div className="h-24 rounded-xl bg-accent border border-border p-4">
                                    <div className="h-8 w-8 rounded bg-red-500/20 mb-2" />
                                    <div className="h-4 w-16 rounded bg-accent" />
                                </div>
                            </div>

                            {/* Fake Chart Area */}
                            <div className="flex-1 grid grid-cols-3 gap-4">
                                <div className="col-span-2 rounded-xl bg-accent border border-border p-4 flex items-end gap-2">
                                    <div className="h-[40%] w-full rounded-t bg-accent" />
                                    <div className="h-[70%] w-full rounded-t bg-purple-500/30" />
                                    <div className="h-[50%] w-full rounded-t bg-accent" />
                                    <div className="h-[80%] w-full rounded-t bg-purple-500/40" />
                                    <div className="h-[60%] w-full rounded-t bg-accent" />
                                </div>
                                <div className="rounded-xl bg-accent border border-border p-4 space-y-2">
                                    <div className="h-3 w-full rounded bg-accent" />
                                    <div className="h-3 w-2/3 rounded bg-accent" />
                                    <div className="h-3 w-3/4 rounded bg-accent" />
                                </div>
                            </div>
                        </div>

                        {/* Centered CTA Overlay */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center transition-all duration-500 group-hover:backdrop-blur-none group-hover:bg-black/40">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6 group-hover:scale-110 transition-transform duration-500">
                                <BarChart3 className="w-10 h-10 text-foreground" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">Dashboard em Tempo Real</h3>
                            <p className="text-foreground/60 mb-6 max-w-md">
                                Acompanhe métricas vitais, identifique riscos e tome decisões baseadas em dados.
                            </p>
                            <Link href="/login" className="rounded-full bg-accent border border-border px-6 py-2 text-sm font-medium hover:bg-white hover:text-black transition-colors">
                                Explorar Agora
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Features Grid */}
                <div className="mt-32 grid gap-8 pb-32 sm:grid-cols-3 text-left max-w-6xl w-full">
                    {[
                        {
                            title: "IA Integrada",
                            desc: "Converse com seu estoque. Peça análises e sugestões usando linguagem natural.",
                            icon: Bot,
                            color: "text-purple-400",
                            bg: "bg-purple-500/20"
                        },
                        {
                            title: "Gestão Inteligente",
                            desc: "Evite rupturas com cálculos automáticos de Ponto de Pedido e Estoque de Segurança.",
                            icon: TrendingUp,
                            color: "text-blue-400",
                            bg: "bg-blue-500/20"
                        },
                        {
                            title: "Economia Real",
                            desc: "Reduza custos de estoque parado e compre apenas o necessário, no momento certo.",
                            icon: DollarSign,
                            color: "text-green-400",
                            bg: "bg-green-500/20"
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            whileHover={{ y: -5 }}
                            className="group relative rounded-2xl border border-border bg-accent p-8 transition-colors hover:bg-accent overflow-hidden"
                        >
                            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.desc}</p>
                            <div className="absolute inset-0 border-2 border-white/0 group-hover:border-border rounded-2xl transition-colors pointer-events-none" />
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <footer className="w-full border-t border-border py-8 text-center text-sm text-muted-foreground backdrop-blur-md">
                    <p>&copy; 2024 SmartOrders. Todos os direitos reservados.</p>
                </footer>
            </main>
        </div>
    );
}

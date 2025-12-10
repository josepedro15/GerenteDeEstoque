"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Bot, Zap } from "lucide-react";
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
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[128px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                    className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[128px]"
                />
            </div>

            {/* Navbar */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl"
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
                            S
                        </div>
                        <span className="text-lg font-bold tracking-tight">SmartOrders</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
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
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-8 backdrop-blur-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-white/80">Sistema V 1.0 Online</span>
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
                            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 text-base font-medium text-white transition-all hover:bg-white/10"
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
                    className="mt-20 relative w-full max-w-6xl"
                >
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-2xl opacity-50 animate-pulse" />
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl flex items-center justify-center group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        {/* Mock UI Content */}
                        <div className="w-full h-full p-8 flex flex-col items-center justify-center space-y-6">
                            <div className="grid grid-cols-3 gap-6 w-3/4 opacity-50 blur-[1px] group-hover:blur-0 group-hover:opacity-100 transition-all duration-700">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-32 rounded-xl bg-white/5 border border-white/5 p-4 space-y-3">
                                        <div className="h-8 w-8 rounded-lg bg-white/10" />
                                        <div className="h-4 w-1/2 rounded bg-white/10" />
                                        <div className="h-6 w-3/4 rounded bg-white/20" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-4">
                                    <BarChart3 className="w-10 h-10 text-white" />
                                </div>
                                <p className="text-white font-medium">Dashboard em Tempo Real</p>
                                <p className="text-white/40 text-sm">Dados que transformam seu negócio</p>
                            </div>
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
                            icon: BarChart3,
                            color: "text-blue-400",
                            bg: "bg-blue-500/20"
                        },
                        {
                            title: "Economia Real",
                            desc: "Reduza custos de estoque parado e compre apenas o necessário, no momento certo.",
                            icon: Zap,
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
                            className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10 overflow-hidden"
                        >
                            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-white group-hover:text-primary transition-colors">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.desc}</p>
                            <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/5 rounded-2xl transition-colors pointer-events-none" />
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <footer className="w-full border-t border-white/5 py-8 text-center text-sm text-muted-foreground backdrop-blur-md">
                    <p>&copy; 2024 SmartOrders. Todos os direitos reservados.</p>
                </footer>
            </main>
        </div>
    );
}

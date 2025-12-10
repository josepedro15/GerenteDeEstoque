"use client";

import { cn } from "@/lib/utils";
import { Link } from "lucide-react"; // Wait, importing Link from lucide? No.
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Sparkles,
    Package,
    Truck,
    Calculator,
    Settings,
    LogOut,
    BarChart
} from "lucide-react";
import { motion } from "framer-motion";
import { signout } from "@/app/login/actions";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Sparkles, label: "Sugestões (IA)", href: "/recommendations", activeColor: "text-blue-400" },
    { icon: Package, label: "Produtos & Estoque", href: "/products" },
    { icon: Truck, label: "Fornecedores", href: "/suppliers" },
    { icon: BarChart, label: "Dashboard de vendas", href: "https://n8n.mathiasvelho.store/webhook/dashboard1" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-card/60 backdrop-blur-xl">
            <div className="flex h-full flex-col px-4 py-6">
                {/* Logo Area */}
                <div className="mb-10 flex items-center gap-2 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        S
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        SmartOrders
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;

                        return (
                            <NextLink
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all hover:bg-white/5",
                                    isActive ? "text-white" : "text-muted-foreground hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 rounded-xl bg-white/5 border border-white/5"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}

                                <item.icon
                                    size={20}
                                    className={cn(
                                        "relative z-10 transition-colors",
                                        isActive ? (item.activeColor || "text-primary") : "group-hover:text-white"
                                    )}
                                />
                                <span className="relative z-10">{item.label}</span>
                            </NextLink>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="mt-auto border-t border-white/5 pt-4">
                    <NextLink
                        href="/calculator"
                        className={cn(
                            "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-white/5",
                            pathname === "/calculator" ? "text-white" : "text-muted-foreground hover:text-white",
                        )}
                    >
                        <Calculator size={20} />
                        <span>Calculadora</span>
                    </NextLink>
                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white">
                        <Settings size={20} />
                        Configurações
                    </button>
                    <form action={signout}>
                        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400">
                            <LogOut size={20} />
                            Sair
                        </button>
                    </form>
                </div>

                {/* User Mini Profile */}
                <div className="mt-6 flex items-center gap-3 rounded-xl bg-white/5 p-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-white">Pedro Silva</span>
                        <span className="text-[10px] text-muted-foreground">Gerente de Compras</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

"use client";

import { cn } from "@/lib/utils";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    Sparkles,
    Package,
    Truck,
    Calculator,
    Settings,
    LogOut,
    BarChart,
    BrainCircuit,
    PackageCheck,
    Megaphone,
    Menu,
    X,
    MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signout } from "@/app/login/actions";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Sparkles, label: "Sugestões (IA)", href: "/recommendations", activeColor: "text-blue-400" },
    { icon: MessageCircle, label: "Bate-papo", href: "/chat", activeColor: "text-indigo-400" },
    { icon: BrainCircuit, label: "Simulador IA", href: "/simulator", activeColor: "text-purple-400" },
    { icon: Megaphone, label: "Marketing AI", href: "/marketing", activeColor: "text-pink-400" },
    { icon: PackageCheck, label: "Fornecedores", href: "/suppliers", activeColor: "text-orange-400" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col px-4 py-6">
            {/* Logo Area */}
            <div className="mb-10 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        S
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        SmartOrders
                    </span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-muted-foreground hover:text-white md:hidden">
                        <X size={24} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <NextLink
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
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
                    href="/settings"
                    onClick={onClose}
                    className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-white/5",
                        pathname === "/settings" ? "text-white" : "text-muted-foreground hover:text-white"
                    )}
                >
                    <Settings size={20} />
                    <span>Configurações</span>
                </NextLink>
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
    );
}

export function Sidebar() {
    return (
        <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-card/60 backdrop-blur-xl">
            <SidebarContent />
        </aside>
    );
}

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Header - Visible only on small screens */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-black/80 backdrop-blur-xl z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        S
                    </div>
                    <span className="font-bold text-white">SmartOrders</span>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-white hover:bg-white/10 rounded-lg"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#0A0A0A] border-r border-white/10 md:hidden"
                        >
                            <SidebarContent onClose={() => setIsOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

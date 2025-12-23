"use client";

import { cn } from "@/lib/utils";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
    MessageCircle,
    Sun,
    Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signout } from "@/app/login/actions";
import { useTheme } from "@/contexts/ThemeContext";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Package, label: "Produtos", href: "/products", activeColor: "text-emerald-400" },
    // { icon: Sparkles, label: "Sugestões (IA)", href: "/recommendations", activeColor: "text-blue-400" },
    { icon: MessageCircle, label: "Bate-papo", href: "/chat", activeColor: "text-indigo-400" },
    // { icon: BrainCircuit, label: "Simulador IA", href: "/simulator", activeColor: "text-purple-400" },
    { icon: Megaphone, label: "Campanhas", href: "/marketing", activeColor: "text-pink-400" },
];

// Theme Toggle Component
function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
            {theme === "dark" ? (
                <>
                    <Sun size={20} className="text-yellow-400" />
                    <span>Modo Claro</span>
                </>
            ) : (
                <>
                    <Moon size={20} className="text-indigo-400" />
                    <span>Modo Escuro</span>
                </>
            )}
        </button>
    );
}

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
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        SmartOrders
                    </span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground md:hidden">
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
                                "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all hover:bg-accent",
                                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-0 rounded-xl bg-accent border border-border"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}

                            <item.icon
                                size={20}
                                className={cn(
                                    "relative z-10 transition-colors",
                                    isActive ? (item.activeColor || "text-primary") : "group-hover:text-foreground"
                                )}
                            />
                            <span className="relative z-10">{item.label}</span>
                        </NextLink>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto border-t border-border pt-4 space-y-1">
                {/* Theme Toggle */}
                <ThemeToggle />
                <NextLink
                    href="/settings"
                    onClick={onClose}
                    className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-accent",
                        pathname === "/settings" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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
            <UserProfile />
        </div>
    );
}

function UserProfile() {
    const [user, setUser] = useState({ name: "Pedro Silva", role: "Gerente de Compras", avatar: null as string | null });

    useEffect(() => {
        // Load initial
        const stored = localStorage.getItem("user_profile");
        if (stored) {
            setUser(JSON.parse(stored));
        }

        // Listen for updates
        const handleUpdate = () => {
            const stored = localStorage.getItem("user_profile");
            if (stored) {
                setUser(JSON.parse(stored));
            }
        };

        window.addEventListener("user-profile-updated", handleUpdate);
        return () => window.removeEventListener("user-profile-updated", handleUpdate);
    }, []);

    return (
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-accent p-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {user.avatar ? (
                    <img
                        src={user.avatar}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    user.name.charAt(0)
                )}
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">{user.name}</span>
                <span className="text-[10px] text-muted-foreground">{user.role}</span>
            </div>
        </div>
    );
}


export function Sidebar() {
    return (
        <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card/80 backdrop-blur-xl">
            <SidebarContent />
        </aside>
    );
}

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Header - Visible only on small screens */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-xl z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        S
                    </div>
                    <span className="font-bold text-foreground">SmartOrders</span>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-foreground hover:bg-accent rounded-lg"
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
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-card border-r border-border md:hidden"
                        >
                            <SidebarContent onClose={() => setIsOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

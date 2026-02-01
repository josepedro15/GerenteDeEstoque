"use client";

import { cn } from "@/lib/utils";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
    LayoutDashboard,
    Package,
    Settings,
    LogOut,
    Megaphone,
    Menu,
    X,
    MessageCircle,
    Sun,
    Moon,
    Rocket,
    BookOpen,
    Truck,
    ShoppingCart,
    Sparkles,
    Shirt,
    Clock,
    ChevronLeft,
    ChevronRight,
    Store
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signout } from "@/app/login/actions";
import { useTheme } from "@/contexts/ThemeContext";
import { BranchSelector } from "@/components/layout/BranchSelector";
import { useSidebar } from "@/contexts/SidebarContext";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Package, label: "Produtos", href: "/products", activeColor: "text-emerald-400" },
    { icon: Truck, label: "Fornecedores", href: "/suppliers", activeColor: "text-blue-400" },
    { icon: ShoppingCart, label: "Pedidos", href: "/orders", activeColor: "text-amber-400" },
    { icon: BookOpen, label: "Lógica", href: "/logic", activeColor: "text-purple-400" },
    { icon: Clock, label: "Histórico de Pedidos", href: "/orders/history", activeColor: "text-orange-400" },
    { icon: MessageCircle, label: "Bate-papo", href: "/chat", activeColor: "text-indigo-400" },
    { icon: Megaphone, label: "Histórico de Campanhas", href: "/marketing", activeColor: "text-pink-400" },
    { icon: Sparkles, label: "Nova Campanha", href: "/marketing/new", activeColor: "text-purple-400" },
    { icon: Rocket, label: "Roadmap", href: "/roadmap", activeColor: "text-blue-400" },
    { icon: BookOpen, label: "Ajuda", href: "/help", activeColor: "text-cyan-400" },
];

// Actually ThemeToggle has text "Modo Claro/Escuro". I should probably accept isCollapsed prop or context there too.

// Let's rewrite SidebarContent and Sidebar fully to be safe and clean.

// Theme Toggle Component
function ThemeToggle({ isCollapsed }: { isCollapsed: boolean }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Alternar Tema" : undefined}
        >
            {theme === "dark" ? (
                <>
                    <Sun size={20} className="text-yellow-400 shrink-0" />
                    {!isCollapsed && <span>Modo Claro</span>}
                </>
            ) : (
                <>
                    <Moon size={20} className="text-indigo-400 shrink-0" />
                    {!isCollapsed && <span>Modo Escuro</span>}
                </>
            )}
        </button>
    );
}

function SidebarContent({
    onClose,
    isMobile = false,
    collapsed: propCollapsed
}: {
    onClose?: () => void,
    isMobile?: boolean,
    collapsed?: boolean
}) {
    const pathname = usePathname();
    const { isCollapsed: contextCollapsed, toggleSidebar } = useSidebar();

    // Determine effective collapsed state:
    // 1. If passed as prop, use it (highest priority for hover overrides)
    // 2. If mobile, never collapsed (false)
    // 3. Otherwise use context (global preference)
    const collapsed = propCollapsed !== undefined
        ? propCollapsed
        : (isMobile ? false : contextCollapsed);

    return (
        <div className="flex h-full flex-col px-3 py-6">
            {/* Logo Area */}
            <div className={cn("mb-6 flex items-center px-2", collapsed ? "justify-center" : "justify-between")}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        S
                    </div>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xl font-bold tracking-tight text-foreground whitespace-nowrap"
                        >
                            SmartOrders
                        </motion.span>
                    )}
                </div>

                {/* Mobile Close Button */}
                {isMobile && onClose && (
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground md:hidden">
                        <X size={24} />
                    </button>
                )}

                {/* Desktop Collapse Button */}
                {!isMobile && (
                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            "hidden md:flex p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
                            collapsed && "absolute -right-3 top-9 bg-card border border-border shadow-sm rounded-full p-1" // Floating toggle when collapsed
                        )}
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={18} />}
                    </button>
                )}
            </div>

            {/* Branch Selector - Hide or Mini when collapsed */}
            <div className={cn("mb-2 transition-all duration-300", collapsed ? "px-0" : "")}>
                {collapsed ? (
                    <div className="flex justify-center mb-4">
                        <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground" title="Filiais">
                            <Store size={20} />
                        </div>
                    </div>
                ) : (
                    <BranchSelector />
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <NextLink
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all hover:bg-accent",
                                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                                collapsed && "justify-center px-2"
                            )}
                            title={collapsed ? item.label : undefined}
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
                                size={24}
                                className={cn(
                                    "relative z-10 shrink-0 transition-colors",
                                    isActive ? (item.activeColor || "text-primary") : "group-hover:text-foreground"
                                )}
                            />
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="relative z-10 whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </NextLink>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto border-t border-border pt-4 space-y-1">
                {/* Theme Toggle */}
                <ThemeToggle isCollapsed={collapsed} />
                <NextLink
                    href="/settings"
                    onClick={onClose}
                    className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-accent",
                        pathname === "/settings" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                        collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? "Configurações" : undefined}
                >
                    <Settings size={20} className="shrink-0" />
                    {!collapsed && <span>Configurações</span>}
                </NextLink>
                <form action={signout} className="w-full">
                    <button className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400",
                        collapsed && "justify-center px-2"
                    )}
                        title={collapsed ? "Sair" : undefined}
                    >
                        <LogOut size={20} className="shrink-0" />
                        {!collapsed && <span>Sair</span>}
                    </button>
                </form>
            </div>

            {/* User Mini Profile */}
            <UserProfile isCollapsed={collapsed} />
        </div>
    );
}

function UserProfile({ isCollapsed }: { isCollapsed: boolean }) {
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
        <div className={cn(
            "mt-6 flex items-center gap-3 rounded-xl bg-accent p-3 transition-all",
            isCollapsed && "p-2 justify-center bg-transparent"
        )}>
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
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
            {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-medium text-foreground truncate">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{user.role}</span>
                </div>
            )}
        </div>
    );
}


export function Sidebar() {
    const { isCollapsed, isHovered, setIsHovered } = useSidebar();
    // Local ref for timeout logic doesn't change
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        // Only expand on hover if we are effectively collapsed by context
        if (isCollapsed) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsHovered(true);
            }, 300); // 300ms delay to prevent accidental expansion
        }
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsHovered(false);
    };

    // Effective collapsed state: 
    // It is collapsed if context says so AND we are NOT hovering.
    // However, if context says expanded, it's always expanded.
    const effectiveCollapsed = isCollapsed && !isHovered;

    return (
        <aside
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "hidden md:flex fixed left-0 top-0 z-40 h-screen border-r border-border backdrop-blur-xl transition-all duration-300 ease-in-out bg-card",
                effectiveCollapsed ? "w-20" : "w-64"
            )}
        >
            <SidebarContent collapsed={effectiveCollapsed} />
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

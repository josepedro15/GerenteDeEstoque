"use client";

import { useState, useRef, useEffect } from "react";
import { Store, ChevronDown, Check, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBranch, Branch } from "@/contexts/BranchContext";
import { cn } from "@/lib/utils";

export function BranchSelector() {
    const { branches, selectedBranch, selectBranch, isLoading } = useBranch();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="px-3 py-2 mb-4">
                <div className="h-10 rounded-xl bg-accent/50 animate-pulse" />
            </div>
        );
    }

    if (branches.length === 0) {
        return null; // Não mostra seletor se não tem filiais
    }

    return (
        <div ref={dropdownRef} className="relative px-3 mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
                    isOpen
                        ? "bg-accent border-primary/50"
                        : "bg-accent/50 border-border hover:bg-accent hover:border-border"
                )}
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Store size={16} className="text-primary" />
                </div>
                <div className="flex-1 text-left">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        Filial
                    </p>
                    <p className="text-sm font-medium text-foreground truncate">
                        {selectedBranch ? selectedBranch.name : "Todas as Filiais"}
                    </p>
                </div>
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-3 right-3 top-full mt-2 z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
                    >
                        <div className="p-2 max-h-64 overflow-y-auto">
                            {/* Opção: Todas as Filiais */}
                            <button
                                onClick={() => {
                                    selectBranch(null);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                    selectedBranch === null
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-accent text-foreground"
                                )}
                            >
                                <Building2 size={16} />
                                <span className="flex-1 text-left text-sm font-medium">
                                    Todas as Filiais
                                </span>
                                {selectedBranch === null && <Check size={16} />}
                            </button>

                            <div className="my-2 h-px bg-border" />

                            {/* Lista de Filiais */}
                            {branches.map((branch) => (
                                <button
                                    key={branch.id}
                                    onClick={() => {
                                        selectBranch(branch);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                        selectedBranch?.id === branch.id
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-accent text-foreground"
                                    )}
                                >
                                    <Store size={16} />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium">{branch.name}</p>
                                        {branch.city && (
                                            <p className="text-xs text-muted-foreground">
                                                {branch.city}
                                            </p>
                                        )}
                                    </div>
                                    {selectedBranch?.id === branch.id && <Check size={16} />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Branch {
    id: string;
    name: string;
    city?: string;
}

interface BranchContextType {
    branches: Branch[];
    selectedBranch: Branch | null;
    isLoading: boolean;
    selectBranch: (branch: Branch | null) => void;
    isAllBranches: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const STORAGE_KEY = "selected_branch";

export function BranchProvider({ children }: { children: ReactNode }) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Carregar filiais e seleção salva
    useEffect(() => {
        async function loadBranches() {
            try {
                // Carregar filiais do servidor
                const response = await fetch("/api/branches");
                if (response.ok) {
                    const data = await response.json();
                    setBranches(data.branches || []);
                }

                // Recuperar seleção do localStorage
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setSelectedBranch(parsed);
                }
            } catch (error) {
                console.error("Erro ao carregar filiais:", error);
                // Fallback: dados mock para desenvolvimento
                setBranches([
                    { id: "1", name: "Loja Centro", city: "São Paulo" },
                    { id: "2", name: "Loja Shopping", city: "São Paulo" },
                    { id: "3", name: "Loja Norte", city: "Guarulhos" },
                ]);
            } finally {
                setIsLoading(false);
            }
        }

        loadBranches();
    }, []);

    const selectBranch = (branch: Branch | null) => {
        setSelectedBranch(branch);
        if (branch) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(branch));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        // Dispatch event para componentes reagirem
        window.dispatchEvent(new CustomEvent("branch:changed", { detail: branch }));
    };

    const isAllBranches = selectedBranch === null;

    return (
        <BranchContext.Provider
            value={{
                branches,
                selectedBranch,
                isLoading,
                selectBranch,
                isAllBranches
            }}
        >
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error("useBranch must be used within a BranchProvider");
    }
    return context;
}

// Hook para obter o id_loja para queries
export function useSelectedBranchId(): string | null {
    const { selectedBranch } = useBranch();
    return selectedBranch?.id || null;
}

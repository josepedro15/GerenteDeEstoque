"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    isHovered: boolean;
    setIsHovered: (hover: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("sidebar_collapsed");
        if (stored) {
            setIsCollapsed(stored === "true");
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar_collapsed", String(newState));
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isHovered, setIsHovered }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}

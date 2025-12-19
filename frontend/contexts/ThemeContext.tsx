"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    // Carrega preferência do localStorage
    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored) {
            setTheme(stored);
        }
        setMounted(true);
    }, []);

    // Aplica classe no HTML
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        if (theme === "light") {
            root.classList.add("light");
            root.classList.remove("dark");
        } else {
            root.classList.add("dark");
            root.classList.remove("light");
        }
        localStorage.setItem("theme", theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === "dark" ? "light" : "dark");
    };

    // Evita flash de tema errado
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        // Return safe defaults for SSR/prerender
        return { theme: "dark" as const, toggleTheme: () => { } };
    }
    return context;
}

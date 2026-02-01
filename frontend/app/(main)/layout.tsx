"use client";

import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { GlobalChatWidget } from "@/components/chat/GlobalChatWidget";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isCollapsed, isHovered } = useSidebar();

    // Effective state matches Sidebar logic: expanded if hovering
    const effectiveCollapsed = isCollapsed && !isHovered;

    return (
        <div className="flex min-h-[100dvh] bg-background text-foreground">
            {/* Sidebar Desktop (Fixed) */}
            <Sidebar />

            {/* Sidebar Mobile (Drawer + Header) */}
            <MobileNav />

            {/* Content Area - Adjusted padding for mobile (top) and desktop (left) */}
            <main
                className={cn(
                    "flex-1 transition-all duration-300 pt-16 md:pt-0 overflow-hidden",
                    effectiveCollapsed ? "md:pl-20" : "md:pl-64"
                )}
            >
                {children}
            </main>
            <GlobalChatWidget />
        </div>
    );
}

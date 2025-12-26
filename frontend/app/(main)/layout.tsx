import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { GlobalChatWidget } from "@/components/chat/GlobalChatWidget";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-[100dvh] bg-background text-foreground">
            {/* Sidebar Desktop (Fixed) */}
            <Sidebar />

            {/* Sidebar Mobile (Drawer + Header) */}
            <MobileNav />

            {/* Content Area - Adjusted padding for mobile (top) and desktop (left) */}
            <main className="flex-1 transition-all duration-300 pt-16 md:pt-0 md:pl-64 overflow-hidden">
                {children}
            </main>
            <GlobalChatWidget />
        </div>
    );
}

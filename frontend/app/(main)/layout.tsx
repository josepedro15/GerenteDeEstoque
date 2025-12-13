import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { GlobalChatWidget } from "@/components/chat/GlobalChatWidget";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar Desktop (Fixed) */}
            <Sidebar />

            {/* Sidebar Mobile (Drawer + Header) */}
            <MobileNav />

            {/* Content Area - Adjusted padding for mobile (top) and desktop (left) */}
            <main className="flex-1 transition-all duration-300 pt-16 md:pt-0 md:pl-64">
                <div className="container mx-auto p-4 md:p-8 lg:p-10 max-w-7xl">
                    {children}
                </div>
            </main>
            <GlobalChatWidget />
        </div>
    );
}

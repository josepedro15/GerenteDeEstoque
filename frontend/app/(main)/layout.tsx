import { Sidebar } from "@/components/layout/sidebar";
import { GlobalChatWidget } from "@/components/chat/GlobalChatWidget";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar is fixed, so we add padding left to main content */}
            <Sidebar />
            <main className="flex-1 pl-64 transition-all duration-300">
                <div className="container mx-auto p-6 md:p-8 lg:p-10 max-w-7xl">
                    {children}
                </div>
            </main>
            <GlobalChatWidget />
        </div>
    );
}

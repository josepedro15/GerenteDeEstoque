import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/contexts/ChatContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BranchProvider } from "@/contexts/BranchContext";
import { SidebarProvider } from "@/contexts/SidebarContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartOrders - Gestão Inteligente de Estoque",
  description: "Plataforma de gestão de estoque com IA para análise, recomendações e campanhas de marketing",
  keywords: ["estoque", "gestão", "IA", "inventário", "análise"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <BranchProvider>
            <ChatProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </ChatProvider>
          </BranchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


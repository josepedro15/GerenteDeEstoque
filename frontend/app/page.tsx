export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[128px]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 to-blue-500" />
                        <span className="text-lg font-bold tracking-tight">GerenteDeEstoque</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
                            Entrar
                        </a>
                        <a
                            href="/login"
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
                        >
                            Começar Agora
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-32 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-8 backdrop-blur-sm">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-white/80">Sistema V 1.0 Online</span>
                </div>

                <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                    O Futuro do Controle <br />
                    de Estoque Inteligente.
                </h1>

                <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground">
                    Gerencie fornecedores, evite rupturas e otimize suas compras com o poder da Inteligência Artificial.
                    Tudo em uma interface moderna e intuitiva.
                </p>

                <div className="mt-10 flex items-center gap-4">
                    <a
                        href="/login"
                        className="group relative flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-black transition-all hover:bg-white/90 hover:ring-2 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-black"
                    >
                        Acessar Plataforma
                        <svg
                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </div>

                {/* Dashboard Preview (Visual Mockup) */}
                <div className="mt-20 relative w-full max-w-5xl rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm shadow-2xl">
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur opacity-50" />
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/80 border border-white/5 flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <div className="h-20 w-20 rounded-2xl bg-white/5 mx-auto flex items-center justify-center border border-white/10">
                                <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="text-white/40 text-sm">Dashboard Interativo</p>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-32 grid gap-8 pb-32 sm:grid-cols-3 text-left max-w-6xl">
                    <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10">
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-white">IA Integrada</h3>
                        <p className="text-muted-foreground">Converse com seu estoque. Peça análises, sugestões e relatórios usando linguagem natural.</p>
                    </div>
                    <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10">
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-white">Gestão Inteligente</h3>
                        <p className="text-muted-foreground">Evite rupturas com cálculos automáticos de Ponto de Pedido e Estoque de Segurança.</p>
                    </div>
                    <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10">
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-white">Economia Real</h3>
                        <p className="text-muted-foreground">Reduza custos de estoque parado e compre apenas o necessário, no momento certo.</p>
                    </div>
                </div>

                {/* Footer */}
                <footer className="w-full border-t border-white/5 py-8 text-center text-sm text-muted-foreground">
                    <p>&copy; 2024 GerenteDeEstoque. Todos os direitos reservados.</p>
                </footer>
            </main>
        </div>
    );
}

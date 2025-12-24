'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log do erro para monitoramento
        console.error('Erro na aplicação:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                        Algo deu errado!
                    </h2>
                    <p className="text-muted-foreground">
                        Ocorreu um erro inesperado. Tente recarregar a página.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={reset}
                        className="gap-2"
                    >
                        <RefreshCw size={16} />
                        Tentar novamente
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/dashboard'}
                    >
                        Voltar ao Dashboard
                    </Button>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-6 text-left bg-muted/50 rounded-lg p-4">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                            Detalhes do erro (dev only)
                        </summary>
                        <pre className="mt-2 text-xs text-red-400 overflow-auto">
                            {error.message}
                            {error.stack && `\n\n${error.stack}`}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}

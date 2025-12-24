export default function ConfigErrorPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
            <div className="max-w-md text-center">
                <div className="mb-6 text-6xl">⚠️</div>
                <h1 className="text-2xl font-bold mb-4">
                    Erro de Configuração
                </h1>
                <p className="text-gray-400 mb-6">
                    O sistema não está configurado corretamente.
                    Verifique se as variáveis de ambiente estão definidas:
                </p>
                <ul className="text-left text-sm text-gray-500 bg-gray-800 rounded-lg p-4 mb-6">
                    <li className="mb-2">• NEXT_PUBLIC_SUPABASE_URL</li>
                    <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                </ul>
                <p className="text-sm text-gray-500">
                    Se você é o administrador, configure as variáveis no arquivo .env.local
                </p>
            </div>
        </div>
    );
}

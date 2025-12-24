/**
 * Validação de variáveis de ambiente
 * Este arquivo deve ser importado no início da aplicação para garantir
 * que todas as variáveis de ambiente necessárias estão configuradas.
 */

type EnvVarConfig = {
    required: boolean;
    description: string;
};

const envVars: Record<string, EnvVarConfig> = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: {
        required: true,
        description: 'URL do projeto Supabase'
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        required: true,
        description: 'Chave anônima do Supabase'
    },

    // N8N Webhooks
    N8N_CHAT_WEBHOOK: {
        required: false,
        description: 'URL do webhook do chat n8n'
    },
    N8N_MARKETING_WEBHOOK_URL: {
        required: false,
        description: 'URL do webhook de marketing n8n'
    },

    // Database (usado apenas se não usar Supabase diretamente)
    DB_USER: {
        required: false,
        description: 'Usuário do banco de dados PostgreSQL'
    },
    DB_HOST: {
        required: false,
        description: 'Host do banco de dados PostgreSQL'
    },
    DB_NAME: {
        required: false,
        description: 'Nome do banco de dados PostgreSQL'
    },
    DB_PASSWORD: {
        required: false,
        description: 'Senha do banco de dados PostgreSQL'
    },
    DB_PORT: {
        required: false,
        description: 'Porta do banco de dados PostgreSQL'
    },
};

export function validateEnv(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, config] of Object.entries(envVars)) {
        const value = process.env[key];

        if (config.required && !value) {
            errors.push(`❌ Variável de ambiente obrigatória não definida: ${key} - ${config.description}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export function assertEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Variável de ambiente não definida: ${key}`);
    }
    return value;
}

// Valida no build/startup se estiver em ambiente de desenvolvimento
if (process.env.NODE_ENV === 'development') {
    const { valid, errors } = validateEnv();
    if (!valid) {
        console.warn('⚠️ Avisos de configuração de ambiente:');
        errors.forEach(err => console.warn(err));
    }
}

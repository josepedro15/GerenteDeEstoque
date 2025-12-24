/**
 * Valores padrão centralizados para o sistema
 * Evita hardcoding em múltiplos arquivos
 */

// Valores padrão para perfil de usuário
export const USER_DEFAULTS = {
    displayName: 'Novo Usuário',
    role: 'Usuário',
    avatarPlaceholder: null as string | null,
} as const;

// Configurações da aplicação
export const APP_CONFIG = {
    defaultLanguage: 'pt-BR',
    defaultPageSize: 50,
    chatHistoryLimit: 100,
    maxProductsPerCampaign: 10,
    maxImageSizeMB: 2,
} as const;

// Mensagens padrão
export const DEFAULT_MESSAGES = {
    welcome: 'Olá! Posso ajudar com análises de estoque ou sugestões de compra?',
    chatCleared: 'Conversa limpa! Como posso ajudar?',
    loading: 'Carregando...',
    error: 'Ocorreu um erro. Tente novamente.',
} as const;

// Nomes de Storage Buckets
export const STORAGE_BUCKETS = {
    campaignImages: 'campaign-images',
    userAvatars: 'user-avatars',
} as const;

'use server';

import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

export interface AuditLogEntry {
    id: string;
    user_id: string;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    old_data: any | null;
    new_data: any | null;
    metadata?: any | null;
    created_at: string;
}

/**
 * Registra uma ação no log de auditoria
 */
export async function logAuditAction(
    action: string,
    entityType?: string,
    entityId?: string,
    changes?: { old?: any; new?: any }
): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            logger.warn("Audit: No authenticated user for action:", action);
            return false;
        }

        const { error } = await supabase
            .from('audit_log')
            .insert({
                user_id: user.id,
                action: action,
                entity_type: entityType || null,
                entity_id: entityId || null,
                old_data: changes?.old || null,
                new_data: changes?.new || null,
            });

        if (error) {
            logger.error("Audit log error:", error);
            return false;
        }

        logger.debug("Audit logged:", { action, entityType, entityId });
        return true;
    } catch (e) {
        logger.error("Audit log exception:", e);
        return false;
    }
}

/**
 * Busca logs de auditoria do usuário
 */
export async function getUserAuditLogs(
    limit = 50,
    offset = 0
): Promise<AuditLogEntry[]> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        const { data, error } = await supabase
            .from('audit_log')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            logger.error("Error fetching audit logs:", error);
            return [];
        }

        return data || [];
    } catch (e) {
        logger.error("Error fetching audit logs:", e);
        return [];
    }
}

/**
 * Busca logs de auditoria com paginação
 */
export async function getAuditLog(
    limit = 20,
    offset = 0
): Promise<{ entries: AuditLogEntry[]; hasMore: boolean }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { entries: [], hasMore: false };

        const { data, error, count } = await supabase
            .from('audit_log')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            logger.error("Error fetching audit log:", error);
            return { entries: [], hasMore: false };
        }

        const hasMore = count ? offset + limit < count : false;
        return { entries: data || [], hasMore };
    } catch (e) {
        logger.error("Error fetching audit log:", e);
        return { entries: [], hasMore: false };
    }
}

/**
 * Ações comuns para logging
 */
export const AUDIT_ACTIONS = {
    // Campanhas
    CAMPAIGN_CREATED: 'campaign.created',
    CAMPAIGN_APPROVED: 'campaign.approved',
    CAMPAIGN_SAVED: 'campaign.saved',
    CAMPAIGN_DELETED: 'campaign.deleted',
    CAMPAIGN_EXPORTED: 'campaign.exported',

    // Templates
    TEMPLATE_CREATED: 'template.created',
    TEMPLATE_UPDATED: 'template.updated',
    TEMPLATE_DELETED: 'template.deleted',

    // Configurações
    SETTINGS_UPDATED: 'settings.updated',
    PROFILE_UPDATED: 'profile.updated',

    // Chat
    CHAT_CLEARED: 'chat.cleared',
    CHAT_SESSION_STARTED: 'chat.session_started',

    // Exportação
    EXPORT_EXCEL: 'export.excel',
    EXPORT_PDF: 'export.pdf',
    DATA_EXPORTED: 'data.exported',

    // Auth
    LOGIN: 'auth.login',
    LOGOUT: 'auth.logout',
} as const;


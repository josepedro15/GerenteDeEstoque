'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { logAuditAction, AUDIT_ACTIONS } from "./audit";

export interface CampaignTemplate {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    template_data: {
        channels?: {
            instagram?: { copyTemplate?: string; imagePromptTemplate?: string };
            whatsapp?: { scriptTemplate?: string; triggerTemplate?: string };
            physical?: { headlineTemplate?: string; subheadlineTemplate?: string; offerTemplate?: string };
        };
        context?: string;
        tags?: string[];
    };
    is_public: boolean;
    usage_count: number;
    created_at: string;
    updated_at: string;
}

/**
 * Lista templates do usuário
 */
export async function getUserTemplates(): Promise<CampaignTemplate[]> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        const { data, error } = await supabase
            .from('campaign_templates')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error("Error fetching templates:", error);
            return [];
        }

        return data || [];
    } catch (e) {
        logger.error("Error fetching templates:", e);
        return [];
    }
}

/**
 * Lista templates públicos
 */
export async function getPublicTemplates(): Promise<CampaignTemplate[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('campaign_templates')
            .select('*')
            .eq('is_public', true)
            .order('usage_count', { ascending: false })
            .limit(20);

        if (error) {
            logger.error("Error fetching public templates:", error);
            return [];
        }

        return data || [];
    } catch (e) {
        logger.error("Error fetching public templates:", e);
        return [];
    }
}

/**
 * Cria um novo template
 */
export async function createTemplate(
    name: string,
    description: string,
    templateData: CampaignTemplate['template_data'],
    isPublic = false
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Usuário não autenticado" };
        }

        const { data, error } = await supabase
            .from('campaign_templates')
            .insert({
                user_id: user.id,
                name: name.substring(0, 200),
                description: description?.substring(0, 1000) || null,
                template_data: templateData,
                is_public: isPublic
            })
            .select('id')
            .single();

        if (error) {
            logger.error("Error creating template:", error);
            return { success: false, error: error.message };
        }

        // Log audit
        await logAuditAction(AUDIT_ACTIONS.TEMPLATE_CREATED, 'template', data.id, { new: { name, isPublic } });

        revalidatePath('/marketing');
        return { success: true, id: data.id };
    } catch (e: any) {
        logger.error("Error creating template:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Atualiza um template
 */
export async function updateTemplate(
    templateId: string,
    updates: Partial<Pick<CampaignTemplate, 'name' | 'description' | 'template_data' | 'is_public'>>
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Usuário não autenticado" };
        }

        const { error } = await supabase
            .from('campaign_templates')
            .update(updates)
            .eq('id', templateId)
            .eq('user_id', user.id);

        if (error) {
            logger.error("Error updating template:", error);
            return { success: false, error: error.message };
        }

        await logAuditAction(AUDIT_ACTIONS.TEMPLATE_UPDATED, 'template', templateId, { new: updates });

        revalidatePath('/marketing');
        return { success: true };
    } catch (e: any) {
        logger.error("Error updating template:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Deleta um template
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const { error } = await supabase
            .from('campaign_templates')
            .delete()
            .eq('id', templateId)
            .eq('user_id', user.id);

        if (error) {
            logger.error("Error deleting template:", error);
            return false;
        }

        await logAuditAction(AUDIT_ACTIONS.TEMPLATE_DELETED, 'template', templateId);

        revalidatePath('/marketing');
        return true;
    } catch (e) {
        logger.error("Error deleting template:", e);
        return false;
    }
}

/**
 * Incrementa contador de uso do template
 */
export async function incrementTemplateUsage(templateId: string): Promise<void> {
    try {
        const supabase = await createClient();

        await supabase.rpc('increment_template_usage', { template_id: templateId });
    } catch (e) {
        logger.error("Error incrementing template usage:", e);
    }
}

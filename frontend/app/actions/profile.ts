'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

// Interface para perfil de usuário
export interface UserProfile {
    user_id: string;
    display_name: string;
    role: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Busca o perfil do usuário autenticado
 */
export async function getUserProfile(): Promise<UserProfile | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            logger.warn("getUserProfile: No authenticated user");
            return null;
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            // Se não existe, cria um novo perfil
            if (error.code === 'PGRST116') {
                logger.info("Creating new profile for user:", user.id);
                return await createUserProfile(user.id, user.email?.split('@')[0] || 'Novo Usuário');
            }
            logger.error("Error fetching profile:", error);
            return null;
        }

        return data;
    } catch (e) {
        logger.error("getUserProfile error:", e);
        return null;
    }
}

/**
 * Cria um novo perfil para o usuário
 */
async function createUserProfile(userId: string, displayName: string): Promise<UserProfile | null> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('user_profiles')
            .insert({
                user_id: userId,
                display_name: displayName,
                role: 'Usuário'
            })
            .select()
            .single();

        if (error) {
            logger.error("Error creating profile:", error);
            return null;
        }

        return data;
    } catch (e) {
        logger.error("createUserProfile error:", e);
        return null;
    }
}

/**
 * Atualiza o perfil do usuário
 */
export async function updateUserProfile(
    displayName: string,
    role: string,
    avatarUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Usuário não autenticado" };
        }

        const updateData: Partial<UserProfile> = {
            display_name: displayName,
            role: role,
        };

        if (avatarUrl !== undefined) {
            updateData.avatar_url = avatarUrl;
        }

        const { error } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: user.id,
                ...updateData
            });

        if (error) {
            logger.error("Error updating profile:", error);
            return { success: false, error: error.message };
        }

        revalidatePath('/settings');
        return { success: true };
    } catch (e: any) {
        logger.error("updateUserProfile error:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Busca perfil por ID (para exibir em outros contextos)
 */
export async function getProfileById(userId: string): Promise<UserProfile | null> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            logger.error("Error fetching profile by ID:", error);
            return null;
        }

        return data;
    } catch (e) {
        logger.error("getProfileById error:", e);
        return null;
    }
}

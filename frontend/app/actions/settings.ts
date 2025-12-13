'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getUserSettings(userId: string) {
    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Relation not found" or "No rows found"
        console.error('Error fetching settings:', error);
        return null;
    }

    return data;
}

export async function saveUserSettings(prevState: any, formData: FormData) {
    const userId = formData.get('userId') as string;
    const phonePrimary = formData.get('phonePrimary') as string;
    const phoneSecondary = formData.get('phoneSecondary') as string;

    // Checkbox handling: if not present, it's false
    const criticalRupture = formData.get('criticalRupture') === 'on';
    const dailyBriefing = formData.get('dailyBriefing') === 'on';
    const weeklyBurn = formData.get('weeklyBurn') === 'on';

    const notificationPreferences = {
        critical_rupture: criticalRupture,
        daily_briefing: dailyBriefing,
        weekly_burn: weeklyBurn
    };

    const { error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: userId,
            phone_primary: phonePrimary,
            phone_secondary: phoneSecondary,
            notification_preferences: notificationPreferences,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error saving settings:', error);
        return { message: 'Erro ao salvar configurações.', type: 'error' };
    }

    revalidatePath('/settings');
    return { message: 'Configurações salvas com sucesso!', type: 'success' };
}

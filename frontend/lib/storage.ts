'use client';

import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = 'campaign-images';

// Upload base64 image diretamente do cliente para Supabase Storage
export async function uploadImageToStorage(
    base64Data: string,
    fileName: string
): Promise<string | null> {
    try {
        if (!base64Data || base64Data.length < 100) {
            console.log("⚠️ Imagem vazia ou inválida");
            return null;
        }

        console.log(`📤 Iniciando upload: ${fileName} (${Math.round(base64Data.length / 1024)}KB)`);

        // Remove data URL prefix if present
        let base64Content = base64Data;
        if (base64Data.includes(',')) {
            base64Content = base64Data.split(',')[1];
        }

        // Convert base64 to Blob
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/png' });

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, blob, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            console.error("❌ Erro upload Storage:", error);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

        console.log("✅ Upload concluído:", urlData.publicUrl);
        return urlData.publicUrl;
    } catch (e) {
        console.error("❌ Erro ao processar imagem:", e);
        return null;
    }
}

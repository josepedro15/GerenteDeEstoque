"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Upload avatar image to Supabase Storage
 * @param base64Data - The base64 encoded image data
 * @param userId - The user ID (used as filename)
 * @returns The public URL of the uploaded image
 */
export async function uploadAvatar(base64Data: string, userId: string): Promise<{ url: string | null; error: string | null }> {
    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Ignored
                        }
                    },
                },
            }
        );

        // Extract base64 content and mime type
        const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            return { url: null, error: 'Formato de imagem inválido' };
        }

        const mimeType = matches[1];
        const base64Content = matches[2];

        // Convert base64 to Uint8Array for upload
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Determine file extension
        const extension = mimeType.split('/')[1] || 'png';
        const fileName = `${userId}.${extension}`;

        // Upload to Supabase Storage (upsert to replace existing)
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, bytes, {
                contentType: mimeType,
                upsert: true
            });

        if (error) {
            console.error('Upload error:', error);
            return { url: null, error: `Erro no upload: ${error.message}` };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return { url: urlData.publicUrl, error: null };

    } catch (err) {
        console.error('Avatar upload error:', err);
        return { url: null, error: 'Erro ao fazer upload da imagem' };
    }
}

/**
 * Get avatar URL for a user
 */
export async function getAvatarUrl(userId: string): Promise<string | null> {
    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Ignored
                        }
                    },
                },
            }
        );

        // List files to find user's avatar (could be .png, .jpg, .jpeg, etc)
        const { data: files } = await supabase.storage
            .from('avatars')
            .list('', {
                search: userId
            });

        if (files && files.length > 0) {
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(files[0].name);

            return urlData.publicUrl;
        }

        return null;
    } catch (err) {
        console.error('Get avatar error:', err);
        return null;
    }
}

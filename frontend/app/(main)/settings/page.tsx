"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Save, Phone, Bell, ShieldAlert, Calendar, Flame, Loader2, User, Camera, CheckCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { getUserSettings, saveUserSettings } from "@/app/actions/settings";
import { uploadAvatar } from "@/app/actions/avatar";
import { createBrowserClient } from "@supabase/ssr";
import { getUserProfile, updateUserProfile } from "@/app/actions/profile";
import { AuditLogViewer } from "@/components/settings/AuditLogViewer";

// Interface para configurações do usuário
interface UserSettings {
    phone_primary?: string;
    phone_secondary?: string;
    notification_preferences?: {
        critical_rupture: boolean;
        daily_briefing: boolean;
        weekly_burn: boolean;
    };
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-foreground transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
            {pending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {pending ? "Salvando..." : "Salvar Alterações"}
        </button>
    );
}

export default function SettingsPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [profileName, setProfileName] = useState("");
    const [profileRole, setProfileRole] = useState("");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);

            // Buscar usuário autenticado
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.warn('Usuário não autenticado');
                setLoading(false);
                return;
            }

            setUserId(user.id);

            // Carregar configurações
            const data = await getUserSettings(user.id);
            setSettings(data || {});

            // Carregar perfil do banco de dados
            const profile = await getUserProfile();
            if (profile) {
                setProfileName(profile.display_name || '');
                setProfileRole(profile.role || '');
                setAvatarPreview(profile.avatar_url || null);

                // Sincronizar com localStorage para sidebar
                localStorage.setItem("user_profile", JSON.stringify({
                    name: profile.display_name,
                    role: profile.role,
                    avatar: profile.avatar_url
                }));
            } else {
                // Fallback para localStorage se não tiver no banco
                const stored = localStorage.getItem("user_profile");
                if (stored) {
                    const localProfile = JSON.parse(stored);
                    setProfileName(localProfile.name || '');
                    setProfileRole(localProfile.role || '');
                    setAvatarPreview(localProfile.avatar || null);
                }
            }

            setLoading(false);
        }
        load();
    }, []);

    // Handler para upload de avatar
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamanho (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert("Imagem muito grande. Máximo 2MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setAvatarPreview(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    // Custom form action wrapper
    const handleSubmit = async (formData: FormData) => {
        const name = formData.get('userName') as string;
        const role = formData.get('userRole') as string;

        let avatarUrl = avatarPreview;

        // Se tem um novo avatar (base64), fazer upload para o Supabase Storage
        if (avatarPreview && avatarPreview.startsWith('data:') && userId) {
            try {
                const uploadResult = await uploadAvatar(avatarPreview, userId);
                if (uploadResult.error) {
                    alert(`Erro no upload da foto: ${uploadResult.error}`);
                    avatarUrl = null;
                } else {
                    avatarUrl = uploadResult.url;
                    setAvatarPreview(avatarUrl);
                }
            } catch (err) {
                console.error('Upload error:', err);
                avatarUrl = null;
            }
        }

        // Salvar perfil no BANCO DE DADOS
        if (name && role) {
            const profileResult = await updateUserProfile(
                name,
                role,
                avatarUrl
            );

            if (!profileResult.success) {
                alert(`Erro ao salvar perfil: ${profileResult.error}`);
            } else {
                // Sincronizar com localStorage para sidebar
                localStorage.setItem("user_profile", JSON.stringify({
                    name,
                    role,
                    avatar: avatarUrl
                }));
                window.dispatchEvent(new Event("user-profile-updated"));

                // Atualizar estados locais
                setProfileName(name);
                setProfileRole(role);
            }
        }

        const result = await saveUserSettings(null, formData);

        // Mostrar mensagem de sucesso
        setSaveMessage("Configurações salvas com sucesso!");
        setTimeout(() => setSaveMessage(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-foreground">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
        );
    }

    const prefs = settings?.notification_preferences || { critical_rupture: true, daily_briefing: true, weekly_burn: true };

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 text-foreground">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-4xl"
            >
                <header className="mb-10 border-b border-border pb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                    <p className="mt-2 text-muted-foreground">
                        Gerencie seus canais de contato e preferências de notificação do Agente.
                    </p>
                </header>

                {/* Success Message */}
                {saveMessage && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-4 py-3 text-emerald-400">
                        <CheckCircle size={18} />
                        <span className="font-medium">{saveMessage}</span>
                    </div>
                )}

                <form action={handleSubmit} className="space-y-8">
                    <input type="hidden" name="userId" value={userId || ''} />

                    {/* Profile Section */}
                    <div className="rounded-2xl border border-border bg-accent p-8 backdrop-blur-xl">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Perfil de Usuário</h2>
                                <p className="text-sm text-muted-foreground">Informações visíveis no seu cartão de perfil.</p>
                            </div>
                        </div>

                        {/* Avatar Upload */}
                        <div className="mb-6 flex items-center gap-6">
                            <div className="relative">
                                <div
                                    className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span>
                                            {profileName ? profileName.charAt(0).toUpperCase() : "U"}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition-colors"
                                >
                                    <Camera size={14} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Foto de Perfil</p>
                                <p className="text-xs text-muted-foreground">Clique para alterar. JPG, PNG até 2MB.</p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                                <input
                                    type="text"
                                    name="userName"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground placeholder-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Cargo / Função</label>
                                <input
                                    type="text"
                                    name="userRole"
                                    value={profileRole}
                                    onChange={(e) => setProfileRole(e.target.value)}
                                    placeholder="Ex: Gerente de Compras"
                                    className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground placeholder-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="rounded-2xl border border-border bg-accent p-8 backdrop-blur-xl">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                                <Phone size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Canais de Contato</h2>
                                <p className="text-sm text-muted-foreground">Telefones para recebimento de alertas via WhatsApp.</p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Celular Principal (Prioritário)</label>
                                <input
                                    type="tel"
                                    name="phonePrimary"
                                    defaultValue={settings?.phone_primary || ''}
                                    placeholder="+55 11 99999-9999"
                                    className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground placeholder-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Celular Secundário (Sócio/Gerente)</label>
                                <input
                                    type="tel"
                                    name="phoneSecondary"
                                    defaultValue={settings?.phone_secondary || ''}
                                    placeholder="+55 11 98888-8888"
                                    className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground placeholder-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="rounded-2xl border border-border bg-accent p-8 backdrop-blur-xl">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Central de Notificações</h2>
                                <p className="text-sm text-muted-foreground">Escolha quais alertas você deseja receber.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Toggle 1 */}
                            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-accent p-4 transition-colors hover:bg-accent">
                                <div className="flex items-center gap-4">
                                    <div className="rounded-full bg-red-500/20 p-2 text-red-400">
                                        <ShieldAlert size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium">Alertas de Ruptura Crítica</div>
                                        <div className="text-sm text-muted-foreground">
                                            Se o estoque cobrir menos de 3 dias. (Envio Imediato)
                                        </div>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="criticalRupture" defaultChecked={prefs.critical_rupture} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                            </label>

                            {/* Toggle 2 */}
                            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-accent p-4 transition-colors hover:bg-accent">
                                <div className="flex items-center gap-4">
                                    <div className="rounded-full bg-cyan-500/20 p-2 text-cyan-400">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium">Resumo Matinal Diário</div>
                                        <div className="text-sm text-muted-foreground">
                                            Briefing com os destaques do dia às 08:00 AM.
                                        </div>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="dailyBriefing" defaultChecked={prefs.daily_briefing} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                            </label>

                            {/* Toggle 3 */}
                            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-accent p-4 transition-colors hover:bg-accent">
                                <div className="flex items-center gap-4">
                                    <div className="rounded-full bg-orange-500/20 p-2 text-orange-400">
                                        <Flame size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium">Oportunidades de Queima</div>
                                        <div className="text-sm text-muted-foreground">
                                            Sugestões semanais para itens com excesso de estoque.
                                        </div>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="weeklyBurn" defaultChecked={prefs.weekly_burn} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <SubmitButton />
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

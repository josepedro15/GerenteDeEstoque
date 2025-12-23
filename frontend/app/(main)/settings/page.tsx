"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Save, Phone, Bell, ShieldAlert, Calendar, Flame, Loader2, User, Camera } from "lucide-react";
import { useFormStatus } from "react-dom";
import { getUserSettings, saveUserSettings } from "@/app/actions/settings";
import { uploadAvatar } from "@/app/actions/avatar";

// Mock User ID for now (In a real app, this comes from Auth)
const MOCK_USER_ID = "b3e2bb3f-d920-444c-87ea-dfbdcb144413";

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
    const [state, formAction] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getUserSettings(MOCK_USER_ID);
            setSettings(data || {});

            // Carregar avatar do localStorage
            const stored = localStorage.getItem("user_profile");
            if (stored) {
                const profile = JSON.parse(stored);
                if (profile.avatar) {
                    setAvatarPreview(profile.avatar);
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
        if (avatarPreview && avatarPreview.startsWith('data:')) {
            try {
                const uploadResult = await uploadAvatar(avatarPreview, MOCK_USER_ID);
                if (uploadResult.error) {
                    alert(`Erro no upload da foto: ${uploadResult.error}`);
                    // Continua sem a foto
                    avatarUrl = null;
                } else {
                    avatarUrl = uploadResult.url;
                    setAvatarPreview(avatarUrl); // Atualiza para URL pública
                }
            } catch (err) {
                console.error('Upload error:', err);
                avatarUrl = null;
            }
        }

        // Salva perfil no localStorage
        if (name && role) {
            localStorage.setItem("user_profile", JSON.stringify({
                name,
                role,
                avatar: avatarUrl
            }));
            window.dispatchEvent(new Event("user-profile-updated"));
        }

        const result = await saveUserSettings(null, formData);

        // @ts-ignore
        import("react-dom").then((rd) => {
            alert(result.message);
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-foreground">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
        );
    }

    const prefs = settings.notification_preferences || { critical_rupture: true, daily_briefing: true, weekly_burn: true };

    return (
        <div className="min-h-screen bg-background p-8 text-foreground">
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

                <form action={handleSubmit} className="space-y-8">
                    <input type="hidden" name="userId" value={MOCK_USER_ID} />

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
                                            {typeof window !== 'undefined'
                                                ? (JSON.parse(localStorage.getItem("user_profile") || '{}').name || "U").charAt(0).toUpperCase()
                                                : "U"
                                            }
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
                                    defaultValue={typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("user_profile") || '{}').name || "Pedro Silva" : "Pedro Silva"}
                                    placeholder="Seu nome"
                                    className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground placeholder-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Cargo / Função</label>
                                <input
                                    type="text"
                                    name="userRole"
                                    defaultValue={typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("user_profile") || '{}').role || "Gerente de Compras" : "Gerente de Compras"}
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
                                    defaultValue={settings.phone_primary}
                                    placeholder="+55 11 99999-9999"
                                    className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground placeholder-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Celular Secundário (Sócio/Gerente)</label>
                                <input
                                    type="tel"
                                    name="phoneSecondary"
                                    defaultValue={settings.phone_secondary}
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

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Shield, Calendar, User, Search, ChevronLeft, ChevronRight,
    FileEdit, Trash2, Settings, Download, Eye, LogIn, LogOut,
    Save, Plus, Loader2, RefreshCw
} from "lucide-react";
import { getAuditLog, AuditLogEntry, AUDIT_ACTIONS } from "@/app/actions/audit";
import { cn } from "@/lib/utils";

// Map actions to icons and colors
const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    [AUDIT_ACTIONS.CAMPAIGN_CREATED]: { icon: <Plus size={14} />, color: "text-emerald-400 bg-emerald-400/10", label: "Campanha Criada" },
    [AUDIT_ACTIONS.CAMPAIGN_APPROVED]: { icon: <Save size={14} />, color: "text-blue-400 bg-blue-400/10", label: "Campanha Aprovada" },
    [AUDIT_ACTIONS.CAMPAIGN_SAVED]: { icon: <Save size={14} />, color: "text-indigo-400 bg-indigo-400/10", label: "Campanha Salva" },
    [AUDIT_ACTIONS.TEMPLATE_CREATED]: { icon: <FileEdit size={14} />, color: "text-purple-400 bg-purple-400/10", label: "Template Criado" },
    [AUDIT_ACTIONS.TEMPLATE_DELETED]: { icon: <Trash2 size={14} />, color: "text-red-400 bg-red-400/10", label: "Template Excluído" },
    [AUDIT_ACTIONS.SETTINGS_UPDATED]: { icon: <Settings size={14} />, color: "text-amber-400 bg-amber-400/10", label: "Configurações Atualizadas" },
    [AUDIT_ACTIONS.PROFILE_UPDATED]: { icon: <User size={14} />, color: "text-cyan-400 bg-cyan-400/10", label: "Perfil Atualizado" },
    [AUDIT_ACTIONS.DATA_EXPORTED]: { icon: <Download size={14} />, color: "text-teal-400 bg-teal-400/10", label: "Dados Exportados" },
    [AUDIT_ACTIONS.CHAT_SESSION_STARTED]: { icon: <Eye size={14} />, color: "text-sky-400 bg-sky-400/10", label: "Sessão de Chat Iniciada" },
    [AUDIT_ACTIONS.LOGIN]: { icon: <LogIn size={14} />, color: "text-green-400 bg-green-400/10", label: "Login" },
    [AUDIT_ACTIONS.LOGOUT]: { icon: <LogOut size={14} />, color: "text-gray-400 bg-gray-400/10", label: "Logout" },
};

const DEFAULT_ACTION = { icon: <Shield size={14} />, color: "text-zinc-400 bg-zinc-400/10", label: "Ação" };

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
        return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
        return date.toLocaleDateString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
}

export function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const pageSize = 20;

    const loadLogs = async (reset = false) => {
        setIsLoading(true);
        try {
            const currentPage = reset ? 1 : page;
            const { entries, hasMore: more } = await getAuditLog(pageSize, (currentPage - 1) * pageSize);

            if (reset) {
                setLogs(entries);
                setPage(1);
            } else {
                setLogs(entries);
            }
            setHasMore(more);
        } catch (error) {
            console.error("Error loading audit log:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs(true);
    }, []);

    useEffect(() => {
        if (page > 1) {
            loadLogs();
        }
    }, [page]);

    // Filter logs
    const filteredLogs = logs.filter(log => {
        const matchesSearch = searchTerm === "" ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAction = selectedAction === null || log.action === selectedAction;

        return matchesSearch && matchesAction;
    });

    // Get unique actions for filter
    const uniqueActions = [...new Set(logs.map(l => l.action))];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Log de Auditoria</h2>
                        <p className="text-sm text-muted-foreground">Histórico de ações realizadas no sistema</p>
                    </div>
                </div>
                <button
                    onClick={() => loadLogs(true)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm"
                >
                    <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
                    Atualizar
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por ação ou entidade..."
                        className="w-full h-10 rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <select
                    value={selectedAction || ""}
                    onChange={(e) => setSelectedAction(e.target.value || null)}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="">Todas as ações</option>
                    {uniqueActions.map(action => (
                        <option key={action} value={action}>
                            {ACTION_CONFIG[action]?.label || action}
                        </option>
                    ))}
                </select>
            </div>

            {/* Log List */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                {isLoading && logs.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <Shield className="mx-auto h-10 w-10 mb-3 opacity-30" />
                        <p>Nenhuma ação registrada</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filteredLogs.map((log, index) => {
                            const config = ACTION_CONFIG[log.action] || DEFAULT_ACTION;

                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="px-4 py-3 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                                            config.color
                                        )}>
                                            {config.icon}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm text-foreground">
                                                    {config.label}
                                                </span>
                                                {log.entity_type && (
                                                    <span className="text-xs text-muted-foreground">
                                                        • {log.entity_type}
                                                    </span>
                                                )}
                                            </div>

                                            {log.entity_id && (
                                                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                                    ID: {log.entity_id.substring(0, 8)}...
                                                </p>
                                            )}

                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {JSON.stringify(log.metadata).substring(0, 60)}...
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-xs text-muted-foreground shrink-0">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDate(log.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {(hasMore || page > 1) && (
                    <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                            Página {page}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!hasMore || isLoading}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

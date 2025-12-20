"use client";

import { motion } from "framer-motion";
import { TopMoverItem } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";
import { ExplainButton } from "@/components/recommendations/ExplainButton";
import { Flame, Snowflake, AlertCircle } from "lucide-react";

export function TopOpportunities({
    ruptureItems,
    excessItems
}: {
    ruptureItems: TopMoverItem[];
    excessItems: TopMoverItem[]
}) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Rupture Opportunities */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-red-500/10">
                        <Flame size={16} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Principais Rupturas</h3>
                        <p className="text-xs text-muted-foreground">Receita Perdida/Dia</p>
                    </div>
                </div>

                <div className="space-y-2">
                    {ruptureItems.length === 0 ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                            <AlertCircle size={18} className="text-green-400" />
                            <div>
                                <p className="text-sm font-medium text-green-400">Nenhuma ruptura crítica</p>
                                <p className="text-xs text-muted-foreground">Estoque saudável!</p>
                            </div>
                        </div>
                    ) : (
                        ruptureItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-colors"
                            >
                                <div className="flex-1 min-w-0 pr-3">
                                    <p className="font-medium text-foreground text-sm truncate" title={item.name}>
                                        {item.name}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{item.id}</span>
                                        {item.classeAbc && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.classeAbc === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    item.classeAbc === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {item.classeAbc}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="text-right">
                                        <p className="font-bold text-red-400 text-sm">{formatCurrency(item.value)}</p>
                                        <p className="text-[10px] text-muted-foreground">perda/dia</p>
                                    </div>
                                    <ExplainButton product={{ ...item, id_produto: item.id, produto_descricao: item.name }} />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Excess Opportunities */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <Snowflake size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Estoque Parado</h3>
                        <p className="text-xs text-muted-foreground">Capital Imobilizado</p>
                    </div>
                </div>

                <div className="space-y-2">
                    {excessItems.length === 0 ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                            <AlertCircle size={18} className="text-green-400" />
                            <div>
                                <p className="text-sm font-medium text-green-400">Nenhum excesso crítico</p>
                                <p className="text-xs text-muted-foreground">Giro saudável!</p>
                            </div>
                        </div>
                    ) : (
                        excessItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-colors"
                            >
                                <div className="flex-1 min-w-0 pr-3">
                                    <p className="font-medium text-foreground text-sm truncate" title={item.name}>
                                        {item.name}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{item.id}</span>
                                        {item.classeAbc && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.classeAbc === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    item.classeAbc === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {item.classeAbc}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="text-right">
                                        <p className="font-bold text-blue-400 text-sm">{formatCurrency(item.value)}</p>
                                        <p className="text-[10px] text-muted-foreground">parado</p>
                                    </div>
                                    <ExplainButton product={{ ...item, id_produto: item.id, produto_descricao: item.name }} />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

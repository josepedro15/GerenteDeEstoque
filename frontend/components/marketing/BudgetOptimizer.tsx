"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, DollarSign, PieChart } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface BudgetAllocation {
    channel: string;
    percentage: number;
    rationale: string;
}

export interface BudgetStrategy {
    total_suggestion: number;
    allocations: BudgetAllocation[];
}

interface BudgetOptimizerProps {
    value?: BudgetStrategy | string; // Handle legacy string
    onChange: (value: BudgetStrategy) => void;
}

export function BudgetOptimizer({ value, onChange }: BudgetOptimizerProps) {
    const [strategy, setStrategy] = useState<BudgetStrategy>({
        total_suggestion: 1000,
        allocations: []
    });

    useEffect(() => {
        if (typeof value === 'object' && value !== null) {
            setStrategy(value);
        } else if (typeof value === 'string') {
            // Try to parse rudimentary string or just init default
            setStrategy({
                total_suggestion: 1000,
                allocations: [
                    { channel: "Geral (Migrado)", percentage: 100, rationale: "Migrado de texto antigo." }
                ]
            });
        }
    }, [value]);

    const handleTotalChange = (amount: number) => {
        const newStrategy = { ...strategy, total_suggestion: amount };
        setStrategy(newStrategy);
        onChange(newStrategy);
    };

    const updateAllocation = (index: number, val: number) => {
        // Here we could implement smart rebalancing (e.g. reduce others), but for now independent sliders
        // Or simple constraint: Check if total > 100?
        const newAllocations = [...strategy.allocations];
        newAllocations[index].percentage = val;

        const newStrategy = { ...strategy, allocations: newAllocations };
        setStrategy(newStrategy);
        onChange(newStrategy);
    };

    const updateChannelName = (index: number, name: string) => {
        const newAllocations = [...strategy.allocations];
        newAllocations[index].channel = name;
        const newStrategy = { ...strategy, allocations: newAllocations };
        setStrategy(newStrategy);
        onChange(newStrategy);
    };

    const addChannel = () => {
        const newStrategy = {
            ...strategy,
            allocations: [...strategy.allocations, { channel: "Novo Canal", percentage: 0, rationale: "" }]
        };
        setStrategy(newStrategy);
        onChange(newStrategy);
    };

    const removeChannel = (index: number) => {
        const newAllocations = strategy.allocations.filter((_, i) => i !== index);
        const newStrategy = { ...strategy, allocations: newAllocations };
        setStrategy(newStrategy);
        onChange(newStrategy);
    };

    const totalPercent = strategy.allocations.reduce((acc, curr) => acc + curr.percentage, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl border">
                <div className="p-2 bg-green-100 text-green-700 rounded-full">
                    <DollarSign size={20} />
                </div>
                <div className="flex-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Verba Total (Sugestão)</label>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">R$</span>
                        <Input
                            type="number"
                            value={strategy.total_suggestion}
                            onChange={(e) => handleTotalChange(Number(e.target.value))}
                            className="text-lg font-bold w-32 border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                        />
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-muted-foreground">Distribuição</div>
                    <div className={`text-lg font-bold ${totalPercent > 100 ? 'text-red-500' : 'text-green-600'}`}>
                        {totalPercent}%
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {strategy.allocations.map((alloc, index) => (
                    <Card key={index} className="p-4 border-l-4 border-l-indigo-500">
                        <div className="flex justify-between items-start mb-2">
                            <Input
                                value={alloc.channel}
                                onChange={(e) => updateChannelName(index, e.target.value)}
                                className="font-semibold border-none p-0 h-auto w-1/2 focus-visible:ring-0"
                            />
                            <div className="text-right">
                                <span className="font-bold text-indigo-600">
                                    {((alloc.percentage / 100) * strategy.total_suggestion).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                                <span className="text-xs text-muted-foreground block">
                                    ({alloc.percentage}%)
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Slider
                                value={[alloc.percentage]}
                                max={100}
                                step={5}
                                onValueChange={(vals: number[]) => updateAllocation(index, vals[0])}
                                className="flex-1"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeChannel(index)} className="h-6 w-6 text-muted-foreground hover:text-red-500">
                                <Trash2 size={14} />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 italic">{alloc.rationale}</p>
                    </Card>
                ))}
            </div>

            <Button onClick={addChannel} variant="outline" size="sm" className="w-full border-dashed gap-2">
                <Plus size={14} /> Adicionar Canal de Investimento
            </Button>
        </div>
    );
}

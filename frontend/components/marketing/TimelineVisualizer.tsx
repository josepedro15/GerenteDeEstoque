"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export interface TimelineEvent {
    day: string;
    title: string;
    description: string;
}

interface TimelineVisualizerProps {
    events: TimelineEvent[];
    onChange: (events: TimelineEvent[]) => void;
}

export function TimelineVisualizer({ events, onChange }: TimelineVisualizerProps) {
    const safeEvents = Array.isArray(events) ? events : [];

    const addEvent = () => {
        onChange([...safeEvents, { day: `Dia ${safeEvents.length + 1}`, title: "", description: "" }]);
    };

    const updateEvent = (index: number, field: keyof TimelineEvent, value: string) => {
        const newEvents = [...safeEvents];
        newEvents[index] = { ...newEvents[index], [field]: value };
        onChange(newEvents);
    };

    const removeEvent = (index: number) => {
        const newEvents = safeEvents.filter((_, i) => i !== index);
        onChange(newEvents);
    };

    if (safeEvents.length === 0) {
        return (
            <div className="text-center p-6 border-2 border-dashed rounded-xl bg-muted/20">
                <p className="text-muted-foreground mb-4">Nenhum evento no cronograma.</p>
                <Button onClick={addEvent} variant="outline" className="gap-2">
                    <Plus size={16} /> Adicionar Evento
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative border-l-2 border-indigo-200 dark:border-indigo-800 ml-4 space-y-8 pb-4">
                {safeEvents.map((event, index) => (
                    <div key={index} className="relative pl-8 pr-2 group">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-background group-hover:scale-125 transition-transform" />

                        <Card className="p-4 bg-background/50 hover:bg-background transition-colors border-indigo-100 dark:border-indigo-900/40 relative">
                            <div className="flex gap-4 items-start">
                                <div className="w-24 shrink-0 space-y-2">
                                    <label className="text-xs font-bold text-indigo-600 uppercase">Quando</label>
                                    <Input
                                        value={event.day}
                                        onChange={(e) => updateEvent(index, 'day', e.target.value)}
                                        className="h-8 text-xs font-semibold"
                                        placeholder="Dia 1"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Ação</label>
                                    <Input
                                        value={event.title}
                                        onChange={(e) => updateEvent(index, 'title', e.target.value)}
                                        className="h-8 font-medium"
                                        placeholder="Título da Ação"
                                    />
                                    <Textarea
                                        value={event.description}
                                        onChange={(e) => updateEvent(index, 'description', e.target.value)}
                                        className="min-h-[60px] text-xs resize-none bg-muted/20"
                                        placeholder="Detalhes da execução..."
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 -mt-1 -mr-2"
                                    onClick={() => removeEvent(index)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
            <Button onClick={addEvent} variant="outline" size="sm" className="ml-12 gap-2 text-indigo-600 border-indigo-200">
                <Plus size={14} /> Adicionar Etapa
            </Button>
        </div>
    );
}

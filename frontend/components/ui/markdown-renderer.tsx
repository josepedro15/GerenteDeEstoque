import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("text-foreground", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headers - Reduzidos e mais compactos
                    h1: ({ node, ...props }) => (
                        <h1 className="text-lg font-bold mt-4 mb-2 pb-1 border-b border-border text-foreground" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="text-base font-semibold mt-3 mb-2 text-foreground flex items-center gap-2" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground/90" {...props} />
                    ),

                    // Lists
                    ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 space-y-0.5 mb-2 text-sm text-muted-foreground" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-5 space-y-0.5 mb-2 text-sm text-muted-foreground" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                        <li className="pl-0.5" {...props} />
                    ),

                    // Tables - Compact and Neutral
                    table: ({ node, ...props }) => (
                        <div className="my-3 w-full overflow-hidden rounded-md border border-border shadow-sm bg-card">
                            <table className="w-full text-xs text-left" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-[10px]" {...props} />
                    ),
                    tbody: ({ node, ...props }) => (
                        <tbody className="divide-y divide-border bg-card" {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                        <tr className="hover:bg-muted/30 transition-colors" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="px-3 py-2 font-semibold" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-3 py-2 align-top text-foreground" {...props} />
                    ),

                    // Text & Others
                    p: ({ node, ...props }) => (
                        <p className="leading-normal mb-2 text-sm" {...props} />
                    ),
                    code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !match ? (
                            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground border border-border" {...props}>
                                {children}
                            </code>
                        ) : (
                            <div className="relative my-3 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
                                <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400 font-mono">
                                    {match[1]}
                                </div>
                                <div className="p-3 overflow-x-auto">
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                </div>
                            </div>
                        )
                    },
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-3 py-1 my-2 italic text-muted-foreground text-xs" {...props} />
                    ),
                    hr: ({ node, ...props }) => (
                        <hr className="my-4 border-border" {...props} />
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

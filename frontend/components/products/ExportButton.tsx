"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { prepareExportData } from "@/app/actions/export";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
    filters?: {
        status?: string;
        abc?: string;
        search?: string;
    };
    className?: string;
}

export function ExportButton({ filters, className }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const result = await prepareExportData(filters);

            if (!result.success || !result.data) {
                alert(result.error || "Erro ao preparar exportação");
                return;
            }

            // Importar xlsx dinamicamente (client-side only)
            const XLSX = await import('xlsx');

            // Criar workbook
            const ws = XLSX.utils.json_to_sheet(result.data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Produtos");

            // Ajustar largura das colunas
            const colWidths = [
                { wch: 15 },  // Código
                { wch: 40 },  // Descrição
                { wch: 12 },  // Estoque
                { wch: 10 },  // Unidade
                { wch: 12 },  // Preço
                { wch: 12 },  // Custo
                { wch: 10 },  // Margem
                { wch: 15 },  // Cobertura
                { wch: 12 },  // Média
                { wch: 10 },  // ABC
                { wch: 15 },  // Status
                { wch: 20 },  // Fornecedor
                { wch: 20 },  // Categoria
            ];
            ws['!cols'] = colWidths;

            // Gerar arquivo
            const filename = `estoque_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);

        } catch (error) {
            console.error("Export error:", error);
            alert("Erro ao exportar dados");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-emerald-600 hover:bg-emerald-700 text-white",
                "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
        >
            {isExporting ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Exportando...</span>
                </>
            ) : (
                <>
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Exportar Excel</span>
                </>
            )}
        </button>
    );
}

// Versão dropdown com múltiplas opções
export function ExportDropdown({ filters, className }: ExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExcelExport = async () => {
        setIsExporting(true);
        setIsOpen(false);

        try {
            const result = await prepareExportData(filters);

            if (!result.success || !result.data) {
                alert(result.error || "Erro ao preparar exportação");
                return;
            }

            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(result.data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Produtos");

            const filename = `estoque_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);

        } catch (error) {
            console.error("Export error:", error);
            alert("Erro ao exportar dados");
        } finally {
            setIsExporting(false);
        }
    };

    const handleCSVExport = async () => {
        setIsExporting(true);
        setIsOpen(false);

        try {
            const result = await prepareExportData(filters);

            if (!result.success || !result.data) {
                alert(result.error || "Erro ao preparar exportação");
                return;
            }

            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(result.data);
            const csv = XLSX.utils.sheet_to_csv(ws);

            // Download CSV
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `estoque_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

        } catch (error) {
            console.error("Export error:", error);
            alert("Erro ao exportar dados");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={cn("relative", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg",
                    "bg-emerald-600 hover:bg-emerald-700 text-white",
                    "transition-colors disabled:opacity-50"
                )}
            >
                {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Download className="h-4 w-4" />
                )}
                <span>Exportar</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-border z-50">
                    <button
                        onClick={handleExcelExport}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-accent text-left rounded-t-lg"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                        <span>Excel (.xlsx)</span>
                    </button>
                    <button
                        onClick={handleCSVExport}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-accent text-left rounded-b-lg"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                        <span>CSV</span>
                    </button>
                </div>
            )}
        </div>
    );
}

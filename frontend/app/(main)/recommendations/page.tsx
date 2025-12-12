import { getStockData } from "@/app/actions/inventory";
import { generateSuggestions } from "@/lib/analytics";
import { RecommendationEngine } from "@/components/recommendations/RecommendationEngine";
import { PackageSearch } from "lucide-react";

export default async function RecommendationsPage() {
    const { detalhe } = await getStockData();
    const suggestions = generateSuggestions(detalhe, 45); // 45 days target

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white/90 flex items-center gap-3">
                    <PackageSearch className="h-8 w-8 text-blue-500" />
                    Sugestões de Compra (Híbrido)
                </h1>
                <p className="text-muted-foreground">
                    O sistema calculou as necessidades com base em 45 dias de cobertura.
                    Selecione os itens e peça para a IA refinar a estratégia de compra.
                </p>
            </div>

            <RecommendationEngine suggestions={suggestions} />
        </div>
    );
}

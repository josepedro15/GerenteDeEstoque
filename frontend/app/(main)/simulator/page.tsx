import { getStockAnalysis } from "@/app/actions/inventory";
import { SimulatorClient } from "@/components/simulator/SimulatorClient";

export default async function SimulatorPage() {
    const data = await getStockAnalysis();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Simulador de Estratégia</h1>
                    <p className="text-muted-foreground mt-1">Simule cenários de demanda e lead time para otimizar seu estoque.</p>
                </div>
            </div>

            <SimulatorClient initialData={data} />
        </div>
    );
}

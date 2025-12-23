import { getStockData } from "@/app/actions/inventory";
import { ProductsClient, Product } from "@/components/products/ProductsClient";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    const { detalhe } = await getStockData();

    // Helper para parse seguro de números
    const parseNum = (val: string | number | undefined | null): number => {
        if (val === null || val === undefined) return 0;
        const str = String(val).replace(',', '.');
        return parseFloat(str) || 0;
    };

    // Transformação completa dos dados
    const products: Product[] = detalhe
        .filter(item => item.id_produto)
        .map(item => {
            // Normalizar status
            let rawStatus = String(item.status_ruptura || 'SAUDÁVEL').toUpperCase().trim();
            const normalizedStatus = rawStatus
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^A-Z\s]/g, '')
                .trim();

            let status = 'SAUDÁVEL';
            if (normalizedStatus.includes('RUPTURA')) status = 'RUPTURA';
            else if (normalizedStatus.includes('CRITICO')) status = 'CRÍTICO';
            else if (normalizedStatus.includes('ATENCAO')) status = 'ATENÇÃO';
            else if (normalizedStatus.includes('SAUDAVEL')) status = 'SAUDÁVEL';
            else if (normalizedStatus.includes('EXCESSO')) status = 'EXCESSO';

            return {
                // Identificação
                id: String(item.id_produto),
                nome: String(item.produto_descricao || 'Sem Nome'),

                // Estoque
                estoque: parseNum(item.estoque_atual),
                cobertura: parseNum(item.dias_de_cobertura),
                mediaVenda: parseNum(item.media_diaria_venda),

                // Financeiro
                preco: parseNum(item.preco),
                custo: parseNum(item.custo),
                margemUnitaria: parseNum(item.margem_unitaria),
                margemPercentual: parseNum(item.margem_percentual),

                // Vendas 60 dias
                qtdVendida60d: parseNum(item.qtd_vendida_60d),
                faturamento60d: parseNum(item.faturamento_60d),
                lucro60d: parseNum(item.lucro_60d),

                // Classificação
                abc: String(item.classe_abc || 'C').toUpperCase().trim(),
                status: status,

                // Giro e Valor
                giroMensal: parseNum(item.giro_mensal),
                valorEstoqueCusto: parseNum(item.valor_estoque_custo),
                valorEstoqueVenda: parseNum(item.valor_estoque_venda),

                // Sugestão
                sugestaoCompra: parseNum(item.sugestao_compra_60d),

                // Tendência
                tendencia: String(item.tendencia || ''),
                variacaoPercentual: parseNum(item.variacao_percentual),

                // Última venda
                ultimaVenda: item.ultima_venda || null,
                diasSemVenda: parseNum(item.dias_sem_venda),

                // Alertas
                prioridadeCompra: String(item.prioridade_compra || ''),
                alertaEstoque: String(item.alerta_estoque || ''),
            };
        });

    return (
        <div className="h-full">
            <ProductsClient initialProducts={products} />
        </div>
    );
}

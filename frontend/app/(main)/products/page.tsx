import { getStockData } from "@/app/actions/inventory";
import { ProductsClient, Product } from "@/components/products/ProductsClient";
import { parseNumber, normalizeStatus } from "@/lib/formatters";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    const { produtos } = await getStockData();

    // Transformação completa dos dados
    const products: Product[] = produtos
        .filter(item => item.id_produto)
        .map(item => {
            const status = normalizeStatus(item.status_ruptura);

            return {
                // Identificação
                id: String(item.id_produto),
                nome: String(item.produto_descricao || 'Sem Nome'),

                // Estoque
                estoque: parseNumber(item.estoque_atual),
                estoqueTransito: parseNumber(item.estoque_transito),
                estoqueProjetado: parseNumber(item.estoque_projetado),
                cobertura: parseNumber(item.dias_de_cobertura),
                coberturaProjetada: parseNumber(item.dias_cobertura_projetado),
                mediaVenda: parseNumber(item.media_diaria_venda),

                // Fornecedor
                fornecedorPrincipal: String(item.fornecedor_principal || '-'),

                // Financeiro
                preco: parseNumber(item.preco),
                custo: parseNumber(item.custo),
                margemUnitaria: parseNumber(item.margem_unitaria),
                margemPercentual: parseNumber(item.margem_percentual),

                // Vendas 60 dias
                qtdVendida60d: parseNumber(item.qtd_vendida_60d),
                faturamento60d: parseNumber(item.faturamento_60d),
                lucro60d: parseNumber(item.lucro_60d),

                // Classificação
                abc: String(item.classe_abc || 'C').toUpperCase().trim(),
                status: status,
                giroMensal: parseNumber(item.giro_mensal),

                // Valores de Estoque
                valorEstoqueCusto: parseNumber(item.valor_estoque_custo),
                valorEstoqueVenda: parseNumber(item.valor_estoque_venda),
                valorTransito: parseNumber(item.valor_transito_custo),

                // Sugestão de Compra
                sugestaoCompra: parseNumber(item.sugestao_compra_60d),
                sugestaoAjustada: parseNumber(item.sugestao_compra_ajustada),

                // Tendência
                tendencia: String(item.tendencia || ''),
                variacaoPercentual: parseNumber(item.variacao_percentual),

                // Última venda
                ultimaVenda: item.ultima_venda || null,
                diasSemVenda: parseNumber(item.dias_sem_venda),

                // Alertas
                prioridadeCompra: String(item.prioridade_compra || ''),
                alertaEstoque: String(item.alerta_estoque || ''),

                // Pedidos
                pedidosAbertos: parseNumber(item.pedidos_abertos),
            };
        });

    return (
        <div className="h-full">
            <ProductsClient initialProducts={products} />
        </div>
    );
}

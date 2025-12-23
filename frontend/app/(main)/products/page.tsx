import { getStockData } from "@/app/actions/inventory";
import { ProductsClient, Product } from "@/components/products/ProductsClient"; // Ajuste o path conforme sua estrutura

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    const { detalhe } = await getStockData();

    // Transformação e Normalização (Server-Side)
    // Isso garante que o cliente receba dados limpos e prontos
    const products: Product[] = detalhe
        .filter(item => item.id_produto) // Filtra itens sem ID
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

            // Parse seguro de números
            const parseNum = (val: string | number | undefined) => {
                const str = String(val || '0').replace(',', '.');
                return parseFloat(str) || 0;
            };

            return {
                id: String(item.id_produto),
                nome: String(item.produto_descricao || 'Sem Nome'),
                estoque: parseNum(item.estoque_atual),
                preco: parseNum(item.preco),
                custo: parseNum(item.custo),
                abc: String(item.classe_abc || 'C').toUpperCase().trim(),
                status: status,
                cobertura: parseNum(item.dias_de_cobertura),
            };
        });

    return (
        <div className="h-full">
            <ProductsClient initialProducts={products} />
        </div>
    );
}

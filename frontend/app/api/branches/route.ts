import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Verificar usuário autenticado
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ branches: [] }, { status: 401 });
        }

        // Buscar filiais que o usuário tem acesso
        // Por enquanto, busca todas as lojas (raw_lojas)
        // Futuramente: filtrar por user_branch_access
        const { data: branches, error } = await supabase
            .from("raw_lojas")
            .select("id_loja, nome_loja, cidade")
            .order("nome_loja", { ascending: true });

        if (error) {
            console.error("Erro ao buscar filiais:", error);
            // Retornar dados mock se tabela não existir
            return NextResponse.json({
                branches: [
                    { id: "1", name: "Loja Centro", city: "São Paulo" },
                    { id: "2", name: "Loja Shopping", city: "São Paulo" },
                    { id: "3", name: "Loja Norte", city: "Guarulhos" },
                ]
            });
        }

        // Mapear para formato esperado
        const formattedBranches = (branches || []).map((b: any) => ({
            id: b.id_loja,
            name: b.nome_loja,
            city: b.cidade
        }));

        return NextResponse.json({ branches: formattedBranches });
    } catch (error) {
        console.error("Erro na API de filiais:", error);
        return NextResponse.json({ branches: [] }, { status: 500 });
    }
}

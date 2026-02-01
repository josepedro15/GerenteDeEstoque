import { getPublicCampaign } from "@/app/actions/marketing";
import { CampaignViewer } from "@/components/marketing/CampaignViewer";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const campaign = await getPublicCampaign(id);

    return {
        title: campaign?.campaign_data?.report.title || "Campanha de Marketing",
        description: campaign?.campaign_data?.report.hook || "Detalhes da campanha gerada.",
    };
}

export default async function PublicCampaignPage({ params }: Props) {
    const { id } = await params;
    const campaign = await getPublicCampaign(id);

    if (!campaign || !campaign.campaign_data) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Simple Header */}
            <header className="border-b bg-muted/40 p-4 mb-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-primary">
                        <span>Gerente Estoque AI</span>
                        <span className="text-xs px-2 py-1 bg-primary/10 rounded-full text-primary font-normal">Public View</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Campanha #{campaign.id.slice(0, 8)}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pb-12">
                <CampaignViewer strategy={campaign.campaign_data} />
            </main>
        </div>
    );
}

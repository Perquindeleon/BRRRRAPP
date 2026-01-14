import { getPortfolioData } from "./actions";
import PortfolioView from "./portfolio-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function PropertiesPage() {
    const portfolioData = await getPortfolioData();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Portfolio & Assets</h2>
                    <p className="text-muted-foreground">Manage your properties, tenants, and lease agreements.</p>
                </div>
            </div>

            <PortfolioView initialData={portfolioData} />
        </div>
    );
}

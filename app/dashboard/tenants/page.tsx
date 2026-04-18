import { getPortfolioData } from "../properties/actions";
import TenantsView from "./tenants-view";

export default async function TenantsPage() {
    const portfolioData = await getPortfolioData();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Tenants</h2>
                    <p className="text-muted-foreground">Manage your tenants, leases, and communications.</p>
                </div>
            </div>

            <TenantsView initialData={portfolioData} />
        </div>
    );
}

import { getMaintenanceRequests } from "./actions";
import { getPortfolioData } from "../properties/actions";
import { getContractors } from "../projects/actions";
import MaintenanceView from "./maintenance-view";

export default async function MaintenancePage() {
    const [requests, portfolioData, contractors] = await Promise.all([
        getMaintenanceRequests(),
        getPortfolioData(),
        getContractors(),
    ]);

    // Shape properties with their tenants for the create form
    const properties = portfolioData.map((p: any) => ({
        id: p.id,
        address: p.address,
        city: p.city,
        tenants: p.tenants || [],
    }));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold">Maintenance</h2>
                <p className="text-muted-foreground">Track repair requests, assign contractors, and log expenses.</p>
            </div>
            <MaintenanceView
                initialRequests={requests as any}
                properties={properties}
                contractors={contractors as any}
            />
        </div>
    );
}

import { getPortfolioData } from "../properties/actions";
import { createClient } from "@/lib/supabase/server";
import TenantsView from "./tenants-view";

export default async function TenantsPage() {
    const supabase = createClient();
    const portfolioData = await getPortfolioData();

    // Collect all tenant IDs so we can check who paid this month
    const allTenantIds: string[] = portfolioData.flatMap((p: any) =>
        (p.tenants || []).map((t: any) => t.id as string)
    );

    let currentMonthPayments: any[] = [];
    if (allTenantIds.length > 0) {
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const { data } = await supabase
            .from("payments")
            .select("tenant_id, amount, payment_date, status")
            .in("tenant_id", allTenantIds)
            .gte("payment_date", monthStart)
            .eq("status", "paid");

        currentMonthPayments = data || [];
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Tenants</h2>
                    <p className="text-muted-foreground">Manage your tenants, leases, and communications.</p>
                </div>
            </div>
            <TenantsView initialData={portfolioData} currentMonthPayments={currentMonthPayments} />
        </div>
    );
}

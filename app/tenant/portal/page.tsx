import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TenantPortalView from "./tenant-portal-view";

export default async function TenantPortalPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/tenant/login");

    // Look up tenant by their email
    const { data: tenant } = await supabase
        .from("tenants")
        .select("*, properties(id, address, city, state, zip, property_type)")
        .eq("email", user.email!)
        .eq("status", "active")
        .single();

    // Fetch maintenance requests + payments in parallel
    let requests: any[] = [];
    let payments: any[] = [];

    if (tenant?.id) {
        const [reqRes, payRes] = await Promise.all([
            supabase
                .from("maintenance_requests")
                .select("*")
                .eq("property_id", tenant.property_id)
                .eq("tenant_id", tenant.id)
                .order("created_at", { ascending: false }),
            supabase
                .from("payments")
                .select("*")
                .eq("tenant_id", tenant.id)
                .order("payment_date", { ascending: false }),
        ]);
        requests = reqRes.data || [];
        payments = payRes.data || [];
    }

    return (
        <TenantPortalView
            tenant={tenant}
            requests={requests}
            payments={payments}
            userEmail={user.email!}
        />
    );
}

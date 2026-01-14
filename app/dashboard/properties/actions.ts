"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addProperty(prevState: any, formData: FormData) {
    const supabase = createClient();

    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zip = formData.get("zip") as string;
    const status = formData.get("status") as string;
    const purchasePrice = parseFloat(formData.get("purchase_price") as string) || 0;

    // Financials
    const rehabCost = parseFloat(formData.get("rehab_cost") as string) || 0;
    const monthlyRent = parseFloat(formData.get("monthly_rent") as string) || 0;
    const taxesAnnual = parseFloat(formData.get("taxes_annual") as string) || 0;
    const insuranceAnnual = parseFloat(formData.get("insurance_annual") as string) || 0;
    const vacancyRate = parseFloat(formData.get("vacancy_rate") as string) || 5;
    const capexRate = parseFloat(formData.get("capex_rate") as string) || 5;
    const managementRate = parseFloat(formData.get("management_rate") as string) || 8;
    const arv = parseFloat(formData.get("arv_estimate") as string) || 0;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    // 1. Insert Property
    const { data: property, error: propError } = await supabase.from("properties").insert({
        user_id: user.id,
        address,
        city,
        state,
        zip,
        status,
        purchase_price: purchasePrice,
        arv_estimate: arv
    }).select().single();

    if (propError) {
        console.error("Error adding property:", propError);
        return { error: propError.message };
    }

    // 2. Insert Financials
    const { error: finError } = await supabase.from("financials").insert({
        property_id: property.id,
        rehab_cost: rehabCost,
        monthly_rent: monthlyRent,
        taxes_annual: taxesAnnual,
        insurance_annual: insuranceAnnual,
        vacancy_rate: vacancyRate,
        capex_rate: capexRate,
        management_rate: managementRate,
        // Default Loan assumptions if not provided (could expand form later)
        refinance_ltv: 75,
        refinance_rate: 7.0
    });

    if (finError) {
        console.error("Error adding financials:", finError);
        // non-blocking, but good to know
    }

    revalidatePath("/dashboard/properties");
    revalidatePath("/dashboard/projects");
    return redirect(`/dashboard/projects/${property.id}`);
}

export async function addToPortfolio(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("properties")
        .update({ status: 'owned' }) // Default to 'owned' when moving from analysis
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/saved-deals");
    revalidatePath("/dashboard/properties");
}

export async function getPortfolioData() {
    const supabase = createClient();

    // Fetch properties with tenants joined
    // Note: This relies on the tenants table existing. If not, it might fail or return null for tenants.
    const { data: properties, error } = await supabase
        .from("properties")
        .select("*, tenants(*), financials(*)")
        .in('status', ['owned', 'rehab', 'active', 'sold'])
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching portfolio:", error);
        return [];
    }

    return properties || [];
}

export async function deleteProperty(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Delete property (cascade should handle related items, or we might need manual cleanup if not set)
    // Assuming Cascade Delete is ON for foreign keys to projects, tenants, financials.
    const { error } = await supabase.from("properties").delete().eq("id", id).eq("user_id", user.id);

    if (error) {
        console.error("Error deleting property:", error);
        return { error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/properties");
    revalidatePath("/dashboard/projects");
}

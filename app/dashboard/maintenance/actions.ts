"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getMaintenanceRequests() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*, properties(address, city), tenants(name, phone, email), contractors(name, phone, email, specialty)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching maintenance requests:", error);
        return [];
    }
    return data || [];
}

export async function createMaintenanceRequest(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const data: Record<string, any> = {
        user_id: user.id,
        property_id: formData.get("property_id") as string,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string || "general",
        priority: formData.get("priority") as string || "normal",
        status: "open",
    };

    const tenantId = formData.get("tenant_id") as string;
    const estimatedCost = parseFloat(formData.get("estimated_cost") as string);
    if (tenantId) data.tenant_id = tenantId;
    if (!isNaN(estimatedCost) && estimatedCost > 0) data.estimated_cost = estimatedCost;

    const { error } = await supabase.from("maintenance_requests").insert(data);
    if (error) {
        console.error("Error creating maintenance request:", error);
        return { error: error.message };
    }

    revalidatePath("/dashboard/maintenance");
    return { success: true };
}

export async function assignContractor(requestId: string, contractorId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("maintenance_requests")
        .update({
            contractor_id: contractorId,
            status: "assigned",
            assigned_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/maintenance");
    return { success: true };
}

export async function markCompleted(requestId: string, actualCost: number, notes: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("maintenance_requests")
        .update({
            status: "completed",
            actual_cost: actualCost,
            notes: notes,
            completed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/maintenance");
    return { success: true };
}

export async function closeRequest(requestId: string, actualCost: number, notes: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("maintenance_requests")
        .update({
            status: "closed",
            actual_cost: actualCost,
            notes: notes,
            closed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/maintenance");
    return { success: true };
}

export async function updateRequestStatus(requestId: string, status: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("maintenance_requests")
        .update({ status })
        .eq("id", requestId)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/maintenance");
    return { success: true };
}

export async function updateMaintenanceRequest(requestId: string, params: {
    title: string;
    description?: string;
    category: string;
    priority: string;
    estimatedCost?: number;
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const record: any = {
        title:       params.title,
        description: params.description || null,
        category:    params.category,
        priority:    params.priority,
    };
    if (params.estimatedCost !== undefined && !isNaN(params.estimatedCost)) {
        record.estimated_cost = params.estimatedCost;
    }

    const { error } = await supabase
        .from("maintenance_requests")
        .update(record)
        .eq("id", requestId)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/maintenance");
    return { success: true };
}

export async function deleteMaintenanceRequest(requestId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("maintenance_requests")
        .delete()
        .eq("id", requestId)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/maintenance");
    return { success: true };
}

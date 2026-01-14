"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getProjects() {
    const supabase = createClient();
    const { data: properties, error } = await supabase
        .from("properties")
        .select("*, rehab_items(*)")
        .in("status", ["owned", "rehab", "active"])
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching projects:", error);
        return [];
    }

    // Calculate totals per property
    return properties.map((p) => {
        const totalEstimated = p.rehab_items.reduce((sum: number, item: any) => sum + (item.estimated_cost || 0), 0);
        const totalActual = p.rehab_items.reduce((sum: number, item: any) => sum + (item.actual_cost || 0), 0);
        return {
            ...p,
            total_estimated_rehab: totalEstimated,
            total_actual_rehab: totalActual,
            item_count: p.rehab_items.length
        };
    });
}

export async function getProperty(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data;
}

export async function getRehabItems(propertyId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("rehab_items")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true });

    if (error) return [];
    return data;
}

export async function addRehabItem(formData: FormData) {
    const supabase = createClient();
    const propertyId = formData.get("property_id") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const estimatedCost = parseFloat(formData.get("estimated_cost") as string);
    const unitNumber = formData.get("unit_number") as string || null;

    const { error } = await supabase.from("rehab_items").insert({
        property_id: propertyId,
        category,
        description,
        estimated_cost: estimatedCost,
        status: "planned",
        unit_number: unitNumber
    });

    if (error) {
        console.error("Error adding item:", error);
        return { error: "Failed to add item" };
    }

    revalidatePath(`/dashboard/projects/${propertyId}`);
}

export async function updateRehabItem(itemId: string, data: any) {
    const supabase = createClient();
    const { error } = await supabase.from("rehab_items").update(data).eq("id", itemId);
    if (error) console.error("Update item error", error);
}

export async function deleteRehabItem(itemId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("rehab_items").delete().eq("id", itemId);
    if (error) {
        console.error("Error deleting item:", error);
        return { error: "Failed to delete" };
    }
    return { success: true };
}

export async function getTenants(propertyId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

    if (error) return [];
    return data;
}

export async function addTenant(formData: FormData) {
    const supabase = createClient();
    const propertyId = formData.get("property_id") as string;
    const name = formData.get("name") as string;

    if (!propertyId || !name) {
        return { error: "Property and Name are required" };
    }

    // Handle File Upload
    const contractFile = formData.get("contract") as File;
    let contractUrl = null;

    if (contractFile && contractFile.size > 0) {
        const filename = `${Date.now()}-${contractFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("contracts")
            .upload(filename, contractFile);

        if (uploadError) {
            console.error("Upload error:", uploadError);
        } else {
            const { data: { publicUrl } } = supabase.storage.from("contracts").getPublicUrl(filename);
            contractUrl = publicUrl;
        }
    }

    const data = {
        property_id: propertyId,
        name: name,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        rent_amount: parseFloat(formData.get("rent_amount") as string) || 0,
        lease_start: formData.get("lease_start") as string || null,
        lease_end: formData.get("lease_end") as string || null,
        status: 'active',
        unit_number: formData.get("unit_number") as string || null
    };

    // VALIDATION: Check for overlapping leases
    if (data.lease_start && data.lease_end) {
        const startDate = new Date(data.lease_start);
        const endDate = new Date(data.lease_end);

        if (endDate <= startDate) {
            return { error: "End date must be after start date" };
        }

        const { data: existingTenants } = await supabase
            .from("tenants")
            .select("lease_start, lease_end")
            .eq("property_id", propertyId)
            .neq("status", "past");

        if (existingTenants && existingTenants.length > 0) {
            const hasOverlap = existingTenants.some(t => {
                if (!t.lease_start || !t.lease_end) return false;
                const existingStart = new Date(t.lease_start);
                const existingEnd = new Date(t.lease_end);
                return startDate < existingEnd && endDate > existingStart;
            });

            if (hasOverlap) {
                return { error: "Property is occupied during these dates. Check existing leases." };
            }
        }
    }

    const { error } = await supabase.from("tenants").insert(data);

    if (error) {
        console.error("Error adding tenant:", error);
        return { error: error.message || "Failed to add tenant" };
    }

    revalidatePath(`/dashboard/projects/${propertyId}`);
    revalidatePath(`/dashboard/properties`);
    return { success: true };
}

export async function updateTenant(formData: FormData) {
    const supabase = createClient();
    const tenantId = formData.get("id") as string;
    const propertyId = formData.get("property_id") as string;

    const contractFile = formData.get("contract") as File;
    let contractUrl = undefined;

    if (contractFile && contractFile.size > 0) {
        const filename = `${Date.now()}-${contractFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const { error: uploadError } = await supabase.storage
            .from("contracts")
            .upload(filename, contractFile);

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from("contracts").getPublicUrl(filename);
            contractUrl = publicUrl;
        }
    }

    const data: any = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        rent_amount: parseFloat(formData.get("rent_amount") as string) || 0,
        lease_start: formData.get("lease_start") as string || null,
        lease_end: formData.get("lease_end") as string || null,
        status: formData.get("status") as string || 'active',
        unit_number: formData.get("unit_number") as string || null
    };

    if (contractUrl) data.contract_url = contractUrl;

    const { error } = await supabase.from("tenants").update(data).eq("id", tenantId);

    if (error) {
        console.error("Error updating tenant:", error);
        return { error: "Failed to update tenant" };
    }

    revalidatePath(`/dashboard/projects/${propertyId}`);
    revalidatePath(`/dashboard/properties`);
    return { success: true };
}

export async function deleteTenant(tenantId: string, propertyId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("tenants").delete().eq("id", tenantId);

    if (error) {
        console.error("Error deleting tenant:", error);
        return { error: "Failed to delete tenant" };
    }

    revalidatePath(`/dashboard/projects/${propertyId}`);
    revalidatePath(`/dashboard/properties`);
    return { success: true };
}

export async function getPayments(tenantId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("payment_date", { ascending: false });

    if (error) return [];
    return data;
}

export async function addPayment(formData: FormData) {
    const supabase = createClient();
    const tenantId = formData.get("tenant_id") as string;
    const propertyId = formData.get("property_id") as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const data = {
        user_id: user.id,
        tenant_id: tenantId,
        property_id: propertyId,
        amount: parseFloat(formData.get("amount") as string) || 0,
        payment_date: formData.get("payment_date") as string || new Date().toISOString().split('T')[0],
        status: formData.get("status") as string || 'paid',
        method: formData.get("method") as string || 'transfer',
        notes: formData.get("notes") as string || ''
    };

    const { error } = await supabase.from("payments").insert(data);

    if (error) {
        console.error("Error adding payment:", error);
        return { error: "Failed to add payment" };
    }

    revalidatePath(`/dashboard/properties`);
    return { success: true };
}

export async function deletePayment(paymentId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("payments").delete().eq("id", paymentId);

    if (error) {
        console.error("Error deleting payment:", error);
        return { error: "Failed to delete payment" };
    }

    revalidatePath(`/dashboard/properties`);
    return { success: true };
}

export async function getMilestones(propertyId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("property_id", propertyId)
        .order("start_date", { ascending: true });

    if (error) return [];
    return data;
}

export async function addMilestone(formData: FormData) {
    const supabase = createClient();
    const propertyId = formData.get("property_id") as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const data = {
        user_id: user.id,
        property_id: propertyId,
        title: formData.get("title") as string,
        start_date: formData.get("start_date") as string || null,
        end_date: formData.get("end_date") as string || null,
        status: formData.get("status") as string || 'pending',
        notes: formData.get("notes") as string || ''
    };

    const { error } = await supabase.from("project_milestones").insert(data);

    if (error) {
        console.error("Error adding milestone:", error);
        return { error: "Failed to add milestone" };
    }

    revalidatePath(`/dashboard/projects/${propertyId}`);
    return { success: true };
}

export async function deleteMilestone(id: string, propertyId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("project_milestones").delete().eq("id", id);
    if (error) console.error("Error deleting milestone", error);
    revalidatePath(`/dashboard/projects/${propertyId}`);
}

export async function updateProjectDriveUrl(propertyId: string, url: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from("properties")
        .update({ drive_folder_url: url })
        .eq("id", propertyId);

    if (error) {
        console.error("Error updating drive url:", error);
        return { error: "Failed to update URL" };
    }
    revalidatePath(`/dashboard/projects/${propertyId}`);
    return { success: true };
}

export async function getContractors() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .order("name", { ascending: true });

    if (error) return [];
    return data;
}

export async function addContractor(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const data = {
        user_id: user.id,
        name: formData.get("name") as string,
        specialty: formData.get("specialty") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        website: formData.get("website") as string,
        notes: formData.get("notes") as string,
        rating: parseInt(formData.get("rating") as string) || 0
    };

    const { error } = await supabase.from("contractors").insert(data);

    if (error) {
        console.error("Error adding contractor:", error);
        return { error: "Failed to add contractor" };
    }

    revalidatePath(`/dashboard/projects/contractors`);
    return { success: true };
}

export async function deleteContractor(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("contractors").delete().eq("id", id);
    if (error) {
        console.error("Error deleting contractor", error);
        return { error: "Failed to delete" };
    }
    revalidatePath(`/dashboard/projects/contractors`);
    return { success: true };
}

export async function updateContractor(formData: FormData) {
    const supabase = createClient();
    const id = formData.get("id") as string;

    const data = {
        name: formData.get("name") as string,
        specialty: formData.get("specialty") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        website: formData.get("website") as string,
        notes: formData.get("notes") as string,
        rating: parseInt(formData.get("rating") as string) || 0
    };

    const { error } = await supabase.from("contractors").update(data).eq("id", id);

    if (error) {
        console.error("Error updating contractor:", error);
        return { error: "Failed to update" };
    }

    revalidatePath(`/dashboard/projects/contractors`);
    return { success: true };
}

export async function getDocuments(propertyId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

    if (error) return [];
    return data;
}

export async function uploadDocument(formData: FormData) {
    const supabase = createClient();
    const propertyId = formData.get("property_id") as string;
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || file.size === 0) return { error: "No file provided" };

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}.${fileExt}`;
    const filePath = `${propertyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

    if (uploadError) {
        console.error("Upload error:", uploadError);
        return { error: `Upload failed: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(filePath);

    const { error: dbError } = await supabase.from("documents").insert({
        property_id: propertyId,
        name: file.name,
        type: type,
        url: publicUrl
    });

    if (dbError) return { error: "Failed to save document record" };

    revalidatePath(`/dashboard/projects/${propertyId}`);
    return { success: true };
}

export async function deleteDocument(documentId: string, propertyId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("documents").delete().eq("id", documentId);

    if (error) {
        console.error("Error deleting document:", error);
        return { error: "Failed to delete document" };
    }

    revalidatePath(`/dashboard/projects/${propertyId}`);
    return { success: true };
}

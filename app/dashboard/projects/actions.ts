"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
        const { error: uploadError } = await supabase.storage
            .from("contracts")
            .upload(filename, contractFile);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return { error: `Contract upload failed: ${uploadError.message}. Make sure the 'contracts' storage bucket exists and is public in Supabase.` };
        }

        const { data: { publicUrl } } = supabase.storage.from("contracts").getPublicUrl(filename);
        contractUrl = publicUrl;
    }

    const isColiving = formData.get("is_coliving") === "true";

    // Build insert object — only include optional columns that have values,
    // so missing DB columns don't cause schema cache errors.
    const data: Record<string, any> = {
        property_id: propertyId,
        name: name,
        rent_amount: parseFloat(formData.get("rent_amount") as string) || 0,
        status: 'active',
    };

    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const unitNumber = formData.get("unit_number") as string;
    const leaseStart = formData.get("lease_start") as string;
    const leaseEnd = formData.get("lease_end") as string;

    if (email) data.email = email;
    if (phone) data.phone = phone;
    if (unitNumber) data.unit_number = unitNumber;
    if (leaseStart) data.lease_start = leaseStart;
    if (leaseEnd) data.lease_end = leaseEnd;
    if (contractUrl) data.contract_url = contractUrl;

    // VALIDATION: Check for overlapping leases (skip for co-living tenants)
    if (!isColiving && leaseStart && leaseEnd) {
        const startDate = new Date(leaseStart);
        const endDate = new Date(leaseEnd);

        if (endDate <= startDate) {
            return { error: "End date must be after start date" };
        }

        // For multifamily (unit_number provided) only check that specific unit
        let overlapQuery = supabase
            .from("tenants")
            .select("lease_start, lease_end")
            .eq("property_id", propertyId)
            .neq("status", "past");

        if (unitNumber) {
            overlapQuery = overlapQuery.eq("unit_number", unitNumber);
        }

        const { data: existingTenants } = await overlapQuery;

        if (existingTenants && existingTenants.length > 0) {
            const hasOverlap = existingTenants.some(t => {
                if (!t.lease_start || !t.lease_end) return false;
                const existingStart = new Date(t.lease_start);
                const existingEnd = new Date(t.lease_end);
                return startDate < existingEnd && endDate > existingStart;
            });

            if (hasOverlap) {
                return {
                    error: unitNumber
                        ? `${unitNumber} is already occupied during these dates.`
                        : "Property is occupied during these dates. Check existing leases."
                };
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
    revalidatePath(`/dashboard/tenants`);
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

        if (uploadError) {
            return { error: `Contract upload failed: ${uploadError.message}` };
        }

        const { data: { publicUrl } } = supabase.storage.from("contracts").getPublicUrl(filename);
        contractUrl = publicUrl;
    }

    const data: any = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        rent_amount: parseFloat(formData.get("rent_amount") as string) || 0,
        lease_start: formData.get("lease_start") as string || null,
        lease_end: formData.get("lease_end") as string || null,
        status: formData.get("status") as string || 'active',
        unit_number: formData.get("unit_number") as string || null,
        late_fee_day: parseInt(formData.get("late_fee_day") as string) || 5,
        late_fee_pct: parseFloat(formData.get("late_fee_pct") as string) ?? 10,
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

export async function addPayment(params: {
    tenantId: string;
    propertyId: string;
    amount: number;
    paymentDate: string;
    status: string;
    method: string;
    notes: string;
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { tenantId, propertyId, amount, paymentDate, status, method, notes } = params;

    // Try full insert first; if columns are missing (code 42703) fall back to minimal
    let insertError: any = null;
    const fullRecord: any = {
        user_id:      user.id,
        tenant_id:    tenantId,
        amount,
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        status:       status || 'paid',
    };
    // Add optional columns – these may not exist in older schemas
    if (propertyId) fullRecord.property_id = propertyId;
    fullRecord.method = method || 'transfer';
    fullRecord.notes  = notes  || '';

    const res1 = await supabase.from("payments").insert(fullRecord);
    insertError = res1.error;

    // Retry without optional columns if any column is missing
    if (insertError?.code === '42703') {
        const minimal: any = {
            user_id:      user.id,
            tenant_id:    tenantId,
            amount,
            payment_date: fullRecord.payment_date,
            status:       fullRecord.status,
        };
        const res2 = await supabase.from("payments").insert(minimal);
        insertError = res2.error;
    }

    if (insertError) {
        console.error("Error adding payment:", insertError);
        return { error: insertError.message || "Failed to add payment" };
    }

    // ── Grace period check ──────────────────────────────────────────────
    // If the payment is marked 'paid' and the payment DATE falls within the
    // grace period (day <= late_fee_day), remove any pending late-fee charge
    // for that month and reset the tenant to 'active'.
    if (status === 'paid') {
        const { data: tenant } = await supabase
            .from("tenants")
            .select("late_fee_day, status")
            .eq("id", tenantId)
            .single();

        const dueDay     = tenant?.late_fee_day ?? 5;
        const paidDay    = paymentDate ? parseInt(paymentDate.split('-')[2]) : new Date().getDate();
        const withinGrace = paidDay <= dueDay;

        if (withinGrace) {
            // Delete any pending late-fee charges for the same month
            const [y, m] = (paymentDate || new Date().toISOString().split('T')[0]).split('-');
            const monthStart = `${y}-${m}-01`;
            await supabase
                .from("payments")
                .delete()
                .eq("tenant_id", tenantId)
                .eq("status", "pending")
                .gte("payment_date", monthStart)
                .ilike("notes", "Late fee%");
        }

        // Always reset tenant to active when rent is paid
        if (tenant?.status === 'late' || withinGrace) {
            await supabase.from("tenants").update({ status: 'active' }).eq("id", tenantId);
        }
    }

    revalidatePath("/dashboard/tenants");
    revalidatePath(`/dashboard/properties`);
    revalidatePath(`/dashboard/projects/${propertyId}`);
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

/** Apply a late fee charge to a tenant and mark them as 'late' */
export async function applyLateFee(tenantId: string, propertyId: string, lateFeeAmount: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const today = new Date();
    const monthLabel  = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const todayStr    = today.toISOString().split('T')[0];
    const monthStart  = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    // Prevent duplicate late fee for same tenant same month
    const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .gte("payment_date", monthStart)
        .ilike("notes", "Late fee%")
        .maybeSingle();

    if (existing) return { error: "Late fee already applied for this month" };

    // Mark tenant as late
    await supabase.from("tenants").update({ status: 'late' }).eq("id", tenantId);

    // Insert a late-fee charge into payments
    const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        tenant_id: tenantId,
        property_id: propertyId,
        amount: lateFeeAmount,
        payment_date: todayStr,
        status: 'pending',
        method: 'other',
        notes: `Late fee — ${monthLabel}`,
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard/tenants");
    revalidatePath("/dashboard/properties");
    revalidatePath(`/dashboard/projects/${propertyId}`);
    return { success: true };
}

/** Record full rent + late fee payment and reset tenant status to active */
export async function markRentPaid(tenantId: string, propertyId: string, amount: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const todayStr = new Date().toISOString().split('T')[0];

    await supabase.from("tenants").update({ status: 'active' }).eq("id", tenantId);

    const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        tenant_id: tenantId,
        property_id: propertyId,
        amount,
        payment_date: todayStr,
        status: 'paid',
        method: 'transfer',
        notes: 'Rent payment',
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard/tenants");
    revalidatePath("/dashboard/properties");
    revalidatePath(`/dashboard/projects/${propertyId}`);
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

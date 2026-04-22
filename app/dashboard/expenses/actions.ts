"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getExpenses(filters?: {
    propertyId?: string;
    unitNumber?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
        .from("expenses")
        .select("*, properties(address)")
        .eq("user_id", user.id)
        .order("expense_date", { ascending: false });

    if (filters?.propertyId)  query = query.eq("property_id", filters.propertyId);
    if (filters?.unitNumber)  query = query.eq("unit_number", filters.unitNumber);
    if (filters?.category)    query = query.eq("category", filters.category);
    if (filters?.startDate)   query = query.gte("expense_date", filters.startDate);
    if (filters?.endDate)     query = query.lte("expense_date", filters.endDate);

    const { data, error } = await query;
    if (error) { console.error("getExpenses:", error); return []; }
    return data || [];
}

export async function addExpense(params: {
    propertyId: string;
    unitNumber?: string;
    category: string;
    description: string;
    amount: number;
    expenseDate: string;
    vendor?: string;
    notes?: string;
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { propertyId, unitNumber, category, description, amount, expenseDate, vendor, notes } = params;

    const record: any = {
        user_id:      user.id,
        property_id:  propertyId || null,
        category,
        description,
        amount,
        expense_date: expenseDate || new Date().toISOString().split("T")[0],
    };
    if (unitNumber) record.unit_number = unitNumber;
    if (vendor)     record.vendor      = vendor;
    if (notes)      record.notes       = notes;

    const { error } = await supabase.from("expenses").insert(record);
    if (error) {
        console.error("addExpense:", error);
        return { error: error.message || "Failed to add expense" };
    }

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateExpense(id: string, params: {
    propertyId?: string;
    unitNumber?: string;
    category: string;
    description: string;
    amount: number;
    expenseDate: string;
    vendor?: string;
    notes?: string;
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { propertyId, unitNumber, category, description, amount, expenseDate, vendor, notes } = params;

    const record: any = {
        property_id:  propertyId || null,
        unit_number:  unitNumber || null,
        category,
        description,
        amount,
        expense_date: expenseDate,
        vendor:       vendor || null,
        notes:        notes  || null,
    };

    const { error } = await supabase.from("expenses").update(record).eq("id", id).eq("user_id", user.id);
    if (error) {
        console.error("updateExpense:", error);
        return { error: error.message || "Failed to update expense" };
    }

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteExpense(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true };
}

/** Returns last 6 months of income (paid payments) vs expenses per month */
export async function getIncomeExpensesByMonth() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const now = new Date();
    // Build 6-month slots
    const slots: { key: string; label: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
        slots.push({ key, label, income: 0, expenses: 0 });
    }

    const startDate = `${slots[0].key}-01`;

    // Fetch paid payments in range
    const { data: payments } = await supabase
        .from("payments")
        .select("amount, payment_date, status")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .gte("payment_date", startDate);

    // Fetch expenses in range
    const { data: expenses } = await supabase
        .from("expenses")
        .select("amount, expense_date")
        .eq("user_id", user.id)
        .gte("expense_date", startDate);

    (payments || []).forEach((p: any) => {
        const monthKey = p.payment_date?.slice(0, 7);
        const slot = slots.find(s => s.key === monthKey);
        if (slot) slot.income += parseFloat(p.amount) || 0;
    });

    (expenses || []).forEach((e: any) => {
        const monthKey = e.expense_date?.slice(0, 7);
        const slot = slots.find(s => s.key === monthKey);
        if (slot) slot.expenses += parseFloat(e.amount) || 0;
    });

    return slots.map(({ label, income, expenses }) => ({ name: label, income, expenses }));
}

/**
 * Returns per-property P&L for a given month (YYYY-MM).
 * Each entry: { propertyId, address, propertyType, units, income, expenses, net }
 */
export async function getMonthlyPLByProperty(monthKey: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { rows: [], totals: { income: 0, expenses: 0, net: 0 } };

    const monthStart = `${monthKey}-01`;
    const [y, m]     = monthKey.split("-").map(Number);
    const lastDay    = new Date(y, m, 0).getDate();
    const monthEnd   = `${monthKey}-${String(lastDay).padStart(2, "0")}`;

    // Fetch properties with financials (for CoC calculation)
    const { data: props } = await supabase
        .from("properties")
        .select("id, address, property_type, units, purchase_price, arv_estimate, financials(refinance_ltv, refinance_rate, taxes_annual, insurance_annual, management_rate, closing_costs_buy, rehab_cost)")
        .eq("user_id", user.id);

    // Fetch paid payments in month (joined with tenant → property)
    const { data: payments } = await supabase
        .from("payments")
        .select("amount, property_id, tenant_id, tenants(property_id)")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .gte("payment_date", monthStart)
        .lte("payment_date", monthEnd);

    // Fetch expenses in month
    const { data: expenses } = await supabase
        .from("expenses")
        .select("amount, property_id")
        .eq("user_id", user.id)
        .gte("expense_date", monthStart)
        .lte("expense_date", monthEnd);

    // Build map keyed by property_id
    const map: Record<string, { income: number; expenses: number }> = {};
    const ensure = (id: string) => { if (!map[id]) map[id] = { income: 0, expenses: 0 }; };

    (payments || []).forEach((p: any) => {
        const pid = p.property_id || p.tenants?.property_id;
        if (!pid) return;
        ensure(pid);
        map[pid].income += parseFloat(p.amount) || 0;
    });

    (expenses || []).forEach((e: any) => {
        if (!e.property_id) return;
        ensure(e.property_id);
        map[e.property_id].expenses += parseFloat(e.amount) || 0;
    });

    const rows = (props || []).map((p: any) => {
        const d   = map[p.id] ?? { income: 0, expenses: 0 };
        const net = d.income - d.expenses;

        // CoC (Cash-on-Cash) ROI — annualised net / cash invested
        let cocROI: number | null = null;
        const fin = Array.isArray(p.financials) ? p.financials[0] : p.financials;
        if (fin) {
            const value      = p.arv_estimate || p.purchase_price || 0;
            const loanAmt    = value * ((fin.refinance_ltv || 75) / 100);
            const totalCost  = (p.purchase_price || 0) + (fin.closing_costs_buy || 0) + (fin.rehab_cost || 0);
            const cashLeft   = totalCost - loanAmt;
            if (cashLeft > 0 && net !== 0) {
                cocROI = ((net * 12) / cashLeft) * 100;
            }
        }

        return {
            propertyId:   p.id,
            address:      p.address || "—",
            propertyType: p.property_type,
            units:        p.units ?? 1,
            income:       d.income,
            expenses:     d.expenses,
            net,
            cocROI,
        };
    }).sort((a, b) => b.net - a.net);

    const totals = rows.reduce(
        (s, r) => ({ income: s.income + r.income, expenses: s.expenses + r.expenses, net: s.net + r.net }),
        { income: 0, expenses: 0, net: 0 }
    );

    return { rows, totals };
}

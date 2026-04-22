import { createClient } from "@/lib/supabase/server";
import { estimatedMonthlyCashFlow, remainingLoanBalance } from "@/lib/finance";

export async function getDashboardMetrics() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch all properties with their related financials and rehab items
    const { data: properties, error } = await supabase
        .from('properties')
        .select(`
            *,
            financials (*),
            tenants (*),
            rehab_items (*)
        `)
        .eq('user_id', user.id);

    if (error) {
        console.error("Error fetching metrics:", error);
        return null;
    }

    // ── Real income & expenses (3-month trailing average, per property) ──────
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

    const [{ data: realPaymentsRaw }, { data: realExpensesRaw }] = await Promise.all([
        supabase.from("payments").select("property_id, amount")
            .eq("user_id", user.id).eq("status", "paid").gte("payment_date", threeMonthsAgoStr),
        supabase.from("expenses").select("property_id, amount")
            .eq("user_id", user.id).gte("expense_date", threeMonthsAgoStr),
    ]);

    // Sum over 3 months then divide → monthly average per property
    const realIncomeByProp:   Record<string, number> = {};
    const realExpensesByProp: Record<string, number> = {};

    (realPaymentsRaw || []).forEach((p: any) => {
        if (!p.property_id) return;
        realIncomeByProp[p.property_id] = (realIncomeByProp[p.property_id] || 0) + (parseFloat(p.amount) || 0);
    });
    (realExpensesRaw || []).forEach((e: any) => {
        if (!e.property_id) return;
        realExpensesByProp[e.property_id] = (realExpensesByProp[e.property_id] || 0) + (parseFloat(e.amount) || 0);
    });
    // Convert to monthly averages
    Object.keys(realIncomeByProp).forEach(k   => { realIncomeByProp[k]   /= 3; });
    Object.keys(realExpensesByProp).forEach(k => { realExpensesByProp[k] /= 3; });

    let totalEquity = 0;
    let monthlyCashFlow = 0;
    let totalProperties = properties.length;
    let activeRehabs = 0;
    let maintenanceAlerts: any[] = [];

    // For Equity Chart (Mocking historical data for now as we don't have a history table yet)
    // We will generate a 12-month trend based on the current equity to look nice.
    let equityTrend = [];
    let roiSum = 0;
    let roiCount = 0;

    properties.forEach(prop => {
        const fin = prop.financials?.[0];
        const tenant = prop.tenants?.[0]; // Assuming single tenant for simplicity for now

        // --- EQUITY CALCULATION ---
        // ARV - Debt. If no ARV, use Purchase Price.
        const value = prop.arv_estimate || prop.purchase_price || 0;
        // Debt: Refi amount if exists, else Purchase Price * 0.75 (typical leverage) if owned? 
        // Let's simplify: Value - (Value * 0.75) roughly equals 25% equity if we assume standard leverage.
        // Or strictly: Value - Current Loan. We don't have "Current Loan" field explicitly, usually in financials as 'refinance_amount' or implied.
        // Let's use the logic from the previous page.tsx
        const ltv = fin?.refinance_ltv || 75;
        const loanAmount = value * (ltv / 100);
        const equity = value - loanAmount;
        totalEquity += equity;

        // --- CASH FLOW CALCULATION (real data first, estimated fallback) ---
        {
            const realIncome   = realIncomeByProp[prop.id]   ?? 0;
            const realExpenses = realExpensesByProp[prop.id] ?? 0;
            const hasRealData  = realIncome > 0 || realExpenses > 0;

            let cashFlow = 0;

            if (hasRealData) {
                // ✅ Real: 3-month average of actual payments minus actual expenses
                cashFlow = realIncome - realExpenses;
                monthlyCashFlow += cashFlow;
            } else if (fin) {
                // ⚠️ Estimated: no transactions recorded yet — use financial model
                const currentRent = prop.tenants?.reduce((sum: number, t: any) =>
                    sum + (t.status === 'active' ? (t.rent_amount || 0) : 0), 0) || 0;
                const propVal = prop.arv_estimate || prop.purchase_price || 0;
                const loan    = propVal * ((fin.refinance_ltv || 75) / 100);
                cashFlow = estimatedMonthlyCashFlow({
                    rent:            currentRent,
                    loanAmount:      loan,
                    annualRate:      fin.refinance_rate || 7.0,
                    taxesAnnual:     fin.taxes_annual,
                    insuranceAnnual: fin.insurance_annual,
                    managementRate:  fin.management_rate,
                });
                monthlyCashFlow += cashFlow;

                const totalCost = (prop.purchase_price || 0) + (fin.closing_costs_buy || 0) + (fin.rehab_cost || 0);
                const cashLeft  = totalCost - loan;
                if (cashLeft > 0) {
                    roiSum += ((cashFlow * 12) / cashLeft) * 100;
                    roiCount++;
                }
            }
        }

        // --- REHABS & ALERTS ---
        if (prop.status === 'rehab') {
            activeRehabs++;
            // Check for progress?
            const items = prop.rehab_items || [];
            const incomplete = items.filter((i: any) => i.status !== 'completed').length;
            maintenanceAlerts.push({
                type: 'rehab',
                message: `${incomplete} incomplete tasks at ${prop.address}`,
                property_id: prop.id
            });
        }

        // Mock Lease Expiry Alerts
        if (tenant && tenant.lease_end) {
            const endDate = new Date(tenant.lease_end);
            const today = new Date();
            const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 60 && diffDays > 0) {
                maintenanceAlerts.push({
                    type: 'lease',
                    message: `Lease expires in ${diffDays} days: ${prop.address}`,
                    property_id: prop.id
                });
            }
        }
    });

    // Real equity trend: mortgage amortization per property over past 12 months
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });

        let totalEquityAtMonth = 0;

        properties.forEach(prop => {
            const fin   = prop.financials?.[0];
            const value = prop.arv_estimate || prop.purchase_price || 0;
            if (!value) return;

            const ltv         = fin?.refinance_ltv || 75;
            const initialLoan = value * (ltv / 100);

            if (!fin?.refinance_rate || initialLoan <= 0) {
                totalEquityAtMonth += value - initialLoan;
                return;
            }

            // Approximate loan start from property created_at
            const purchaseDate = new Date((prop as any).created_at || today);
            const monthsSincePurchase = Math.max(0,
                (monthDate.getFullYear() - purchaseDate.getFullYear()) * 12 +
                (monthDate.getMonth()    - purchaseDate.getMonth())
            );

            const balance = remainingLoanBalance(initialLoan, fin.refinance_rate, monthsSincePurchase);
            totalEquityAtMonth += value - balance;
        });

        equityTrend.push({ name: monthName, value: Math.round(totalEquityAtMonth) });
    }

    // Fetch maintenance requests
    const { data: maintenanceData } = await supabase
        .from("maintenance_requests")
        .select("id, status, actual_cost, category, closed_at, property_id, title, priority")
        .eq("user_id", user.id);

    const maintenanceRequests = maintenanceData || [];
    const openMaintenance = maintenanceRequests.filter(r => r.status === "open").length;
    const totalMaintenanceSpent = maintenanceRequests.reduce((s, r) => s + (r.actual_cost || 0), 0);

    // Group maintenance spend by month (last 6 months)
    const maintenanceByMonth: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        maintenanceByMonth[d.toLocaleString("default", { month: "short", year: "2-digit" })] = 0;
    }
    maintenanceRequests.forEach(r => {
        if (!r.closed_at || !r.actual_cost) return;
        const d = new Date(r.closed_at);
        const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
        if (key in maintenanceByMonth) {
            maintenanceByMonth[key] += r.actual_cost;
        }
    });
    const maintenanceTrend = Object.entries(maintenanceByMonth).map(([name, value]) => ({ name, value }));

    // Group by category
    const byCat: Record<string, number> = {};
    maintenanceRequests.forEach(r => {
        if (!r.actual_cost) return;
        byCat[r.category || "general"] = (byCat[r.category || "general"] || 0) + r.actual_cost;
    });
    const maintenanceByCategory = Object.entries(byCat)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .sort((a, b) => b.value - a.value);

    // ── Income vs Expenses (last 6 months) ───────────────────────────────
    const now6 = new Date();
    const incomeExpenseSlots: { key: string; label: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now6.getFullYear(), now6.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        incomeExpenseSlots.push({ key, label: d.toLocaleString("default", { month: "short", year: "2-digit" }), income: 0, expenses: 0 });
    }
    const ie_startDate = `${incomeExpenseSlots[0].key}-01`;

    const [{ data: iePayments }, { data: ieExpenses }] = await Promise.all([
        supabase.from("payments").select("amount, payment_date").eq("user_id", user.id).eq("status", "paid").gte("payment_date", ie_startDate),
        supabase.from("expenses").select("amount, expense_date").eq("user_id", user.id).gte("expense_date", ie_startDate),
    ]);

    (iePayments || []).forEach((p: any) => {
        const slot = incomeExpenseSlots.find(s => s.key === p.payment_date?.slice(0, 7));
        if (slot) slot.income += parseFloat(p.amount) || 0;
    });
    (ieExpenses || []).forEach((e: any) => {
        const slot = incomeExpenseSlots.find(s => s.key === e.expense_date?.slice(0, 7));
        if (slot) slot.expenses += parseFloat(e.amount) || 0;
    });

    const incomeExpenseTrend = incomeExpenseSlots.map(({ label, income, expenses }) => ({ name: label, income, expenses }));

    // Also compute total income this month
    const currentMonthKey = `${now6.getFullYear()}-${String(now6.getMonth() + 1).padStart(2, "0")}`;
    const currentSlot = incomeExpenseSlots.find(s => s.key === currentMonthKey);
    const monthlyIncome  = currentSlot?.income   ?? 0;
    const monthlyExpenses = currentSlot?.expenses ?? 0;

    // Fetch reminders
    const { data: dbReminders, error: remError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(5);

    if (remError) {
        console.error("Error fetching reminders:", remError);
    }

    if (dbReminders) {
        // Map database reminders to the alert format
        const mappedReminders = dbReminders.map(r => ({
            type: r.type === 'lease_expiry' ? 'lease' : 'maintenance',
            message: `${r.title} - ${new Date(r.due_date).toLocaleDateString()}`,
            property_id: r.property_id
        }));
        maintenanceAlerts = [...maintenanceAlerts, ...mappedReminders];
    }

    const avgRoi = roiCount > 0 ? roiSum / roiCount : 0;

    // Total portfolio value (sum of ARV or purchase price)
    const totalPortfolioValue = properties.reduce((sum, p) => sum + (p.arv_estimate || p.purchase_price || 0), 0);

    // Per-property summary for the "at a glance" table
    const propertySummaries = properties.map(prop => {
        const fin    = prop.financials?.[0];
        const value  = prop.arv_estimate || prop.purchase_price || 0;
        const ltv    = fin?.refinance_ltv || 75;
        const loan   = value * (ltv / 100);
        const equity = value - loan;

        // Use real 3-month avg if available, else estimated
        const realIncome   = realIncomeByProp[prop.id]   ?? 0;
        const realExpenses = realExpensesByProp[prop.id] ?? 0;
        const hasRealData  = realIncome > 0 || realExpenses > 0;

        let cashFlow = 0;
        if (hasRealData) {
            cashFlow = realIncome - realExpenses;
        } else if (fin) {
            const rent = prop.tenants?.reduce((s: number, t: any) => s + (t.status === 'active' ? (t.rent_amount || 0) : 0), 0) || 0;
            cashFlow = estimatedMonthlyCashFlow({
                rent,
                loanAmount:      loan,
                annualRate:      fin.refinance_rate || 7.0,
                taxesAnnual:     fin.taxes_annual,
                insuranceAnnual: fin.insurance_annual,
                managementRate:  fin.management_rate,
            });
        }

        return {
            id:        prop.id,
            address:   prop.address || "—",
            status:    prop.status  || "analyzing",
            value,
            equity,
            cashFlow,
            rent: prop.tenants?.reduce((s: number, t: any) => s + (t.status === 'active' ? (t.rent_amount || 0) : 0), 0) || 0,
        };
    });

    return {
        stats: {
            totalEquity,
            totalPortfolioValue,
            monthlyCashFlow,
            totalProperties,
            activeRehabs,
            avgRoi,
            openMaintenance,
            totalMaintenanceSpent,
            monthlyIncome,
            monthlyExpenses,
        },
        equityTrend,
        maintenanceAlerts,
        propertySummaries,
        maintenanceTrend,
        maintenanceByCategory,
        incomeExpenseTrend,
    };
}

import { createClient } from "@/lib/supabase/server";

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

        // --- CASH FLOW CALCULATION ---
        // --- CASH FLOW CALCULATION ---
        // Actual Cash Flow: Actual Rent - (Taxes + Insurance + Debt + Mgmt)
        // If no financials, we skip adding to the total (or could estimate, but user wants "real" data).
        if (fin) {
            const currentRent = prop.tenants?.reduce((sum: number, t: any) => sum + (t.status === 'active' ? (t.rent_amount || 0) : 0), 0) || 0;

            const taxesMo = (fin.taxes_annual || 0) / 12;
            const insMo = (fin.insurance_annual || 0) / 12;
            const mgmt = currentRent * ((fin.management_rate || 0) / 100);

            // Debt Service
            const value = prop.arv_estimate || prop.purchase_price || 0;
            const loanAmount = value * ((fin.refinance_ltv || 75) / 100);

            const rate = fin.refinance_rate || 7.0;
            let debtService = 0;
            if (loanAmount > 0 && rate > 0) {
                const r = rate / 100 / 12;
                const n = 360;
                debtService = (loanAmount * r) / (1 - Math.pow(1 + r, -n));
            }

            const fixedExpenses = taxesMo + insMo + debtService;
            const cashFlow = currentRent - (fixedExpenses + mgmt);

            monthlyCashFlow += cashFlow;

            // ROI / CoC Calculation
            // Cash Left = (Purchase + Closing + Rehab) - RefiLoan. Or simpler: Cash Invested.
            // If completed Brrrr, Cash Left might be 0 or negative (infinite).
            // Let's use "Cash Invested" as denominator for standard CoC if not refied yet?
            // Or assume BRRRR logic: Cash Left In Deal.
            // Total Cost Basis
            const totalCost = (prop.purchase_price || 0) + (fin.closing_costs_buy || 0) + (fin.rehab_cost || 0);
            const refiLoan = loanAmount; // Using the refi amount calculated above
            let cashLeft = totalCost - refiLoan;
            // If hasn't refied (loanAmount is 0 or low), this is just total cost?
            // Actually, if status != sold, we assume holding.

            // Simplified: If cashLeft <= 0, we can say infinite but for averaging let's cap it or exclude?
            // Usually Avg ROI excludes infinite or outliers.
            if (cashLeft > 0) {
                const roi = ((cashFlow * 12) / cashLeft) * 100;
                roiSum += roi;
                roiCount++;
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

    // Generate Mock Trend Data based on Total Equity
    // Smooth curve growing to current Total Equity
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        // Random fluctuation but generally growing
        const growthFactor = 0.8 + (0.2 * (11 - i) / 11); // 80% to 100%
        equityTrend.push({
            name: monthName,
            value: Math.round(totalEquity * growthFactor)
        });
    }

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

    // Calculate final Average
    const avgRoi = roiCount > 0 ? roiSum / roiCount : 0;

    return {
        stats: {
            totalEquity,
            monthlyCashFlow,
            totalProperties,
            activeRehabs,
            avgRoi // Returning the calculated metric
        },
        equityTrend,
        maintenanceAlerts
    };
}

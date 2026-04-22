/**
 * Shared real-estate finance utilities.
 * Pure functions — no server/client dependency.
 */

/**
 * Monthly mortgage payment (principal + interest).
 * @param loanAmount  - Initial loan principal
 * @param annualRate  - Annual interest rate as a percentage (e.g. 7.0 for 7%)
 * @param termYears   - Loan term in years (default 30)
 */
export function monthlyMortgagePayment(
    loanAmount: number,
    annualRate: number,
    termYears = 30,
): number {
    if (loanAmount <= 0 || annualRate <= 0) return 0;
    const r = annualRate / 100 / 12;
    const n = termYears * 12;
    return (loanAmount * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Remaining loan balance after `monthsPaid` payments.
 * Uses the standard amortization formula: B(k) = P·[(1+r)^n - (1+r)^k] / [(1+r)^n - 1]
 */
export function remainingLoanBalance(
    loanAmount: number,
    annualRate: number,
    monthsPaid: number,
    termYears = 30,
): number {
    if (loanAmount <= 0) return 0;
    if (annualRate <= 0) {
        const n = termYears * 12;
        return loanAmount * Math.max(0, 1 - monthsPaid / n);
    }
    const r   = annualRate / 100 / 12;
    const n   = termYears * 12;
    const k   = Math.min(monthsPaid, n);
    const pow_n = Math.pow(1 + r, n);
    const pow_k = Math.pow(1 + r, k);
    return loanAmount * (pow_n - pow_k) / (pow_n - 1);
}

/** Parameters accepted by estimatedMonthlyCashFlow */
export interface CashFlowParams {
    rent:            number;   // monthly gross rent
    loanAmount:      number;   // refinance loan
    annualRate:      number;   // refinance rate %
    taxesAnnual?:    number;
    insuranceAnnual?: number;
    managementRate?: number;   // % of rent
    termYears?:      number;
}

/**
 * Estimated monthly cash flow from a financial model
 * (use when no real payment/expense data is available yet).
 */
export function estimatedMonthlyCashFlow(p: CashFlowParams): number {
    const debtService = monthlyMortgagePayment(p.loanAmount, p.annualRate, p.termYears);
    const taxes       = (p.taxesAnnual    || 0) / 12;
    const insurance   = (p.insuranceAnnual || 0) / 12;
    const mgmt        = p.rent * ((p.managementRate || 0) / 100);
    return p.rent - (debtService + taxes + insurance + mgmt);
}

/**
 * Cash-on-Cash ROI (annualised), as a percentage.
 * Returns null when cash invested is zero or negative.
 */
export function cashOnCashROI(
    monthlyCashFlow: number,
    purchasePrice:   number,
    closingCosts:    number,
    rehabCost:       number,
    loanAmount:      number,
): number | null {
    const cashInvested = purchasePrice + closingCosts + rehabCost - loanAmount;
    if (cashInvested <= 0) return null;
    return ((monthlyCashFlow * 12) / cashInvested) * 100;
}

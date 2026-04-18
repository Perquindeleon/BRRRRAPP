"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormattedCurrencyInput } from "@/components/ui/formatted-currency-input";
import { AddressAutocomplete } from "@/components/properties/address-autocomplete";
import { FlipFixCharts } from "./flip-fix-charts";
import { RehabEstimatorModal } from "./rehab-estimator-modal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Hammer, TrendingUp, TrendingDown, DollarSign, Clock, Percent } from "lucide-react";

interface FlipFixAnalyzerProps {
    data: any;
    onChange: (data: any) => void;
}

// ─── Deal Verdict ─────────────────────────────────────────────────────────────

function getDealVerdict(roi: number, netProfit: number, cashRequired: number) {
    if (cashRequired === 0) return null;
    if (roi >= 20 && netProfit > 0) return { label: "Hot Deal",    icon: "🔥", color: "emerald" } as const;
    if (roi >= 12 && netProfit > 0) return { label: "Good Deal",   icon: "✅", color: "blue"    } as const;
    if (roi >= 5  && netProfit > 0) return { label: "Marginal",    icon: "⚖️", color: "yellow"  } as const;
    return                                 { label: "Pass",        icon: "❌", color: "red"     } as const;
}

const VERDICT_STYLES = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    blue:    "bg-blue-500/10    text-blue-400    border-blue-500/30",
    yellow:  "bg-yellow-500/10  text-yellow-400  border-yellow-500/30",
    red:     "bg-red-500/10     text-red-400     border-red-500/30",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FlipFixAnalyzer({ data, onChange }: FlipFixAnalyzerProps) {
    const [address,       setAddress]       = useState(data?.address || "");
    const [purchasePrice, setPurchasePrice] = useState(data?.purchase_price || 0);
    const [repairs,       setRepairs]       = useState(data?.financials?.rehab_cost || 0);
    const [arv,           setArv]           = useState(data?.arv_estimate || 0);
    const [closingDate,   setClosingDate]   = useState(data?.closing_date || "");
    const [rehabModalOpen, setRehabModalOpen] = useState(false);

    // Details
    const [livingArea,      setLivingArea]      = useState(data?.living_area || 0);
    const [projectMonths,   setProjectMonths]   = useState(data?.financials?.project_duration_months || 3);
    const [ltvPercent,      setLtvPercent]      = useState(70);
    const [loanInterestRate,      setLoanInterestRate]      = useState(data?.financials?.loan_interest_rate || 12.0);
    const [originationPoints,     setOriginationPoints]     = useState(3.0);
    const [realtorCommissionRate, setRealtorCommissionRate] = useState(6.0);

    // Detailed costs
    const [utilitiesCost,           setUtilitiesCost]           = useState(0);
    const [acquisitionCommissionRate, setAcquisitionCommissionRate] = useState(3);
    const [projectManagementCost,   setProjectManagementCost]   = useState(0);
    const [titleClosingCost,        setTitleClosingCost]        = useState(data?.financials?.closing_costs_buy || 0);
    const [insuranceCost,           setInsuranceCost]           = useState(0);
    const [otherCosts,              setOtherCosts]              = useState(0);
    const [lenderDocFees,           setLenderDocFees]           = useState(0);

    // ─── Calculations ──────────────────────────────────────────────────────────

    const costPerSqFt    = livingArea > 0 ? repairs / livingArea : 0;
    const loanAmount     = arv * (ltvPercent / 100);

    const acquisitionCommission  = purchasePrice * (acquisitionCommissionRate / 100);
    const subtotalDirectCosts    = purchasePrice + utilitiesCost + repairs + acquisitionCommission + projectManagementCost + titleClosingCost + insuranceCost;
    const grossProfit            = arv - subtotalDirectCosts;

    const monthlyInterest        = loanAmount * (loanInterestRate / 100 / 12);
    const totalInterest          = monthlyInterest * projectMonths;
    const loanOriginationAmount  = loanAmount * (originationPoints / 100);
    const subtotalFinancialCosts = totalInterest + otherCosts + loanOriginationAmount + lenderDocFees;

    const realtorCommissionAmount = arv * (realtorCommissionRate / 100);
    const loanFundsForPurchase    = loanAmount - repairs;
    const closingCostsAtPurchase  = acquisitionCommission + titleClosingCost + insuranceCost + loanOriginationAmount + lenderDocFees;
    const downPaymentRequired     = purchasePrice - loanFundsForPurchase;
    const totalCashRequired       = downPaymentRequired + closingCostsAtPurchase;

    const finalNetProfit = grossProfit - subtotalFinancialCosts - realtorCommissionAmount;
    const roi            = totalCashRequired > 0 ? (finalNetProfit / totalCashRequired) * 100 : 0;

    const verdict = getDealVerdict(roi, finalNetProfit, totalCashRequired);

    // ─── Sync to parent ────────────────────────────────────────────────────────

    useEffect(() => {
        onChange({
            purchase_price: purchasePrice,
            financials: {
                rehab_cost:               repairs,
                closing_costs_buy:        titleClosingCost,
                project_duration_months:  projectMonths,
                loan_interest_rate:       loanInterestRate,
                loan_down_payment_pct:    0,
                closing_costs_refi:       realtorCommissionAmount,
                insurance_annual:         insuranceCost,
            },
            arv_estimate: arv,
            address,
            ai_analysis_json: {
                strategy: "flip_fix",
                living_area:                livingArea,
                utilities_cost:             utilitiesCost,
                acquisition_commission_rate: acquisitionCommissionRate,
                project_management_cost:    projectManagementCost,
                origination_points:         originationPoints,
                lender_doc_fees:            lenderDocFees,
                other_financial_costs:      otherCosts,
                realtor_commission_rate:    realtorCommissionRate,
                closing_date:               closingDate,
                ltv_percent:                ltvPercent,
                flip_results: {
                    total_cash_required:      totalCashRequired,
                    net_profit:               finalNetProfit,
                    roi,
                    direct_costs_subtotal:    subtotalDirectCosts,
                    financial_costs_subtotal: subtotalFinancialCosts,
                },
            },
        });
    }, [
        purchasePrice, repairs, arv, closingDate, livingArea, projectMonths, ltvPercent,
        loanInterestRate, originationPoints, realtorCommissionRate, utilitiesCost,
        acquisitionCommissionRate, projectManagementCost, titleClosingCost, insuranceCost,
        otherCosts, lenderDocFees, address, data?.id,
    ]);

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Rehab modal */}
            <RehabEstimatorModal
                isOpen={rehabModalOpen}
                onClose={() => setRehabModalOpen(false)}
                onApply={(amount) => setRepairs(amount)}
                purchasePrice={purchasePrice}
            />

            {/* Address */}
            <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                    <div className="bg-secondary p-2 rounded-md font-bold text-center text-secondary-foreground uppercase tracking-widest text-sm -mx-4 -mt-4 rounded-b-none border-b border-border">
                        Flip &amp; Fix Analysis
                    </div>
                    <div className="space-y-1.5 pt-1">
                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Property Address</Label>
                        <AddressAutocomplete
                            value={address}
                            onChange={setAddress}
                            onSelect={(val) => setAddress(val)}
                            label={null}
                            className="font-bold text-md bg-background border-input text-foreground"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── LEFT: INPUTS ─────────────────────────────────────────── */}
                <div className="space-y-6">

                    {/* Key numbers */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden">
                            <TableLikeRow label="Purchase Price"  value={purchasePrice} onChange={setPurchasePrice} currency />
                            <div className={cn("grid grid-cols-[1fr_120px] items-center border-b border-border hover:bg-muted transition-colors")}>
                                <div className="px-3 py-2 flex items-center gap-2 font-medium text-foreground">
                                    Repairs
                                    <button
                                        type="button"
                                        onClick={() => setRehabModalOpen(true)}
                                        className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors ml-1"
                                    >
                                        <Hammer className="h-3 w-3" /> AI Est.
                                    </button>
                                </div>
                                <div className="px-2 py-1">
                                    <FormattedCurrencyInput
                                        value={repairs}
                                        onChange={setRepairs}
                                        className="h-7 text-right px-1 bg-background border-input text-foreground font-bold rounded-sm"
                                    />
                                </div>
                            </div>
                            <TableLikeRow label="Sale Price – ARV" value={arv} onChange={setArv} currency bg="bg-muted/40" />
                            <TableLikeRow label="Closing Date"     value={closingDate} isDate onChange={(v: any) => setClosingDate(String(v))} />
                        </CardContent>
                    </Card>

                    {/* Details */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden text-sm">
                            <TableLikeRow label="Living Area (SqFt)"       value={livingArea}    onChange={setLivingArea} />
                            <DisplayRow   label="Repair Cost / SqFt"       value={costPerSqFt}   noPrefix />
                            <TableLikeRow label="Project Duration (months)" value={projectMonths} onChange={setProjectMonths} />

                            {/* LTV — editable */}
                            <div className="grid grid-cols-[1fr_120px] items-center border-b border-border hover:bg-muted transition-colors">
                                <div className="px-3 py-2 text-foreground font-medium">Loan LTV %</div>
                                <div className="px-2 py-1 flex items-center gap-1">
                                    <Input
                                        type="number" min={0} max={100} step={1}
                                        value={ltvPercent}
                                        onChange={e => setLtvPercent(Number(e.target.value))}
                                        className="h-7 text-right px-1 pr-5 bg-background border-input text-foreground font-bold rounded-sm"
                                    />
                                    <Percent className="h-3 w-3 text-muted-foreground -ml-5 pointer-events-none" />
                                </div>
                            </div>

                            <DisplayRow label={`Estimated Loan (${ltvPercent}% ARV)`} value={loanAmount} />
                            <TableLikeRow label="Annual Interest %"               value={loanInterestRate}      onChange={setLoanInterestRate}      isPercent />
                            <TableLikeRow label="Origination Points %"            value={originationPoints}     onChange={setOriginationPoints}     isPercent />
                            <TableLikeRow label="Realtor Commission (Sale) %"     value={realtorCommissionRate} onChange={setRealtorCommissionRate} isPercent />

                            <div className="flex justify-between p-2 px-3 bg-muted/30 font-bold border-t-2 border-border">
                                <span className="text-xs uppercase text-muted-foreground">Personal Investment<br/><span className="font-normal text-[10px]">(Down Pmt + Closing + Repair diff)</span></span>
                                <span className="text-lg text-foreground">${totalCashRequired.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Direct Costs breakdown */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden text-sm">
                            <SectionHeader>Detailed Breakdown</SectionHeader>
                            <div className="bg-muted p-2 px-3 flex justify-between font-bold border-b border-border text-foreground text-xs uppercase tracking-wider">
                                <span>Item</span><span>USD</span>
                            </div>
                            <div className="p-2 px-3 flex justify-between font-bold bg-background border-b border-border text-foreground">
                                <span>Sale Price (ARV)</span>
                                <span>${arv.toLocaleString()}</span>
                            </div>

                            <div className="bg-secondary px-3 py-1 font-bold text-xs uppercase text-secondary-foreground border-b border-border">Direct Costs (DC)</div>

                            <div className="divide-y divide-border">
                                <DisplayRow label="Purchase Price"       value={purchasePrice} />
                                <TableLikeRow label="Utilities (Water, Power)" value={utilitiesCost} onChange={setUtilitiesCost} />
                                <DisplayRow   label="Remodel / Repair Costs"   value={repairs} />
                                {/* Acquisition commission inline % */}
                                <div className="grid grid-cols-[1fr_120px] items-center border-b border-border hover:bg-muted transition-colors">
                                    <div className="px-3 py-2 flex items-center gap-1.5 text-foreground font-medium">
                                        Acquisition Commission
                                        <Input className="w-12 h-6 text-xs p-1 bg-background border-input text-foreground" type="number"
                                            value={acquisitionCommissionRate}
                                            onChange={e => setAcquisitionCommissionRate(Number(e.target.value))} />
                                        <span className="text-muted-foreground text-xs">%</span>
                                    </div>
                                    <div className="px-3 py-2 text-right font-bold text-foreground">${acquisitionCommission.toLocaleString()}</div>
                                </div>
                                <TableLikeRow label="Project Management" value={projectManagementCost} onChange={setProjectManagementCost} />
                                <TableLikeRow label="Title Closing Cost" value={titleClosingCost}       onChange={setTitleClosingCost} />
                                <TableLikeRow label="Insurance"          value={insuranceCost}          onChange={setInsuranceCost} />
                            </div>

                            <div className="flex justify-between p-2 px-3 bg-secondary font-bold border-t border-border">
                                <span className="text-secondary-foreground">Subtotal Direct Costs</span>
                                <span className="text-foreground">${subtotalDirectCosts.toLocaleString()}</span>
                            </div>
                            <div className={cn("flex justify-between p-2 px-3 font-bold border-t",
                                grossProfit >= 0
                                    ? "bg-primary/10 border-primary/20 text-primary"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                            )}>
                                <span>Gross Profit</span>
                                <span>{grossProfit >= 0 ? "+" : ""}${grossProfit.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Costs */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden text-sm">
                            <div className="bg-slate-300 dark:bg-slate-700 px-3 py-1 font-bold text-xs uppercase text-slate-800 dark:text-slate-100 border-b border-border">Financial Costs (FC)</div>
                            <div className="divide-y divide-border">
                                <DisplayRow label="Loan Interest"                  value={totalInterest} />
                                <TableLikeRow label="Other Costs"                  value={otherCosts} onChange={setOtherCosts} />
                                <DisplayRow label="Lender Origination Points"       value={loanOriginationAmount} />
                                <TableLikeRow label="Lender Doc Fees"              value={lenderDocFees} onChange={setLenderDocFees} />
                            </div>
                            <div className="flex justify-between p-2 px-3 bg-slate-100 dark:bg-slate-800 font-bold border-t border-slate-300 dark:border-slate-700">
                                <span className="text-slate-800 dark:text-slate-200">FC Subtotal</span>
                                <span className="text-blue-600 dark:text-blue-400">${subtotalFinancialCosts.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Realtor + Net Profit */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden text-sm">
                            <div className="p-2 px-3 flex justify-between items-center text-foreground font-medium border-b border-border">
                                <span>Realtor Commission ({realtorCommissionRate}%)</span>
                                <span>${realtorCommissionAmount.toLocaleString()}</span>
                            </div>
                            <div className={cn("flex justify-between p-3 px-3 font-bold text-lg border-t",
                                finalNetProfit >= 0
                                    ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-800"
                                    : "bg-red-100    dark:bg-red-900/40     border-red-300    dark:border-red-800"
                            )}>
                                <span className={finalNetProfit >= 0 ? "text-emerald-900 dark:text-emerald-100" : "text-red-900 dark:text-red-100"}>
                                    Net Profit
                                </span>
                                <span className={finalNetProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}>
                                    {finalNetProfit >= 0 ? "+" : ""}${finalNetProfit.toLocaleString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── RIGHT: VISUALS ────────────────────────────────────────── */}
                <div className="space-y-6">

                    {/* Deal Verdict */}
                    {verdict && (
                        <div className={cn("flex items-center justify-between rounded-lg border px-5 py-3", VERDICT_STYLES[verdict.color])}>
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Deal Verdict</p>
                                <p className="font-black text-xl tracking-tight">{verdict.icon} {verdict.label}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">ROI</p>
                                <p className="font-black text-2xl">{roi.toFixed(1)}%</p>
                            </div>
                        </div>
                    )}

                    {/* Quick KPIs */}
                    <div className="grid grid-cols-2 gap-3">
                        <KpiCard
                            label="Net Profit"
                            value={`${finalNetProfit >= 0 ? "+" : ""}$${Math.abs(finalNetProfit).toLocaleString()}`}
                            icon={finalNetProfit >= 0 ? TrendingUp : TrendingDown}
                            positive={finalNetProfit >= 0}
                        />
                        <KpiCard
                            label="Cash to Close"
                            value={`$${totalCashRequired.toLocaleString()}`}
                            icon={DollarSign}
                        />
                        <KpiCard
                            label="Project Duration"
                            value={`${projectMonths} mo`}
                            icon={Clock}
                        />
                        <KpiCard
                            label="Loan Amount"
                            value={`$${loanAmount.toLocaleString()}`}
                            icon={Percent}
                            sublabel={`${ltvPercent}% LTV`}
                        />
                    </div>

                    {/* Investment Analysis */}
                    <Card className="bg-card border-border">
                        <CardContent className="p-0 text-sm">
                            <div className="bg-secondary p-2 px-4 font-bold text-center text-secondary-foreground uppercase tracking-widest text-xs border-b border-border">
                                Required Investment Analysis
                            </div>
                            <div className="p-4 space-y-2">
                                {[
                                    ["ARV",                       `$${arv.toLocaleString()}`],
                                    ["Purchase Price",            `$${purchasePrice.toLocaleString()}`],
                                    [`LTV ${ltvPercent}% (Loan)`, `$${loanAmount.toLocaleString()}`],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between border-b border-border pb-1 text-foreground">
                                        <span>{k}</span><span className="font-bold">{v}</span>
                                    </div>
                                ))}
                                <div className="py-1" />
                                {[
                                    ["Total loan amount",           `$${loanAmount.toLocaleString()}`],
                                    ["Minus repairs",               `$${repairs.toLocaleString()}`],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-muted-foreground text-xs">
                                        <span>{k}</span><span>{v}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-medium border-t border-dashed border-border pt-1 text-foreground">
                                    <span>Loan for Purchase</span>
                                    <span>${loanFundsForPurchase.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-medium text-foreground">
                                    <span>Closing Costs at Purchase</span>
                                    <span>${closingCostsAtPurchase.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-medium text-foreground">
                                    <span>Down Payment</span>
                                    <span>${downPaymentRequired.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-muted/20 font-bold border rounded mt-2 border-border">
                                    <span className="text-foreground">Estimated Funds to Close</span>
                                    <span className="text-foreground">${totalCashRequired.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Charts */}
                    <FlipFixCharts
                        totalInvestment={totalCashRequired}
                        netProfit={finalNetProfit}
                        directCosts={{
                            purchase:   purchasePrice,
                            utilities:  utilitiesCost,
                            rehab:      repairs,
                            commission: acquisitionCommission,
                            management: projectManagementCost,
                            closing:    titleClosingCost,
                            insurance:  insuranceCost,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-secondary p-2 font-bold text-center text-xs uppercase border-b border-border text-secondary-foreground tracking-widest">
            {children}
        </div>
    );
}

function KpiCard({ label, value, icon: Icon, sublabel, positive }: { label: string; value: string; icon: any; sublabel?: string; positive?: boolean }) {
    return (
        <div className="rounded-lg border border-border bg-card p-3 space-y-1">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
                <Icon className={cn("h-3.5 w-3.5", positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-muted-foreground")} />
            </div>
            <p className={cn("font-bold text-base tabular-nums",
                positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-foreground"
            )}>{value}</p>
            {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
        </div>
    );
}

function TableLikeRow({ label, value, onChange, currency, isPercent, isDate, bg, colorClass }: any) {
    return (
        <div className={cn("grid grid-cols-[1fr_120px] items-center border-b border-border hover:bg-muted transition-colors", bg)}>
            <div className="px-3 py-2 text-foreground font-medium truncate" title={label}>{label}</div>
            <div className="px-2 py-1 flex items-center">
                {isDate ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full h-8 justify-start text-left font-normal px-2 truncate bg-background border-input text-foreground hover:bg-muted", !value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-3 w-3 shrink-0" />
                                <span className="text-xs">{value ? format(new Date(value), "MM/dd/yyyy") : "Select Date"}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="single" selected={value ? new Date(value) : undefined}
                                onSelect={(date) => onChange(date ? date.toISOString().split("T")[0] : "")} initialFocus />
                        </PopoverContent>
                    </Popover>
                ) : currency ? (
                    <FormattedCurrencyInput value={value} onChange={onChange}
                        className={cn("h-7 text-right px-1 bg-background border-input text-foreground hover:border-accent focus:border-ring rounded-sm font-bold", colorClass)} />
                ) : (
                    <div className="relative w-full">
                        <Input type="number" value={value || ""}
                            onChange={e => onChange(Number(e.target.value))}
                            className={cn("h-7 text-right px-1 bg-background border-input text-foreground hover:border-accent focus:border-ring rounded-sm font-bold w-full", colorClass, isPercent && "pr-6")} />
                        {isPercent && <span className="absolute right-1.5 top-1 text-xs text-muted-foreground">%</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

function DisplayRow({ label, value, noPrefix }: { label: string; value: number; noPrefix?: boolean }) {
    return (
        <div className="flex justify-between p-2 px-3 border-b border-border">
            <span className="text-foreground font-medium">{label}</span>
            <span className="font-medium text-foreground">{noPrefix ? value.toFixed(0) : `$${Number(value).toLocaleString()}`}</span>
        </div>
    );
}

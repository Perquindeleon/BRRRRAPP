"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormattedCurrencyInput } from "@/components/ui/formatted-currency-input";
import { AddressAutocomplete } from "@/components/properties/address-autocomplete"; // Import AddressAutocomplete
import { FlipFixCharts } from "./flip-fix-charts";
import { cn } from "@/lib/utils";

interface FlipFixAnalyzerProps {
    data: any;
    onChange: (data: any) => void;
}

export function FlipFixAnalyzer({ data, onChange }: FlipFixAnalyzerProps) {
    // --- State Initialization ---
    // If the parent passes data, use it. Otherwise defaults.
    // NOTE: We need to sync local calculations back to parent for saving.

    const [address, setAddress] = useState(data?.address || "5920 Forest Haven Trail Dallas TX 75232"); // Default from screenshot

    // Header Inputs
    const [purchasePrice, setPurchasePrice] = useState(data?.purchase_price || 180000);
    const [repairs, setRepairs] = useState(data?.financials?.rehab_cost || 49735);
    const [arv, setArv] = useState(data?.arv_estimate || 295000); // "Precio de venta"
    const [closingDate, setClosingDate] = useState(data?.closing_date || "");

    // Details Inputs
    const [livingArea, setLivingArea] = useState(data?.living_area || 1421);
    const [projectMonths, setProjectMonths] = useState(data?.financials?.project_duration_months || 3);
    const [loanInterestRate, setLoanInterestRate] = useState(data?.financials?.loan_interest_rate || 12.0);
    const [originationPoints, setOriginationPoints] = useState(3.00); // New field for JSON
    const [realtorCommissionRate, setRealtorCommissionRate] = useState(6.0); // New field for JSON

    // Detailed Costs Inputs
    const [utilitiesCost, setUtilitiesCost] = useState(1050);
    const [acquisitionCommissionRate, setAcquisitionCommissionRate] = useState(3); // 3%
    const [projectManagementCost, setProjectManagementCost] = useState(2000);
    const [titleClosingCost, setTitleClosingCost] = useState(data?.financials?.closing_costs_buy || 2655);
    const [insuranceCost, setInsuranceCost] = useState(1800);

    // Financial Costs Inputs
    const [otherCosts, setOtherCosts] = useState(0);
    const [lenderDocFees, setLenderDocFees] = useState(1495);

    // --- Calculations ---
    const costPerSqFt = livingArea > 0 ? repairs / livingArea : 0;

    // Loan Calcs
    const loanAmount = arv * 0.70;

    // Costos Directos
    const acquisitionCommission = purchasePrice * (acquisitionCommissionRate / 100);
    const subtotalDirectCosts = purchasePrice + utilitiesCost + repairs + acquisitionCommission + projectManagementCost + titleClosingCost + insuranceCost;

    // Gross Profit (Ganancia Bruta)
    const grossProfit = arv - subtotalDirectCosts;

    // Financial Costs
    const monthlyInterest = loanAmount * (loanInterestRate / 100 / 12);
    const totalInterest = monthlyInterest * projectMonths;
    const loanOriginationAmount = loanAmount * (originationPoints / 100);

    const subtotalFinancialCosts = totalInterest + otherCosts + loanOriginationAmount + lenderDocFees;

    // Final Results
    const netProfit = grossProfit - subtotalFinancialCosts; // "Utilidad Neta"

    // "Inversion Propia" (Cash to Close / Cash Required)
    const realtorCommissionAmount = arv * (realtorCommissionRate / 100);
    const loanFundsForPurchase = loanAmount - repairs;
    const closingCostsAtPurchase = acquisitionCommission + titleClosingCost + insuranceCost + loanOriginationAmount + lenderDocFees;
    const downPaymentRequired = purchasePrice - loanFundsForPurchase;
    const totalCashRequired = downPaymentRequired + closingCostsAtPurchase;

    // ROI
    // Net Profit = Gross Profit - Financial Costs - Realtor Commission (on sale).
    const finalNetProfit = grossProfit - subtotalFinancialCosts - realtorCommissionAmount;

    // ROI %
    const roi = totalCashRequired > 0 ? (finalNetProfit / totalCashRequired) * 100 : 0;

    // Sync to parent
    useEffect(() => {
        onChange({
            purchase_price: purchasePrice,
            financials: {
                rehab_cost: repairs,
                closing_costs_buy: titleClosingCost,
                project_duration_months: projectMonths,
                loan_interest_rate: loanInterestRate,
                loan_down_payment_pct: 0, // Calculated differently in Flip strategy
                closing_costs_refi: realtorCommissionAmount, // Mapping "Selling Costs" here for now
                insurance_annual: insuranceCost, // Using annual bucket for one-time
            },
            arv_estimate: arv,
            address: address,
            // Custom JSON bucket for fields that don't fit perfectly
            ai_analysis_json: {
                strategy: "flip_fix",
                living_area: livingArea,
                utilities_cost: utilitiesCost,
                acquisition_commission_rate: acquisitionCommissionRate,
                project_management_cost: projectManagementCost,
                origination_points: originationPoints,
                lender_doc_fees: lenderDocFees,
                other_financial_costs: otherCosts,
                realtor_commission_rate: realtorCommissionRate,
                closing_date: closingDate,
                flip_results: {
                    total_cash_required: totalCashRequired,
                    net_profit: finalNetProfit,
                    roi: roi,
                    direct_costs_subtotal: subtotalDirectCosts,
                    financial_costs_subtotal: subtotalFinancialCosts
                }
            }
        });
    }, [
        purchasePrice, repairs, arv, closingDate, livingArea, projectMonths, loanInterestRate,
        originationPoints, realtorCommissionRate, utilitiesCost, acquisitionCommissionRate,
        projectManagementCost, titleClosingCost, insuranceCost, otherCosts, lenderDocFees,
        address, // Added address to dependency
        data?.id
    ]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* --- TOP SECTION: ADDRESS & SUMMARY --- */}
            <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 grid gap-4">
                    <div className="bg-blue-200/50 dark:bg-blue-900/50 p-2 rounded-md font-bold text-center text-blue-900 dark:text-blue-100 uppercase tracking-widest text-sm">
                        Análisis de Flip & Fix
                    </div>
                    <div className="grid gap-2">
                        <Label className="font-bold text-xs uppercase text-blue-900 dark:text-blue-200">Dirección</Label>
                        <AddressAutocomplete
                            value={address}
                            onChange={setAddress}
                            onSelect={(val) => setAddress(val)}
                            label={null}
                            className="font-bold text-md bg-background border-input"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* --- LEFT COLUMN: INPUTS --- */}
                <div className="space-y-6">
                    {/* KEY METRICS */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden">
                            <TableLikeRow label="Precio de compra" value={purchasePrice} onChange={setPurchasePrice} currency />
                            <TableLikeRow label="Reparaciones" value={repairs} onChange={setRepairs} currency />
                            <TableLikeRow label="Precio de venta - ARV" value={arv} onChange={setArv} currency bg="bg-blue-50 dark:bg-blue-900/20" />
                            <TableLikeRow label="Fecha de cierre" value={closingDate} isDate onChange={(v: any) => setClosingDate(String(v))} />
                        </CardContent>
                    </Card>

                    {/* DETAILS */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden text-sm">
                            <TableLikeRow label="Area (Living area) SFT" value={livingArea} onChange={setLivingArea} />
                            <div className="flex justify-between p-2 px-3 border-b bg-muted/20">
                                <span>Costo remodelación / reparacion x Sft</span>
                                <span className="font-bold">${costPerSqFt.toFixed(0)}</span>
                            </div>
                            <TableLikeRow label="Tiempo estimado (meses)" value={projectMonths} onChange={setProjectMonths} />
                            <div className="flex justify-between p-2 px-3 border-b bg-muted/20">
                                <span>Préstamo estimado (70% ARV)</span>
                                <span className="font-bold">${loanAmount.toLocaleString()}</span>
                            </div>
                            <TableLikeRow label="Interés anual %" value={loanInterestRate} onChange={setLoanInterestRate} isPercent />
                            <TableLikeRow label="Originación - Lender points %" value={originationPoints} onChange={setOriginationPoints} isPercent />
                            <TableLikeRow label="Comision Realtor (venta ARV) %" value={realtorCommissionRate} onChange={setRealtorCommissionRate} isPercent />

                            <div className="flex justify-between p-2 px-3 bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                                <span className="text-xs uppercase max-w-[200px] text-slate-700 dark:text-slate-300">Inversion propia<br />(Down pmt + cierre + diff reparaciones)</span>
                                <span className="text-lg text-slate-900 dark:text-white">${totalCashRequired.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* BREAKDOWN - DIRECT COSTS */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden text-sm">
                            <div className="bg-slate-200 dark:bg-slate-800 p-2 font-bold text-center text-xs uppercase border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">Análisis Desglosado</div>
                            <div className="bg-slate-100 dark:bg-slate-900 p-2 flex justify-between font-bold border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                <span>Concepto</span>
                                <span>USD</span>
                            </div>
                            <div className="p-2 flex justify-between font-bold bg-blue-50 dark:bg-blue-950/30 border-b dark:border-slate-800 text-slate-800 dark:text-slate-200">
                                <span>Precio de venta</span>
                                <span>{arv.toLocaleString()}</span>
                            </div>

                            <div className="bg-slate-300 dark:bg-slate-700 p-1 px-3 font-bold text-xs uppercase mt-2 text-slate-800 dark:text-slate-100">Costos Directos (CD)</div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                <DisplayRow label="Precio de compra" value={purchasePrice} colorClass="text-red-600 dark:text-red-400" />
                                <TableLikeRow label="Servicios publicos (agua, luz)" value={utilitiesCost} onChange={setUtilitiesCost} colorClass="text-red-600 dark:text-red-400" />
                                <DisplayRow label="Costos remodelación / reparación" value={repairs} colorClass="text-red-600 dark:text-red-400" />
                                <div className="grid grid-cols-[1fr_80px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="p-2 px-3 flex items-center gap-2">
                                        <span className="text-slate-700 dark:text-white font-medium">Comisión por adquisición</span>
                                        <Input
                                            className="w-12 h-6 text-xs p-1 bg-background border-input focus:ring-1 focus:ring-ring"
                                            value={acquisitionCommissionRate}
                                            onChange={e => setAcquisitionCommissionRate(Number(e.target.value))}
                                        />
                                        <span className="text-muted-foreground">%</span>
                                    </div>
                                    <div className="p-2 px-3 text-right font-bold text-red-600 dark:text-red-400">
                                        {acquisitionCommission.toLocaleString()}
                                    </div>
                                </div>
                                <TableLikeRow label="Administración de proyecto" value={projectManagementCost} onChange={setProjectManagementCost} colorClass="text-red-600 dark:text-red-400" />
                                <TableLikeRow label="Title closing cost" value={titleClosingCost} onChange={setTitleClosingCost} colorClass="text-red-600 dark:text-red-400" />
                                <TableLikeRow label="Seguro" value={insuranceCost} onChange={setInsuranceCost} colorClass="text-red-600 dark:text-red-400" />
                            </div>

                            <div className="flex justify-between p-2 px-3 bg-slate-100 dark:bg-slate-800 font-bold border-t border-slate-300 dark:border-slate-700">
                                <span className="text-slate-800 dark:text-slate-200">Subtotal</span>
                                <span className="text-blue-700 dark:text-blue-400">{subtotalDirectCosts.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between p-2 px-3 bg-green-100 dark:bg-green-900/40 font-bold border-t border-green-200 dark:border-green-800">
                                <span className="text-green-900 dark:text-green-100">Ganancia Bruta - Gross Profit</span>
                                <span className="text-green-800 dark:text-green-300">{grossProfit.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* BREAKDOWN - FINANCIAL COSTS */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden text-sm">
                            <div className="bg-slate-300 dark:bg-slate-700 p-1 px-3 font-bold text-xs uppercase text-slate-800 dark:text-slate-100">Costos Financieros (CF)</div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                <DisplayRow label="Intereses de préstamo" value={totalInterest} colorClass="text-red-600 dark:text-red-400" />
                                <TableLikeRow label="Otros costos" value={otherCosts} onChange={setOtherCosts} colorClass="text-red-600 dark:text-red-400" />
                                <DisplayRow label="Lender loan origination points" value={loanOriginationAmount} colorClass="text-red-600 dark:text-red-400" />
                                <TableLikeRow label="Lender Doc Fees" value={lenderDocFees} onChange={setLenderDocFees} colorClass="text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex justify-between p-2 px-3 bg-slate-100 dark:bg-slate-800 font-bold border-t border-slate-300 dark:border-slate-700">
                                <span className="text-slate-800 dark:text-slate-200">Subtotal CF</span>
                                <span className="text-blue-700 dark:text-blue-400">{subtotalFinancialCosts.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* REALTOR COMMISSION & NET */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden text-sm">
                            <div className="p-2 flex justify-between items-center text-red-600 dark:text-red-400 font-medium">
                                <span>Comision Realtor ({realtorCommissionRate}%)</span>
                                <span>{realtorCommissionAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between p-3 px-3 bg-green-200 dark:bg-green-900/60 font-bold text-lg border-t border-green-300 dark:border-green-800">
                                <span className="text-green-900 dark:text-green-100">Utilidad Neta</span>
                                <span className="text-green-900 dark:text-green-300">${finalNetProfit.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- RIGHT COLUMN: VISUALS --- */}
                <div className="space-y-6">
                    {/* INVESTMENT ANALYSIS BOX */}
                    <Card className="bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-0 text-sm">
                            <div className="bg-blue-200 dark:bg-blue-800 p-2 font-bold text-center text-blue-900 dark:text-blue-100 uppercase tracking-widest text-xs">
                                Análisis de inversión requerida
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between border-b border-blue-200 dark:border-blue-800 pb-1 text-slate-800 dark:text-slate-200">
                                    <span>ARV</span>
                                    <span className="font-bold">{arv.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-blue-200 dark:border-blue-800 pb-1 text-slate-800 dark:text-slate-200">
                                    <span>Purchase price</span>
                                    <span className="font-bold">{purchasePrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-blue-200 dark:border-blue-800 pb-1 text-slate-800 dark:text-slate-200">
                                    <span>LTV 70% (Loan)</span>
                                    <span className="font-bold">{loanAmount.toLocaleString()}</span>
                                </div>
                                <div className="py-2"></div>
                                <div className="flex justify-between text-muted-foreground text-xs">
                                    <span>Total loan amount</span>
                                    <span>{loanAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground text-xs">
                                    <span>Minus repairs</span>
                                    <span>{repairs.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-medium border-t border-dashed border-slate-300 dark:border-slate-700 pt-1 text-slate-800 dark:text-slate-200">
                                    <span>Sub total 1 (Loan for Purchase)</span>
                                    <span>{loanFundsForPurchase.toLocaleString()}</span>
                                </div>
                                <div className="py-2"></div>
                                <div className="flex justify-between font-medium text-slate-800 dark:text-slate-200">
                                    <span>Gastos de cierre al adquirir</span>
                                    <span>{closingCostsAtPurchase.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-medium text-slate-800 dark:text-slate-200">
                                    <span>Deposito inicial (Down Payment)</span>
                                    <span>{downPaymentRequired.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between p-2 bg-red-200/50 dark:bg-red-900/30 font-bold border rounded mt-2 border-red-300 dark:border-red-800">
                                    <span className="text-red-900 dark:text-red-200">Total estimado de fondos para cerrar</span>
                                    <span className="text-red-900 dark:text-red-200">${totalCashRequired.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* BIG ROI BLOCK */}
                    <div className="grid grid-cols-2 gap-1 h-24">
                        <div className="bg-blue-300/80 dark:bg-blue-700/50 flex items-center justify-center text-3xl font-black text-blue-900 dark:text-blue-100 border-2 border-black dark:border-slate-600">
                            ROI
                        </div>
                        <div className="bg-green-300/80 dark:bg-green-700/50 flex items-center justify-center text-3xl font-black text-green-900 dark:text-green-100 border-2 border-black dark:border-slate-600 border-l-0">
                            {roi.toFixed(0)}%
                        </div>
                    </div>

                    {/* CHARTS */}
                    <FlipFixCharts
                        totalInvestment={totalCashRequired}
                        netProfit={finalNetProfit}
                        directCosts={{
                            purchase: purchasePrice,
                            utilities: utilitiesCost,
                            rehab: repairs,
                            commission: acquisitionCommission,
                            management: projectManagementCost,
                            closing: titleClosingCost,
                            insurance: insuranceCost
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

// --- Helper Components ---

function TableLikeRow({ label, value, onChange, currency, isPercent, isDate, bg, colorClass }: any) {
    return (
        <div className={cn("grid grid-cols-[1fr_120px] items-center border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", bg)}>
            <div className="px-3 py-2 text-slate-700 dark:text-white font-medium truncate" title={label}>{label}</div>
            <div className="px-2 py-1">
                {isDate ? (
                    <Input
                        type="date"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className="h-7 text-right px-1 bg-background border-input hover:border-accent focus:border-ring rounded-sm"
                    />
                ) : currency ? (
                    <FormattedCurrencyInput
                        value={value}
                        onChange={onChange}
                        className={cn("h-7 text-right px-1 bg-background border-input hover:border-accent focus:border-ring rounded-sm font-bold", colorClass)}
                    />
                ) : (
                    <div className="relative">
                        <Input
                            type="number"
                            value={value}
                            onChange={e => onChange(Number(e.target.value))}
                            className={cn("h-7 text-right px-1 bg-background border-input hover:border-accent focus:border-ring rounded-sm font-bold", colorClass, isPercent && "pr-6")}
                        />
                        {isPercent && <span className="absolute right-1 top-1 text-xs text-muted-foreground">%</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

function DisplayRow({ label, value, colorClass }: any) {
    return (
        <div className="flex justify-between p-2 px-3">
            <span className="text-slate-700 dark:text-white font-medium">{label}</span>
            <span className={cn("font-medium", colorClass)}>{Number(value).toLocaleString()}</span>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
// import { CompsWidget } from "@/components/analyze/CompsWidget";

import { BrrrrChart } from "./brrrr-chart"; // Import from same directory (components)
import { SimpleTooltip } from "@/components/ui/simple-tooltip";
import { FormattedCurrencyInput } from "@/components/ui/formatted-currency-input";
import { AddressAutocomplete } from "@/components/properties/address-autocomplete";
import { BrrrrStrategyVisual } from "./brrrr-strategy-visual";
import { AiAdvisorControls, AiAdvisorResults } from "./ai-advisor";
import { generateDealAnalysis } from "../actions";
import {
    Calculator,
    Save,
    TrendingUp,
    DollarSign,
    Percent,
    Clock,
    Home,
    ArrowRight,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Loader2
} from "lucide-react";

export function AnalyzerForm({ initialData, mode = 'create' }: { initialData?: any, mode?: 'create' | 'edit' }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // --- State: UI ---
    const [activeTab, setActiveTab] = useState("buy");

    // --- State: AI Advisor ---
    const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiLanguage, setAiLanguage] = useState<"english" | "spanish">("spanish");

    const handleAiGenerate = async () => {
        setAiLoading(true);
        setAiError(null);
        try {
            const data = {
                purchasePrice,
                rehabBudget,
                arv,
                monthlyRent,
                monthlyCashFlow,
                refiLoanAmount,
                cashLeftInDeal,
                cashOnCash: cocReturn,
                address
            };
            const result = await generateDealAnalysis(data);
            if (result.error) {
                console.error("Analysis failed:", result.error);
                setAiError(result.error);
            } else {
                setAiAnalysis(result.data);
            }
        } catch (e: any) {
            console.error(e);
            setAiError(e.message || "An unexpected error occurred");
        } finally {
            setAiLoading(false);
        }
    };

    // --- State: Buy & Rehab ---
    const [address, setAddress] = useState(initialData?.address || "");
    const [purchasePrice, setPurchasePrice] = useState(initialData?.purchase_price || 0);
    const [closingCostsBuy, setClosingCostsBuy] = useState(initialData?.financials?.closing_costs_buy || (mode === 'edit' ? 3000 : 0));
    const [rehabBudget, setRehabBudget] = useState(initialData?.financials?.rehab_cost || 0);
    const [projectDuration, setProjectDuration] = useState(initialData?.financials?.project_duration_months || (mode === 'edit' ? 4 : 0));

    // --- State: Initial Financing ---
    const [downPaymentPercent, setDownPaymentPercent] = useState(initialData?.financials?.loan_down_payment_pct || (mode === 'edit' ? 20 : 0));
    const [interestRateInitial, setInterestRateInitial] = useState(initialData?.financials?.loan_interest_rate || (mode === 'edit' ? 10 : 0));

    // --- State: Refinance ---
    const [arv, setArv] = useState(initialData?.arv_estimate || 0);
    const [refiLtv, setRefiLtv] = useState(initialData?.financials?.refinance_ltv || 75);
    const [refiRate, setRefiRate] = useState(initialData?.financials?.refinance_rate || 7.0);
    const [closingCostsRefi, setClosingCostsRefi] = useState(initialData?.financials?.closing_costs_refi || (mode === 'edit' ? 3000 : 0));

    // --- State: Expenses ---
    const [monthlyRent, setMonthlyRent] = useState(initialData?.financials?.monthly_rent || 0);
    const [propertyTaxYear, setPropertyTaxYear] = useState(initialData?.financials?.taxes_annual || 0);
    const [insuranceYear, setInsuranceYear] = useState(initialData?.financials?.insurance_annual || 0);
    const [hoaMonth, setHoaMonth] = useState(initialData?.financials?.hoa_monthly || 0);
    const [utilitiesMonth, setUtilitiesMonth] = useState(initialData?.financials?.utilities_monthly || 0);
    const [vacancyRate, setVacancyRate] = useState(initialData?.financials?.vacancy_rate || 5);
    const [capexRate, setCapexRate] = useState(initialData?.financials?.capex_rate || 5);
    const [managementRate, setManagementRate] = useState(initialData?.financials?.management_rate || 8);
    const [marketingCost, setMarketingCost] = useState(0);

    // Initialize AI Analysis from saved data if available
    useEffect(() => {
        if (initialData?.ai_analysis_json) {
            setAiAnalysis(initialData.ai_analysis_json);
        }
    }, [initialData]);

    // --- Derived Math ---
    // ... [Math remains unchanged] 
    const downPaymentAmount = purchasePrice * (downPaymentPercent / 100);
    const loanAmountInitial = purchasePrice - downPaymentAmount;
    const monthlyInterestInitial = (loanAmountInitial * (interestRateInitial / 100)) / 12;
    const totalHoldingCosts = monthlyInterestInitial * projectDuration;
    const totalCashInvested = downPaymentAmount + closingCostsBuy + rehabBudget + totalHoldingCosts;
    const totalCostBasis = purchasePrice + closingCostsBuy + rehabBudget + totalHoldingCosts;
    const refiLoanAmount = arv * (refiLtv / 100);
    const cashLeftInDeal = (totalCostBasis + closingCostsRefi) - refiLoanAmount;

    // Operating (Post-Refi)
    const monthlyRefiPrincipalInterest = (refiLoanAmount * (refiRate / 100 / 12)) / (1 - Math.pow(1 + (refiRate / 100 / 12), -360));
    const monthlyTaxes = propertyTaxYear / 12;
    const monthlyInsurance = insuranceYear / 12;
    const monthlyVacancy = monthlyRent * (vacancyRate / 100);
    const monthlyCapex = monthlyRent * (capexRate / 100);
    const monthlyManagement = monthlyRent * (managementRate / 100);

    // Total Operating Expenses
    const totalOperatingExpenses = monthlyTaxes + monthlyInsurance + monthlyVacancy + monthlyCapex + monthlyManagement + hoaMonth + utilitiesMonth + marketingCost;
    const netOperatingIncome = monthlyRent - totalOperatingExpenses;

    const totalMonthlyExpenses = totalOperatingExpenses + monthlyRefiPrincipalInterest;
    const monthlyCashFlow = monthlyRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    const cocReturn = (cashLeftInDeal <= 0 && totalCostBasis > 0 && annualCashFlow > 0)
        ? 999
        : (cashLeftInDeal > 0)
            ? (annualCashFlow / cashLeftInDeal) * 100
            : 0;
    const dscr = monthlyRefiPrincipalInterest > 0 ? (netOperatingIncome / monthlyRefiPrincipalInterest) : 0;

    // ... [Score logic same] ...

    // --- Demo Data ---


    const handleSave = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Insert/Update Property
            const propertyData = {
                user_id: user.id,
                address: address || "Untitled Deal",
                purchase_price: purchasePrice,
                arv_estimate: arv,
                status: 'analyzing',
                ai_analysis_json: aiAnalysis // SAVE AI DATA
            };

            let propertyId = initialData?.id;

            if (mode === 'create') {
                const { data: prop, error: propError } = await supabase.from('properties').insert(propertyData).select().single();
                if (propError) throw propError;
                propertyId = prop.id;
            } else {
                const { error: propError } = await supabase.from('properties').update(propertyData).eq('id', propertyId);
                if (propError) throw propError;
            }

            // 2. Insert/Update Financials
            const financialsData = {
                property_id: propertyId,
                rehab_cost: rehabBudget,
                monthly_rent: monthlyRent,
                taxes_annual: propertyTaxYear,
                insurance_annual: insuranceYear,
                vacancy_rate: vacancyRate,
                capex_rate: capexRate,
                management_rate: managementRate,
                refinance_rate: refiRate,
                refinance_ltv: refiLtv,

                // NEW FIELDS
                closing_costs_buy: closingCostsBuy,
                closing_costs_refi: closingCostsRefi,
                loan_down_payment_pct: downPaymentPercent,
                loan_interest_rate: interestRateInitial,
                project_duration_months: projectDuration,
                hoa_monthly: hoaMonth,
                utilities_monthly: utilitiesMonth
            };

            if (mode === 'create') {
                const { error: finError } = await supabase.from('financials').insert(financialsData);
                if (finError) throw finError;
                router.push(`/dashboard/saved-deals`);
            } else {
                // FIXED: Manual check to avoid duplicates if unique constraint is missing
                const { data: existingFin } = await supabase
                    .from('financials')
                    .select('id')
                    .eq('property_id', propertyId)
                    .maybeSingle();

                if (existingFin) {
                    const { error: finError } = await supabase
                        .from('financials')
                        .update(financialsData)
                        .eq('id', existingFin.id);
                    if (finError) throw finError;
                } else {
                    const { error: finError } = await supabase
                        .from('financials')
                        .insert(financialsData);
                    if (finError) throw finError;
                }
            }

            alert("Deal Saved Successfully! 🚀");
        } catch (error: any) {
            console.error("Save failed:", error);
            alert("Error saving deal: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Property Analyzer</h2>
                    <p className="text-muted-foreground">Calculate metrics for your next BRRRR investment.</p>
                </div>
                <div className="flex gap-2">

                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save Analysis
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                {/* --- LEFT SIDEBAR (INPUTS) --- */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <Card className="flex-1 border-0 shadow-xl flex flex-col overflow-hidden bg-card text-card-foreground">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <div className="px-6 pt-6">
                                <TabsList className="grid w-full grid-cols-5 bg-muted p-1 rounded-lg border border-border">
                                    <TabsTrigger value="buy" className="val-tab text-[10px] sm:text-xs">BUY</TabsTrigger>
                                    <TabsTrigger value="refi" className="val-tab text-[10px] sm:text-xs">REFI</TabsTrigger>
                                    <TabsTrigger value="expense" className="val-tab text-[10px] sm:text-xs">EXP</TabsTrigger>
                                    <TabsTrigger value="strategy" className="val-tab text-[10px] sm:text-xs font-bold text-indigo-600">STRATEGY</TabsTrigger>
                                    <TabsTrigger value="ai-advisor" className="val-tab text-[10px] sm:text-xs font-bold text-violet-600 flex gap-1 items-center">
                                        <div className="bg-violet-600 text-[8px] px-1 rounded text-white leading-none py-0.5">AI</div>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto max-h-[600px]">
                                {/* --- TAB 1: BUY --- */}
                                <TabsContent value="buy" className="space-y-5 mt-0">
                                    {/* ... existing buy content ... */}
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label>Property Address</Label>
                                            <AddressAutocomplete
                                                value={address}
                                                onChange={setAddress}
                                                onSelect={(addr) => {
                                                    setAddress(addr);
                                                }}
                                                label={null}
                                                placeholder="123 Main St (Auto-complete)"
                                                className="input-light"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>Purchase Price</Label>
                                            <FormattedCurrencyInput
                                                value={purchasePrice}
                                                onChange={setPurchasePrice}
                                                placeholder="e.g. 150,000"
                                                className="h-11 text-lg font-semibold input-light"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>Closing Costs (Buy)</Label>
                                            <FormattedCurrencyInput
                                                value={closingCostsBuy}
                                                onChange={setClosingCostsBuy}
                                                placeholder="e.g. 3,000"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <LabelWithTooltip label="Rehab Budget" tooltip="Estimated costs for repairs and renovations. Use the AI Estimator if unsure." />
                                            <FormattedCurrencyInput
                                                value={rehabBudget}
                                                onChange={setRehabBudget}
                                                icon={HammerIcon}
                                                placeholder="e.g. 40,000"
                                                className="h-11 text-lg font-semibold input-light"
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <h4 className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Initial Financing</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label>Down Pmt %</Label>
                                                    <div className="relative">
                                                        <Input className="pr-8 h-11 text-lg font-semibold input-light" type="number" placeholder="20" value={downPaymentPercent === 0 ? "" : downPaymentPercent} onChange={e => setDownPaymentPercent(Number(e.target.value))} />
                                                        <Percent className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Int. Rate %</Label>
                                                    <div className="relative">
                                                        <Input className="pr-8 h-11 text-lg font-semibold input-light" type="number" placeholder="10" value={interestRateInitial === 0 ? "" : interestRateInitial} onChange={e => setInterestRateInitial(Number(e.target.value))} />
                                                        <Percent className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* --- TAB 2: REFI --- */}
                                <TabsContent value="refi" className="space-y-6 mt-0">
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <Label>ARV</Label>
                                            <FormattedCurrencyInput
                                                value={arv}
                                                onChange={setArv}
                                                placeholder="e.g. 275,000"
                                                className="h-11 text-lg font-semibold input-light"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5 flex flex-col">
                                                <div className="h-10 flex items-end pb-1"><LabelWithTooltip label="Max LTV %" tooltip="Loan-to-Value ratio. Most BRRRR lenders refinance at 70-75% of the new appraised value (ARV)." /></div>
                                                <Input className="input-light" type="number" placeholder="75" value={refiLtv === 0 ? "" : refiLtv} onChange={e => setRefiLtv(Number(e.target.value))} />
                                                <p className="text-[10px] text-muted-foreground text-right">{refiLtv > 80 ? "⚠️ High LTV" : "Standard: 75%"}</p>
                                            </div>
                                            <div className="space-y-1.5 flex flex-col">
                                                <div className="h-10 flex items-end pb-1"><Label>New Rate %</Label></div>
                                                <Input className="input-light" type="number" placeholder="7.0" value={refiRate === 0 ? "" : refiRate} onChange={e => setRefiRate(Number(e.target.value))} step={0.1} />
                                            </div>
                                        </div>

                                        <div className="bg-muted/50 p-3 rounded-lg border border-dashed border-slate-200 mt-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground font-medium">Est. Refi Payment (P&I):</span>
                                                <span className="font-bold text-foreground text-base">${Math.round(monthlyRefiPrincipalInterest).toLocaleString()}/mo</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                                Based on {refiLtv}% LTV loan at {refiRate}%
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* --- TAB 3: EXPENSES --- */}
                                <TabsContent value="expense" className="space-y-6 mt-0">
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <Label>Monthly Rent</Label>
                                            <FormattedCurrencyInput
                                                value={monthlyRent}
                                                onChange={setMonthlyRent}
                                                placeholder="e.g. 2,200"
                                                className="h-11 text-lg font-semibold input-light"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="taxes" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Property Taxes / Yr</Label>
                                            <Input className="input-light" type="number" placeholder="e.g. 2500" value={propertyTaxYear === 0 ? "" : propertyTaxYear} onChange={e => setPropertyTaxYear(Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="insurance" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Insurance / Yr</Label>
                                            <Input className="input-light" type="number" placeholder="e.g. 1200" value={insuranceYear === 0 ? "" : insuranceYear} onChange={e => setInsuranceYear(Number(e.target.value))} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <LabelWithTooltip label="HOA / mo" tooltip="Homeowners Association fees. 0 if none." />
                                            <Input className="input-light" type="number" placeholder="0" value={hoaMonth === 0 ? "" : hoaMonth} onChange={e => setHoaMonth(Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <LabelWithTooltip label="Utilities / mo" tooltip="Landlord paid utilities (Water, Sewer, Garbage). Tenant pays Electric/Gas usually." />
                                            <Input className="input-light" type="number" placeholder="0" value={utilitiesMonth === 0 ? "" : utilitiesMonth} onChange={e => setUtilitiesMonth(Number(e.target.value))} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1.5 flex flex-col">
                                            <div className="h-10 flex items-end pb-1"><LabelWithTooltip label="Vacancy %" tooltip="Standard is 5-8%." /></div>
                                            <Input className="input-light" type="number" placeholder="5" value={vacancyRate === 0 ? "" : vacancyRate} onChange={e => setVacancyRate(Number(e.target.value))} />
                                            <p className="text-[9px] text-muted-foreground text-right">Standard: 5-8%</p>
                                        </div>
                                        <div className="space-y-1.5 flex flex-col">
                                            <div className="h-10 flex items-end pb-1"><LabelWithTooltip label="Maint/CapEx %" tooltip="Reserve for repairs and capital expenditures (Roof, HVAC). Suggest 5-10%." /></div>
                                            <Input className="input-light" type="number" placeholder="5" value={capexRate === 0 ? "" : capexRate} onChange={e => setCapexRate(Number(e.target.value))} />
                                            <p className="text-[9px] text-muted-foreground text-right">Rec: 5-10%</p>
                                        </div>
                                        <div className="space-y-1.5 flex flex-col">
                                            <div className="h-10 flex items-end pb-1"><LabelWithTooltip label="Mgmt %" tooltip="Property Management fee. Typically 8-10%." /></div>
                                            <Input className="input-light" type="number" placeholder="8" value={managementRate === 0 ? "" : managementRate} onChange={e => setManagementRate(Number(e.target.value))} />
                                            <p className="text-[9px] text-muted-foreground text-right">Typ: 8-10%</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* --- TAB 4: STRATEGY --- */}
                                <TabsContent value="strategy" className="space-y-6 mt-0">
                                    <BrrrrStrategyVisual
                                        purchasePrice={purchasePrice}
                                        rehabBudget={rehabBudget}
                                        arv={arv}
                                        monthlyCashFlow={monthlyCashFlow}
                                        refiLoanAmount={refiLoanAmount}
                                        cashLeftInDeal={cashLeftInDeal}
                                    />
                                </TabsContent>

                                {/* --- TAB 5: AI ADVISOR (Controls) --- */}
                                <TabsContent value="ai-advisor" className="space-y-6 mt-0">
                                    <AiAdvisorControls
                                        onGenerate={handleAiGenerate}
                                        isLoading={aiLoading}
                                        error={aiError}
                                        hasAnalysis={!!aiAnalysis}
                                        language={aiLanguage}
                                        setLanguage={setAiLanguage}
                                    />
                                </TabsContent>

                            </div>
                        </Tabs>

                        {/* --- FOOTER --- */}
                        <div className="bg-slate-950 text-white p-6 space-y-5 rounded-md shadow-inner border border-slate-800">
                            {/* Cash Flow */}
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3 border-dashed">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold opacity-60 uppercase tracking-widest">Cash Flow / Mo</span>
                                    {monthlyCashFlow < 0 && (
                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase">Negative</Badge>
                                    )}
                                    {monthlyCashFlow > 0 && monthlyCashFlow < 200 && (
                                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 h-5 px-1.5 text-[10px] uppercase">Low</Badge>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-2xl font-black tabular-nums tracking-tight",
                                    monthlyCashFlow < 0 ? "text-red-500" :
                                        monthlyCashFlow < 200 ? "text-yellow-400" : "text-emerald-400"
                                )}>
                                    {monthlyCashFlow < 0 ? "-" : ""}${Math.abs(Math.round(monthlyCashFlow)).toLocaleString()}
                                </span>
                            </div>

                            {/* CoC Return */}
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3 border-dashed">
                                <span className="text-xs font-extrabold opacity-60 uppercase tracking-widest">CoC Return</span>
                                <div className="flex items-center gap-2">
                                    {cocReturn >= 999 && (
                                        <Badge className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white border-none animate-pulse">
                                            🚀 INFINITE
                                        </Badge>
                                    )}
                                    <span className={cn(
                                        "text-2xl font-black tabular-nums tracking-tight",
                                        cocReturn < 0 ? "text-red-500" :
                                            cocReturn > 20 ? "text-emerald-400" :
                                                cocReturn > 10 ? "text-emerald-200" : "text-yellow-400"
                                    )}>
                                        {isFinite(cocReturn) ? cocReturn.toFixed(1) : "∞"}%
                                    </span>
                                </div>
                            </div>

                            {/* DSCR */}
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3 border-dashed">
                                <span className="text-xs font-extrabold opacity-60 uppercase tracking-widest">DSCR</span>
                                <div className="flex items-center gap-2">
                                    {dscr < 1.25 && (
                                        <SimpleTooltip content="Lenders typically require DSCR > 1.25">
                                            <AlertCircle className="h-3 w-3 text-orange-400 cursor-help" />
                                        </SimpleTooltip>
                                    )}
                                    <span className={cn(
                                        "text-2xl font-black tabular-nums tracking-tight",
                                        dscr < 1.0 ? "text-red-500" :
                                            dscr < 1.25 ? "text-yellow-400" : "text-emerald-400"
                                    )}>
                                        {dscr.toFixed(2)}x
                                    </span>
                                </div>
                            </div>

                            {/* Cash Left In */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-extrabold opacity-60 uppercase tracking-widest">Cash Left In</span>
                                <span className={cn(
                                    "text-2xl font-black tabular-nums tracking-tight",
                                    cashLeftInDeal > 20000 ? "text-orange-400" : "text-emerald-400"
                                )}>
                                    ${Math.round(cashLeftInDeal).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* --- RIGHT PANEL (RESULTS) --- */}
                {/* --- RIGHT PANEL (RESULTS) --- */}
                <div className="lg:col-span-8 space-y-6">
                    {activeTab === "ai-advisor" ? (
                        <div className="h-full">
                            <AiAdvisorResults analysis={aiAnalysis} language={aiLanguage} />
                            {!aiAnalysis && !aiLoading && !aiError && (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4 pt-20">
                                    <div className="bg-slate-900/50 p-6 rounded-full">
                                        <AlertCircle className="h-12 w-12" />
                                    </div>
                                    <p>Select "Generate Analysis" to view AI insights.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <BrrrrChart
                                initialArv={arv}
                                loanAmount={refiLoanAmount}
                                interestRate={refiRate}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <MetricCard title="Total Project Cost" value={totalCostBasis} icon={Home} />
                                <MetricCard title="Refi Loan Amount" value={refiLoanAmount} icon={DollarSign} />
                                <MetricCard title="Net Equity Created" value={arv - refiLoanAmount} icon={TrendingUp} highlight />
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}

function Label({ children, className, htmlFor }: { children: React.ReactNode, className?: string, htmlFor?: string }) {
    return <label htmlFor={htmlFor} className={cn("text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider", className)}>{children}</label>
}

const LabelWithTooltip = ({ label, tooltip }: { label: string, tooltip: string }) => (
    <div className="flex items-center gap-1.5">
        <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{label}</label>
        <SimpleTooltip content={tooltip}>
            <AlertCircle className="h-3 w-3 text-muted-foreground/50 hover:text-primary cursor-help" />
        </SimpleTooltip>
    </div>
);

function MetricCard({ title, value, icon: Icon, highlight }: any) {
    return (
        <Card className={`${highlight ? 'border-emerald-500/20 bg-emerald-500/10' : 'bg-card'}`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className={`text-sm font-medium ${highlight ? 'text-emerald-500 font-bold' : 'text-muted-foreground'}`}>{title}</p>
                    <Icon className={`h-4 w-4 ${highlight ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                </div>
                <div className={`text-2xl font-bold ${highlight ? 'text-emerald-500' : 'text-foreground'}`}>${Math.round(value).toLocaleString()}</div>
            </CardContent>
        </Card>
    );
}

function HammerIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
            <path d="M17.64 15 22 10.64" />
            <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25V7.86c0-.55-.45-1-1-1H14.5c-.85 0-1.65-.33-2.25-.93L11 4.71" />
            <path d="M6.8 2 2 6.8" />
        </svg>
    )
}

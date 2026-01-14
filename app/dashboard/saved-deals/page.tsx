"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Home, DollarSign, TrendingUp, Calendar, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addToPortfolio } from "../properties/actions";

export default function SavedDealsPage() {
    const supabase = createClient();
    const router = useRouter();
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch properties with status 'analyzing' and join financials
            // Note: Supabase JS join syntax depends on foreign key relations. 
            // 'properties' has 'id'. 'financials' refers to 'property_id'.
            // Simple approach: Fetch properties, then fetch financials separately or use select.

            const { data: properties, error } = await supabase
                .from('properties')
                .select(`
                    *,
                    financials (*)
                `)
                .eq('user_id', user.id)
                .in('status', ['analyzing', 'lead'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDeals(properties || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this analysis? This cannot be undone.")) return;

        try {
            const { error } = await supabase.from('properties').delete().eq('id', id);
            if (error) throw error;
            // Optimistic update
            setDeals(deals.filter(d => d.id !== id));
        } catch (error: any) {
            console.error("Error deleting deal:", error);
            alert("Error deleting deal");
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Saved Analyses</h1>
                    <p className="text-muted-foreground">Your deal pipeline and underwriting scenarios.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/analyze')} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> New Analysis
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading deals...</div>
            ) : deals.length === 0 ? (
                <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-gray-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No saved deals yet</h3>
                    <p className="text-gray-500 max-w-sm mt-2 mb-6">Start by running a new BRRRR analysis to see if the numbers work.</p>
                    <Button onClick={() => router.push('/dashboard/analyze')}>Start Analysis</Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deals.map(deal => {
                        // --- CALCULATE METRICS ---
                        const financials = deal.financials?.[0] || {};

                        // 1. Cash Flow
                        const rent = financials.monthly_rent || 0;
                        // Estimate expenses if missing: Tax (1.2%), Ins (0.5%), Vacancy (5%), Capex (5%), Mgmt (8%)
                        // But let's use stored values if available
                        const taxesMo = (financials.taxes_annual || (deal.purchase_price * 0.012)) / 12;
                        const insuranceMo = (financials.insurance_annual || (deal.purchase_price * 0.005)) / 12;
                        const vacancy = rent * ((financials.vacancy_rate || 5) / 100);
                        const capex = rent * ((financials.capex_rate || 5) / 100);
                        const mgmt = rent * ((financials.management_rate || 8) / 100);
                        const hoa = financials.hoa_monthly || 0;
                        const utils = financials.utilities_monthly || 0;

                        // Debt Service (Refi)
                        const arv = deal.arv_estimate || deal.purchase_price;
                        const refiLoan = arv * ((financials.refinance_ltv || 75) / 100);
                        const rate = financials.refinance_rate || 7.0;
                        const r = rate / 100 / 12;
                        const mortgage = refiLoan > 0 ? (refiLoan * r) / (1 - Math.pow(1 + r, -360)) : 0;

                        const totalExpenses = taxesMo + insuranceMo + vacancy + capex + mgmt + hoa + utils + mortgage;
                        const cashFlow = rent - totalExpenses;

                        // 2. CoC Return
                        // Cash Invested = Down + Closing + Rehab - (RefiLoan - Payoff) approx?
                        // Simplified: Cash Left In Deal logic
                        const purchase = deal.purchase_price || 0;
                        const rehab = financials.rehab_cost || 0;
                        const closingBuy = financials.closing_costs_buy || 3000;
                        const holding = (purchase * 0.8 * 0.1 / 12) * 4; // Mock holding costs
                        const totalCost = purchase + rehab + closingBuy + holding;
                        const cashLeft = (totalCost + (financials.closing_costs_refi || 3000)) - refiLoan;

                        const coc = cashLeft > 0 ? ((cashFlow * 12) / cashLeft) * 100 : 999;
                        const equity = arv - refiLoan;

                        return (
                            <Card
                                key={deal.id}
                                className="group hover:shadow-lg transition-all cursor-pointer border-indigo-100/50 overflow-hidden bg-card"
                                onClick={() => router.push(`/dashboard/analyze/${deal.id}`)}
                            >
                                <div className={`h-2 w-full ${cashFlow > 0 ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg truncate">{deal.address || "Untitled Deal"}</h3>
                                            <p className="text-sm text-muted-foreground">{new Date(deal.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/50">Details</Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold">Price</p>
                                                <p className="font-semibold">${deal.purchase_price?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold">ARV</p>
                                                <p className="font-semibold">${deal.arv_estimate?.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm border-b border-dashed border-border pb-2">
                                                <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Cash Flow</span>
                                                <span className={`font-bold ${cashFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {cashFlow < 0 ? '-' : '+'}${Math.abs(Math.round(cashFlow)).toLocaleString()}/mo
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm border-b border-dashed border-border pb-2">
                                                <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> CoC Return</span>
                                                <span className={`font-bold ${coc > 15 ? 'text-emerald-600' : 'text-yellow-600'}`}>
                                                    {coc >= 999 ? '∞' : `${coc.toFixed(1)}%`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1"><Home className="w-3 h-3" /> Est. Equity</span>
                                                <span className="font-bold text-indigo-600">
                                                    ${Math.round(equity).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/analyze/${deal.id}`);
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Move this deal to your active Portfolio?")) {
                                                        await addToPortfolio(deal.id);
                                                    }
                                                }}
                                            >
                                                <Home className="w-3 h-3 mr-1" /> Portfolio
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-muted-foreground hover:text-red-600"
                                                onClick={(e) => handleDelete(e, deal.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

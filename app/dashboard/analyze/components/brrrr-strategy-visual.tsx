"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Hammer, Home, Key, RefreshCw, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrrrrStrategyVisualProps {
    purchasePrice: number;
    rehabBudget: number;
    arv: number;
    refiLoanAmount: number;
    cashLeftInDeal: number;
    monthlyCashFlow: number;
}

export function BrrrrStrategyVisual({
    purchasePrice,
    rehabBudget,
    arv,
    refiLoanAmount,
    cashLeftInDeal,
    monthlyCashFlow
}: BrrrrStrategyVisualProps) {

    const steps = [
        {
            id: 'buy',
            label: 'BUY',
            icon: Home,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            description: 'Purchase distressed property',
            value: purchasePrice,
            detail: 'Purchase Price'
        },
        {
            id: 'rehab',
            label: 'REHAB',
            icon: Hammer,
            color: 'bg-orange-500',
            textColor: 'text-orange-600',
            description: 'Add value through renovation',
            value: rehabBudget,
            detail: 'Rehab Budget'
        },
        {
            id: 'rent',
            label: 'RENT',
            icon: Key,
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
            description: 'Place tenant & cash flow',
            value: monthlyCashFlow,
            detail: 'Est. Cash Flow',
            isMonthly: true
        },
        {
            id: 'refinance',
            label: 'REFINANCE',
            icon: DollarSign,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-600',
            description: 'Pull cash out at new value',
            value: refiLoanAmount,
            detail: 'New Loan (75% ARV)'
        },
        {
            id: 'repeat',
            label: 'REPEAT',
            icon: RefreshCw,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-600',
            description: 'Use capital for next deal',
            value: cashLeftInDeal,
            detail: 'Cash Left In Deal',
            highlight: true
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative group">
                        {/* Connecting Line (Desktop) */}
                        {index < steps.length - 1 && (
                            <div className="absolute left-6 top-10 bottom-[-20px] w-0.5 bg-border -z-10 group-last:hidden" />
                        )}

                        <Card className={cn(
                            "border-l-4 transition-all hover:shadow-md",
                            step.highlight ? "border-l-indigo-500 bg-indigo-50/10" : "border-l-transparent hover:border-l-primary/20"
                        )}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-sm text-white",
                                    step.color
                                )}>
                                    <step.icon className="h-6 w-6" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={cn("font-black tracking-widest text-sm uppercase", step.textColor)}>
                                            {index + 1}. {step.label}
                                        </h3>
                                        <div className="text-right">
                                            <span className="block font-bold text-lg tabular-nums">
                                                ${Math.round(step.value).toLocaleString('en-US')}
                                                {step.isMonthly && <span className="text-xs text-muted-foreground font-normal">/mo</span>}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider opacity-70">
                                                {step.detail}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{step.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 rounded-lg p-4 text-white flex items-center justify-between">
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Equity Created</h4>
                    <p className="text-xs text-slate-500">ARV - New Loan</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-emerald-400">
                        ${(arv - refiLoanAmount).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}

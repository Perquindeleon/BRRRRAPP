"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, Hammer, Percent, CalendarClock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function QuickTools() {
    return (
        <Card className="border-none shadow-md bg-card h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-indigo-500" />
                    Quick Tools
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs defaultValue="70rule" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="70rule" className="text-xs">70% Rule</TabsTrigger>
                        <TabsTrigger value="mortgage" className="text-xs">Mortgage</TabsTrigger>
                        <TabsTrigger value="roi" className="text-xs">ROI</TabsTrigger>
                    </TabsList>
                    <TabsContent value="70rule">
                        <Calculator70Percent />
                    </TabsContent>
                    <TabsContent value="mortgage">
                        <CalculatorMortgage />
                    </TabsContent>
                    <TabsContent value="roi">
                        <CalculatorROI />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

function Calculator70Percent() {
    const [arv, setArv] = useState<number | "">("");
    const [repairs, setRepairs] = useState<number | "">("");

    const arvVal = Number(arv) || 0;
    const repairsVal = Number(repairs) || 0;
    const mao = (arvVal * 0.70) - repairsVal;

    return (
        <div className="p-4 bg-muted/50 rounded-lg space-y-3 border border-border">
            <h4 className="font-semibold text-sm flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Offer Calc</span>
                Max Allowable Offer
            </h4>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">ARV</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground z-10" />
                        <Input
                            className="h-8 pl-6 text-xs"
                            placeholder="250,000"
                            type="number"
                            value={arv}
                            onChange={(e) => setArv(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Repairs</Label>
                    <div className="relative">
                        <Hammer className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                        <Input
                            className="h-8 pl-6 text-xs"
                            placeholder="40,000"
                            type="number"
                            value={repairs}
                            onChange={(e) => setRepairs(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            {mao > 0 && (
                <div className="pt-2 border-t border-dashed animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Max Offer:</span>
                        <span className="text-lg font-bold text-emerald-600">${mao.toLocaleString()}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground bg-muted p-2 rounded border border-border/50">
                        <span className="font-bold text-indigo-500">Why?</span> ARV x 70% - Repairs ensures 30% equity/profit.
                    </div>
                </div>
            )}
        </div>
    )
}

function CalculatorMortgage() {
    const [loan, setLoan] = useState<number | "">("");
    const [rate, setRate] = useState<number | "">("");
    const [years, setYears] = useState<number | "">(30);

    const loanVal = Number(loan) || 0;
    const rateVal = Number(rate) || 0;

    let pmt = 0;
    if (loanVal > 0 && rateVal > 0) {
        const r = rateVal / 100 / 12;
        const n = Number(years) * 12;
        pmt = (loanVal * r) / (1 - Math.pow(1 + r, -n));
    }

    return (
        <div className="p-4 bg-muted/50 rounded-lg space-y-3 border border-border">
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 col-span-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">Loan Amount</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                        <Input className="h-8 pl-6 text-xs" type="number" placeholder="200,000" value={loan} onChange={(e) => setLoan(Number(e.target.value))} />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Rate (%)</Label>
                    <div className="relative">
                        <Percent className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                        <Input className="h-8 pl-6 text-xs" type="number" placeholder="6.5" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Years</Label>
                    <div className="relative">
                        <CalendarClock className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                        <Input className="h-8 pl-6 text-xs" type="number" placeholder="30" value={years} onChange={(e) => setYears(Number(e.target.value))} />
                    </div>
                </div>
            </div>
            {pmt > 0 && (
                <div className="pt-2 border-t border-dashed overflow-hidden">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded shadow-sm">
                        <span className="text-xs font-medium">Monthly P&I:</span>
                        <span className="text-lg font-bold text-violet-600">${Math.round(pmt).toLocaleString()}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

function CalculatorROI() {
    const [profit, setProfit] = useState<number | "">("");
    const [invested, setInvested] = useState<number | "">("");

    const profitVal = Number(profit) || 0;
    const investedVal = Number(invested) || 0;
    const roi = investedVal > 0 ? (profitVal / investedVal) * 100 : 0;

    return (
        <div className="p-4 bg-muted/50 rounded-lg space-y-3 border border-border">
            <div className="space-y-2">
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Annual Profit (Cash Flow)</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                        <Input className="h-8 pl-6 text-xs" type="number" placeholder="5,000" value={profit} onChange={(e) => setProfit(Number(e.target.value))} />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Total Cash Invested</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                        <Input className="h-8 pl-6 text-xs" type="number" placeholder="25,000" value={invested} onChange={(e) => setInvested(Number(e.target.value))} />
                    </div>
                </div>
            </div>
            {roi > 0 && (
                <div className="pt-2 border-t border-dashed">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded shadow-sm">
                        <span className="text-xs font-medium">Annual ROI:</span>
                        <span className={`text-lg font-bold ${roi >= 12 ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {roi.toFixed(1)}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

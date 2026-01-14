"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Percent, DollarSign, Calculator } from "lucide-react";

export function QuickCalculatorsContent() {
    // 1% Rule State
    const [oneRulePrice, setOneRulePrice] = useState(100000);
    const [oneRuleRent, setOneRuleRent] = useState(1000);

    // 50% Rule State
    const [fiftyRent, setFiftyRent] = useState(1500);
    const [fiftyMortgage, setFiftyMortgage] = useState(600);

    // Cap Rate State
    const [capNoi, setCapNoi] = useState(12000);
    const [capPrice, setCapPrice] = useState(150000);

    // Calculations
    const oneResult = (oneRuleRent / oneRulePrice) * 100;
    const isOneGood = oneResult >= 1;

    const fiftyResult = (fiftyRent * 0.5) - fiftyMortgage;
    const isFiftyGood = fiftyResult > 200; // Arbitrary $200 threshold

    const capResult = (capNoi / capPrice) * 100;

    return (
        <div className="p-6">
            <Tabs defaultValue="one" className="w-full">
                <TabsList className="grid grid-cols-4 mb-6 bg-muted p-1">
                    <TabsTrigger value="seventy" className="text-xs">70% Rule</TabsTrigger>
                    <TabsTrigger value="one" className="text-xs">1% Rule</TabsTrigger>
                    <TabsTrigger value="fifty" className="text-xs">50% Rule</TabsTrigger>
                    <TabsTrigger value="cap" className="text-xs">Cap Rate</TabsTrigger>
                </TabsList>

                {/* 70% RULE */}
                <TabsContent value="seventy" className="space-y-4">
                    <Calculator70Percent />
                </TabsContent>

                {/* 1% RULE */}
                <TabsContent value="one" className="space-y-4">
                    <div className="space-y-2">
                        <Label>Purchase Price</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                            value={oneRulePrice}
                            onChange={(e) => setOneRulePrice(Number(e.target.value))}
                        >
                            <option value="" disabled className="bg-background text-foreground">Select Price</option>
                            {Array.from({ length: 200 }, (_, i) => {
                                const val = (i + 1) * 25000;
                                return (
                                    <option key={val} value={val} className="text-black dark:text-white bg-white dark:bg-slate-950">
                                        ${val.toLocaleString()}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Monthly Rent</Label>
                        <Input
                            type="number"
                            value={oneRuleRent}
                            onChange={(e) => setOneRuleRent(Number(e.target.value))}
                            className="text-foreground"
                        />
                    </div>
                    <div className={`mt-6 p-4 rounded-lg text-center ${isOneGood ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                        <p className="text-sm uppercase font-semibold">Rent to Price Ratio</p>
                        <p className="text-4xl font-bold my-2">{oneResult.toFixed(2)}%</p>
                        <p className="text-xs mb-2">{isOneGood ? "Passes the 1% Rule! ✅" : "Below 1% target. ⚠️"}</p>
                        <div className="text-[10px] mt-2 pt-2 border-t border-black/10">
                            <span className="font-bold">Why?</span> If monthly rent is ≥1% of purchase price, the property is likely to cash flow positively.
                        </div>
                    </div>
                </TabsContent>

                {/* 50% RULE */}
                <TabsContent value="fifty" className="space-y-4">
                    <p className="text-xs text-gray-500 mb-4">Estimates Cash Flow by assuming exps are 50% of rent.</p>
                    <div className="space-y-2">
                        <Label>Monthly Rent</Label>
                        <Input
                            type="number"
                            value={fiftyRent}
                            onChange={(e) => setFiftyRent(Number(e.target.value))}
                            className="text-foreground"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Mortgage Payment (P&I)</Label>
                        <Input
                            type="number"
                            value={fiftyMortgage}
                            onChange={(e) => setFiftyMortgage(Number(e.target.value))}
                            className="text-foreground"
                        />
                    </div>
                    <div className={`mt-6 p-4 rounded-lg text-center ${fiftyResult > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        <p className="text-sm uppercase font-semibold">Est. Cash Flow</p>
                        <p className="text-4xl font-bold my-2">${fiftyResult.toFixed(0)}</p>
                        <div className="text-[10px] mt-2 pt-2 border-t border-black/10">
                            <span className="font-bold">Why?</span> Assumes 50% of rent goes to expenses (taxes, repairs, vacancy). The remainder pays the mortgage. Positive = Good.
                        </div>
                    </div>
                </TabsContent>

                {/* CAP RATE */}
                <TabsContent value="cap" className="space-y-4">
                    <div className="space-y-2">
                        <Label>Net Operating Income (Annual)</Label>
                        <Input
                            type="number"
                            value={capNoi}
                            onChange={(e) => setCapNoi(Number(e.target.value))}
                            className="text-foreground"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Purchase Price</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                            value={capPrice}
                            onChange={(e) => setCapPrice(Number(e.target.value))}
                        >
                            <option value="" disabled className="bg-background text-foreground">Select Price</option>
                            {Array.from({ length: 200 }, (_, i) => {
                                const val = (i + 1) * 25000;
                                return (
                                    <option key={val} value={val} className="text-black dark:text-white bg-white dark:bg-slate-950">
                                        ${val.toLocaleString()}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div className="mt-6 p-4 rounded-lg text-center bg-blue-50 text-blue-700">
                        <p className="text-sm uppercase font-semibold">Cap Rate</p>
                        <p className="text-4xl font-bold my-2">{capResult.toFixed(2)}%</p>
                        <div className="text-[10px] mt-2 pt-2 border-t border-blue-200">
                            <span className="font-bold">Why?</span> Measures annual return on investment as if bought with all cash. &gt;5-8% is typically considered good.
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    );
}

function Calculator70Percent() {
    const [arv, setArv] = useState<number | "">("");
    const [repairs, setRepairs] = useState<number | "">("");

    const arvVal = Number(arv) || 0;
    const repairsVal = Number(repairs) || 0;
    const mao = (arvVal * 0.70) - repairsVal;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>ARV (After Repair Value)</Label>
                <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    value={arv}
                    onChange={(e) => setArv(Number(e.target.value))}
                >
                    <option value="" disabled className="bg-background text-foreground">Select ARV</option>
                    {Array.from({ length: 200 }, (_, i) => {
                        const val = (i + 1) * 25000;
                        return (
                            <option key={val} value={val} className="text-black dark:text-white bg-white dark:bg-slate-950">
                                ${val.toLocaleString()}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div className="space-y-2">
                <Label>Est. Repairs</Label>
                <Input
                    type="number"
                    value={repairs}
                    onChange={(e) => setRepairs(Number(e.target.value))}
                />
            </div>
            <div className={`mt-6 p-4 rounded-lg text-center ${mao > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                <p className="text-sm uppercase font-semibold">Max Allowable Offer (MAO)</p>
                <p className="text-4xl font-bold my-2">${mao.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mb-2">70% of ARV minus Repairs</p>
                <div className="text-[10px] mt-2 pt-2 border-t border-indigo-200/50 text-indigo-800/80">
                    <span className="font-bold">Why?</span> Does not exceed 70% of potential value minus rehab costs, leaving a 30% equity buffer for profit and safety.
                </div>
            </div>
        </div>
    );
}

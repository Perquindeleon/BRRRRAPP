"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BrrrrChartProps {
    initialArv: number;
    loanAmount: number;
    interestRate: number;
}

export function BrrrrChart({ initialArv, loanAmount, interestRate }: BrrrrChartProps) {
    // Generate 30-year projection data purely client-side for speed
    const data = [];
    const appreciationRate = 0.03; // 3% annual appreciation

    let currentPropertyValue = initialArv;
    let currentLoanBalance = loanAmount;

    // Simple annual amortization approximation
    const monthlyRate = interestRate / 100 / 12;
    const nMonths = 360;
    // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, nMonths)) / (Math.pow(1 + monthlyRate, nMonths) - 1);

    for (let year = 0; year <= 30; year++) {
        const equity = currentPropertyValue - currentLoanBalance;

        data.push({
            year: `Year ${year}`,
            PropertyValues: Math.round(currentPropertyValue),
            LoanBalance: Math.round(currentLoanBalance),
            Equity: Math.round(equity > 0 ? equity : 0),
        });

        // Advance one year
        currentPropertyValue = currentPropertyValue * (1 + appreciationRate);

        // Amortize loan for 12 months (simplified loop for visualization)
        for (let m = 0; m < 12; m++) {
            const interest = currentLoanBalance * monthlyRate;
            const principal = monthlyPayment - interest;
            currentLoanBalance -= principal;
            if (currentLoanBalance < 0) currentLoanBalance = 0;
        }
    }

    return (
        <Card className="h-[350px]">
            <CardHeader>
                <CardTitle>30-Year Wealth Projection (Equity vs Loan)</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 20,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="year" hide />
                        <YAxis
                            tickFormatter={(value) => `$${value / 1000}k`}
                            stroke="#94a3b8"
                            fontSize={12}
                        />
                        <Tooltip
                            formatter={(value: any) => [`$${value.toLocaleString()}`, ""]}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Area
                            type="monotone"
                            dataKey="Equity"
                            stackId="1"
                            stroke="#10b981"
                            fill="url(#colorEquity)"
                        />
                        <Area
                            type="monotone"
                            dataKey="LoanBalance"
                            stackId="2"
                            stroke="#6366f1"
                            fill="#818cf8"
                            fillOpacity={0.2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

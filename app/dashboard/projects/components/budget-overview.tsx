"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils"; // Assuming you have this or similar
import { AlertCircle, CheckCircle2, DollarSign, Wallet } from "lucide-react";

interface RehabItem {
    id: string;
    category: string;
    estimated_cost: number;
    actual_cost: number;
    status: string;
}

interface BudgetOverviewProps {
    rehabItems: RehabItem[];
    totalBudget?: number; // Optional overall budget limit if known
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export function BudgetOverview({ rehabItems, totalBudget }: BudgetOverviewProps) {

    // Calculate Totals
    const { totalEstimated, totalActual, byCategory } = useMemo(() => {
        let est = 0;
        let act = 0;
        const cats: Record<string, { estimated: number; actual: number }> = {};

        rehabItems.forEach(item => {
            est += item.estimated_cost || 0;
            act += item.actual_cost || 0;

            if (!cats[item.category]) cats[item.category] = { estimated: 0, actual: 0 };
            cats[item.category].estimated += item.estimated_cost || 0;
            cats[item.category].actual += item.actual_cost || 0;
        });

        // Convert to array for Recharts
        const byCategoryArray = Object.entries(cats).map(([name, data]) => ({
            name,
            value: data.estimated, // We typically chart the PLANNED budget breakdown
            actual: data.actual
        })).sort((a, b) => b.value - a.value);

        return { totalEstimated: est, totalActual: act, byCategory: byCategoryArray };
    }, [rehabItems]);

    const budgetUsedPercent = totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0;
    const isOverBudget = totalActual > totalEstimated;
    const remaining = totalEstimated - totalActual;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* METRIC CARD 1: Total Budget */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Estimated</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalEstimated)}</div>
                        <p className="text-xs text-muted-foreground">Planned expenses</p>
                    </CardContent>
                </Card>

                {/* METRIC CARD 2: Actual Spent */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <DollarSign className={`h-4 w-4 ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-emerald-600'}`}>
                            {formatCurrency(totalActual)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Progress value={Math.min(budgetUsedPercent, 100)} className={`h-2 ${isOverBudget ? 'bg-red-200' : ''}`} />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{Math.round(budgetUsedPercent)}%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* METRIC CARD 3: Remaining */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
                        {remaining < 0 ? <AlertCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-500' : ''}`}>
                            {formatCurrency(remaining)}
                        </div>
                        <p className="text-xs text-muted-foreground">Available to spend</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CHART: Budget Breakdown */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Budget Allocation</CardTitle>
                        <CardDescription>Breakdown by category (Estimated)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={byCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {byCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* LIST: Category Details */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Category Details</CardTitle>
                        <CardDescription>Planned vs Actual per category</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {byCategory.map((cat, idx) => {
                            const isCatOver = cat.actual > cat.value;
                            const percent = cat.value > 0 ? (cat.actual / cat.value) * 100 : 0;

                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="font-medium">{cat.name}</span>
                                        </div>
                                        <div className="flex gap-3 text-xs">
                                            <span className="text-muted-foreground">Est: {formatCurrency(cat.value)}</span>
                                            <span className={`font-semibold ${isCatOver ? 'text-red-500' : ''}`}>Act: {formatCurrency(cat.actual)}</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${isCatOver ? 'bg-red-500' : 'bg-primary'}`}
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

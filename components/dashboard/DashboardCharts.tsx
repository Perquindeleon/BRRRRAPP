"use client";

import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp, TrendingDown, DollarSign, Home,
    Activity, Wrench, ArrowRight, Building2, AlertTriangle,
} from "lucide-react";
import { RemindersWidget } from "./RemindersWidget";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
    return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtK(n: number) {
    return Math.abs(n) >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${Math.round(n)}`;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    analyzing: { label: "Analyzing",  className: "bg-blue-500/10    text-blue-400    border-blue-500/20"    },
    rehab:     { label: "In Rehab",   className: "bg-orange-500/10  text-orange-400  border-orange-500/20"  },
    rented:    { label: "Rented",     className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    vacant:    { label: "Vacant",     className: "bg-yellow-500/10  text-yellow-400  border-yellow-500/20"  },
    sold:      { label: "Sold",       className: "bg-muted          text-muted-foreground border-border"    },
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
    label, value, sub, icon: Icon, trend, accent,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    trend?: "up" | "down" | "neutral";
    accent?: "emerald" | "red" | "violet" | "blue" | "indigo";
}) {
    const accentMap = {
        emerald: "text-emerald-400 bg-emerald-500/10",
        red:     "text-red-400     bg-red-500/10",
        violet:  "text-violet-400  bg-violet-500/10",
        blue:    "text-blue-400    bg-blue-500/10",
        indigo:  "text-indigo-400  bg-indigo-500/10",
    };
    const iconClass = accent ? accentMap[accent] : "text-muted-foreground bg-muted";

    return (
        <Card className="border border-border bg-card hover:border-border/80 transition-colors">
            <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                    <p className={cn("text-2xl font-black tabular-nums tracking-tight", accent && accentMap[accent].split(" ")[0])}>
                        {value}
                    </p>
                    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                </div>
                <div className={cn("p-2 rounded-lg shrink-0", iconClass.split(" ")[1])}>
                    <Icon className={cn("h-4 w-4", iconClass.split(" ")[0])} />
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const CAT_COLORS = ["#7c3aed", "#6d28d9", "#4f46e5", "#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626"];

export function DashboardCharts({ data }: { data: any }) {
    const { equityTrend, maintenanceAlerts, stats, propertySummaries = [], maintenanceTrend = [], maintenanceByCategory = [], incomeExpenseTrend = [] } = data;

    const cashFlowPositive = stats.monthlyCashFlow >= 0;
    const latestEquity     = equityTrend?.[equityTrend.length - 1]?.value ?? 0;
    const firstEquity      = equityTrend?.[0]?.value ?? 0;
    const equityGrowth     = firstEquity > 0 ? ((latestEquity - firstEquity) / firstEquity) * 100 : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ── KPI Strip ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard
                    label="Portfolio Value"
                    value={fmtK(stats.totalPortfolioValue ?? 0)}
                    sub={`${stats.totalProperties} propert${stats.totalProperties === 1 ? "y" : "ies"}`}
                    icon={Building2}
                    accent="violet"
                />
                <KpiCard
                    label="Total Equity"
                    value={fmtK(stats.totalEquity)}
                    sub={equityGrowth !== 0 ? `${equityGrowth > 0 ? "+" : ""}${equityGrowth.toFixed(1)}% (12 mo)` : undefined}
                    icon={TrendingUp}
                    accent="indigo"
                />
                <KpiCard
                    label="Monthly Cash Flow"
                    value={`${cashFlowPositive ? "+" : "-"}$${fmt(Math.abs(stats.monthlyCashFlow), 0)}`}
                    sub={`$${fmt(Math.abs(stats.monthlyCashFlow * 12), 0)}/yr`}
                    icon={cashFlowPositive ? TrendingUp : TrendingDown}
                    accent={cashFlowPositive ? "emerald" : "red"}
                />
                <KpiCard
                    label="Avg ROI"
                    value={stats.avgRoi ? `${stats.avgRoi.toFixed(1)}%` : "—"}
                    sub="Cash-on-cash"
                    icon={Activity}
                    accent="blue"
                />
                <KpiCard
                    label="Active Rehabs"
                    value={String(stats.activeRehabs)}
                    sub={`${stats.totalProperties} total doors`}
                    icon={Wrench}
                    accent={stats.activeRehabs > 0 ? "indigo" : undefined}
                />
                <KpiCard
                    label="Maintenance Spent"
                    value={fmtK(stats.totalMaintenanceSpent ?? 0)}
                    sub={stats.openMaintenance > 0 ? `${stats.openMaintenance} open request${stats.openMaintenance > 1 ? "s" : ""}` : "No open requests"}
                    icon={AlertTriangle}
                    accent={stats.openMaintenance > 0 ? "red" : undefined}
                />
            </div>

            {/* ── Income vs Expenses ────────────────────────────────────── */}
            <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-base font-bold">Income vs Expenses</CardTitle>
                            <CardDescription>Rent collected vs total expenses — last 6 months</CardDescription>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                                Income
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-red-400">
                                <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
                                Expenses
                            </span>
                            <Link href="/dashboard/expenses" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors ml-2">
                                Manage <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                    {/* This month summary */}
                    <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">This month income:</span>
                            <span className="text-sm font-bold text-emerald-400">${fmt(stats.monthlyIncome ?? 0)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Expenses:</span>
                            <span className="text-sm font-bold text-red-400">${fmt(stats.monthlyExpenses ?? 0)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Net:</span>
                            <span className={cn("text-sm font-bold", (stats.monthlyIncome ?? 0) - (stats.monthlyExpenses ?? 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                                {(stats.monthlyIncome ?? 0) - (stats.monthlyExpenses ?? 0) >= 0 ? "+" : ""}${fmt((stats.monthlyIncome ?? 0) - (stats.monthlyExpenses ?? 0))}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {incomeExpenseTrend.every((m: any) => m.income === 0 && m.expenses === 0) ? (
                        <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <DollarSign className="h-8 w-8 opacity-30" />
                            <p className="text-sm">No income or expense data yet</p>
                            <Link href="/dashboard/expenses" className="text-xs text-primary hover:underline">Add your first expense →</Link>
                        </div>
                    ) : (
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={incomeExpenseTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} dy={6} />
                                    <YAxis axisLine={false} tickLine={false} width={52}
                                        tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                        formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name === "income" ? "Income" : "Expenses"]}
                                    />
                                    <Bar dataKey="income"   radius={[4,4,0,0]} fill="#10b981" maxBarSize={32} />
                                    <Bar dataKey="expenses" radius={[4,4,0,0]} fill="#ef4444" maxBarSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Equity Chart + Reminders ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 border border-border bg-card">
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Portfolio Equity Growth</CardTitle>
                                <CardDescription>Estimated 12-month equity trend</CardDescription>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400">
                                <TrendingUp className="h-3 w-3" />
                                {equityGrowth >= 0 ? "+" : ""}{equityGrowth.toFixed(1)}%
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={equityTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}    />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} dy={8} />
                                    <YAxis axisLine={false} tickLine={false} width={52}
                                        tickFormatter={v => `$${v / 1000}k`}
                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Equity"]}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2.5}
                                        fillOpacity={1} fill="url(#equityGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <RemindersWidget initialReminders={maintenanceAlerts} />
            </div>

            {/* ── Cash Flow + Portfolio Metrics ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Cash Flow */}
                <Card className="border border-border bg-card overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold">Monthly Cash Flow</CardTitle>
                            <Badge variant="outline" className={cn("text-xs font-bold", cashFlowPositive ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400")}>
                                {cashFlowPositive ? "Positive" : "Negative"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-end gap-2">
                            <span className={cn("text-4xl font-black tabular-nums", cashFlowPositive ? "text-emerald-400" : "text-red-400")}>
                                {cashFlowPositive ? "+" : "-"}${fmt(Math.abs(stats.monthlyCashFlow), 2)}
                            </span>
                            <span className="text-muted-foreground text-sm mb-1">/mo</span>
                        </div>

                        {/* Progress bar */}
                        <div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all", cashFlowPositive ? "bg-emerald-500" : "bg-red-500")}
                                    style={{ width: `${Math.min(Math.abs(stats.monthlyCashFlow) / 500 * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Goal: $500/mo positive cash flow
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="rounded-lg bg-muted/30 border border-border p-3">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Per Property</p>
                                <p className="font-bold text-lg mt-1">
                                    {stats.totalProperties > 0
                                        ? `${cashFlowPositive ? "+" : "-"}$${fmt(Math.abs(stats.monthlyCashFlow / stats.totalProperties), 0)}`
                                        : "$0"}
                                </p>
                            </div>
                            <div className="rounded-lg bg-muted/30 border border-border p-3">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Annualized</p>
                                <p className="font-bold text-lg mt-1">
                                    {cashFlowPositive ? "+" : "-"}${fmt(Math.abs(stats.monthlyCashFlow * 12), 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Portfolio Metrics */}
                <Card className="border border-border bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">Portfolio Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            {
                                label: "Total Portfolio Value",
                                value: `$${fmt(stats.totalPortfolioValue ?? 0)}`,
                                icon: Building2,
                                color: "text-violet-400",
                            },
                            {
                                label: "Total Equity",
                                value: `$${fmt(stats.totalEquity)}`,
                                icon: TrendingUp,
                                color: "text-indigo-400",
                            },
                            {
                                label: "Total Doors",
                                value: String(stats.totalProperties),
                                icon: Home,
                                color: "text-blue-400",
                            },
                            {
                                label: "Average ROI",
                                value: stats.avgRoi ? `${stats.avgRoi.toFixed(1)}%` : "—",
                                icon: Activity,
                                color: "text-emerald-400",
                            },
                            {
                                label: "Active Rehabs",
                                value: String(stats.activeRehabs),
                                icon: Wrench,
                                color: stats.activeRehabs > 0 ? "text-orange-400" : "text-muted-foreground",
                            },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <div className="flex items-center gap-2">
                                    <Icon className={cn("h-3.5 w-3.5", color)} />
                                    <span className="text-sm text-muted-foreground">{label}</span>
                                </div>
                                <span className={cn("text-sm font-bold tabular-nums", color)}>{value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* ── Maintenance Expenses ─────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Monthly spend bar chart */}
                <Card className="border border-border bg-card">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Maintenance Expenses</CardTitle>
                                <CardDescription>Monthly spend — last 6 months</CardDescription>
                            </div>
                            <Link href="/dashboard/maintenance" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {maintenanceTrend.every((m: any) => m.value === 0) ? (
                            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <Wrench className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No closed requests yet</p>
                            </div>
                        ) : (
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={maintenanceTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false}
                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} dy={6} />
                                        <YAxis axisLine={false} tickLine={false} width={48}
                                            tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                            formatter={(v: number) => [`$${v.toLocaleString()}`, "Spent"]}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#7c3aed" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* By category */}
                <Card className="border border-border bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">Spend by Category</CardTitle>
                        <CardDescription>Total actual cost per repair type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {maintenanceByCategory.length === 0 ? (
                            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <AlertTriangle className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No expense data yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5 pt-1">
                                {maintenanceByCategory.slice(0, 6).map((cat: any, i: number) => {
                                    const max = maintenanceByCategory[0]?.value || 1;
                                    const pct = Math.round((cat.value / max) * 100);
                                    return (
                                        <div key={cat.name}>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-medium text-foreground">{cat.name}</span>
                                                <span className="font-bold tabular-nums" style={{ color: CAT_COLORS[i % CAT_COLORS.length] }}>
                                                    ${cat.value.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Properties at a Glance ────────────────────────────────── */}
            {propertySummaries.length > 0 && (
                <Card className="border border-border bg-card">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold">Properties at a Glance</CardTitle>
                            <Link href="/dashboard/properties" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Property</th>
                                        <th className="text-right px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Value</th>
                                        <th className="text-right px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Equity</th>
                                        <th className="text-right px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Cash Flow</th>
                                        <th className="text-center px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {propertySummaries.map((p: any) => {
                                        const cfPositive = p.cashFlow >= 0;
                                        const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE["analyzing"];
                                        return (
                                            <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3">
                                                    <Link href={`/dashboard/properties/${p.id}`} className="hover:text-primary transition-colors">
                                                        <p className="font-medium truncate max-w-[200px]">{p.address}</p>
                                                        {p.rent > 0 && (
                                                            <p className="text-xs text-muted-foreground">${fmt(p.rent)}/mo rent</p>
                                                        )}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-right hidden sm:table-cell">
                                                    <span className="font-semibold">{p.value > 0 ? `$${fmt(p.value)}` : "—"}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right hidden md:table-cell">
                                                    <span className="font-semibold text-indigo-400">{p.equity > 0 ? `$${fmt(p.equity)}` : "—"}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={cn("font-bold tabular-nums", cfPositive ? "text-emerald-400" : "text-red-400")}>
                                                        {cfPositive ? "+" : "-"}${fmt(Math.abs(p.cashFlow), 0)}/mo
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                    <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", badge.className)}>
                                                        {badge.label}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

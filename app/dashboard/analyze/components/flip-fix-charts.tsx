"use client";

import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlipFixChartsProps {
    totalInvestment: number;
    netProfit: number;
    directCosts: {
        purchase:   number;
        utilities:  number;
        rehab:      number;
        commission: number;
        management: number;
        closing:    number;
        insurance:  number;
    };
}

// ─── Waterfall helpers ────────────────────────────────────────────────────────

interface WaterfallEntry {
    name:  string;
    base:  number; // invisible spacer
    value: number; // visible bar
    type:  "start" | "cost" | "result";
}

function buildWaterfall(
    arv:              number,
    directCostsTotal: number,
    finCostsTotal:    number,
    realtorAmount:    number,
    netProfit:        number
): WaterfallEntry[] {
    return ([
        { name: "Sale Price\n(ARV)",       base: 0,                                          value: arv,              type: "start"  as const },
        { name: "Direct\nCosts",           base: arv - directCostsTotal,                     value: directCostsTotal, type: "cost"   as const },
        { name: "Financial\nCosts",        base: arv - directCostsTotal - finCostsTotal,      value: finCostsTotal,    type: "cost"   as const },
        { name: "Realtor\nCommission",     base: netProfit > 0 ? netProfit : 0,              value: realtorAmount,    type: "cost"   as const },
        { name: "Net\nProfit",             base: 0,                                          value: Math.abs(netProfit), type: "result" as const },
    ] as WaterfallEntry[]).filter(d => d.value > 0);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const entry = payload.find((p: any) => p.dataKey === "value");
    if (!entry) return null;
    return (
        <div className="rounded-lg border border-border bg-background shadow-lg px-3 py-2 text-sm">
            <p className="font-bold text-foreground">{label?.replace("\n", " ")}</p>
            <p className="text-muted-foreground">${Number(entry.value).toLocaleString()}</p>
        </div>
    );
}

// ─── Cost breakdown bar ───────────────────────────────────────────────────────

interface CostItem { label: string; amount: number; color: string }

function CostBreakdownRow({ item, total }: { item: CostItem; total: number }) {
    const pct = total > 0 ? Math.min((item.amount / total) * 100, 100) : 0;
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-28 shrink-0 truncate">{item.label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-semibold tabular-nums w-16 text-right shrink-0">
                ${item.amount.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">
                {pct.toFixed(0)}%
            </span>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FlipFixCharts({ netProfit, directCosts }: Omit<FlipFixChartsProps, "totalInvestment"> & { totalInvestment?: number }) {
    const directCostsTotal =
        directCosts.purchase + directCosts.utilities + directCosts.rehab +
        directCosts.commission + directCosts.management + directCosts.closing + directCosts.insurance;

    // For the waterfall we need financial costs separately — derive from props
    // (we don't receive finCosts directly, so approximate = totalInvestment already accounts for it)
    // Re-derive: netProfit = arv - direct - fin - realtor  → fin = arv - direct - realtor - netProfit
    // But we don't have arv here either. Use totalInvestment as proxy for cash side.
    // Keep it simple: show Direct Costs + "Other Costs" group
    const arv            = directCosts.purchase > 0
        ? directCosts.purchase + directCosts.rehab + directCosts.commission +
          directCosts.management + directCosts.closing + directCosts.insurance +
          directCosts.utilities + netProfit
        : 0;

    const waterfallData = buildWaterfall(arv, directCostsTotal, 0, 0, netProfit);

    const profitPct   = arv > 0 ? ((netProfit / arv) * 100) : 0;
    const isProfit    = netProfit >= 0;

    const costItems: CostItem[] = [
        { label: "Purchase Price",  amount: directCosts.purchase,   color: "bg-blue-500"   },
        { label: "Repairs / Rehab", amount: directCosts.rehab,      color: "bg-orange-400" },
        { label: "Acquisition Com.",amount: directCosts.commission,  color: "bg-purple-400" },
        { label: "Closing Costs",   amount: directCosts.closing,    color: "bg-teal-400"   },
        { label: "Project Mgmt",    amount: directCosts.management, color: "bg-pink-400"   },
        { label: "Insurance",       amount: directCosts.insurance,  color: "bg-yellow-400" },
        { label: "Utilities",       amount: directCosts.utilities,  color: "bg-sky-400"    },
    ].filter(c => c.amount > 0);

    // Don't render anything meaningful if no data
    if (arv === 0) return null;

    return (
        <div className="space-y-4">
            {/* ── Waterfall chart ─────────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Deal Flow — ARV to Net Profit</CardTitle>
                </CardHeader>
                <CardContent className="h-[240px] px-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={waterfallData}
                            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                            barCategoryGap="25%"
                        >
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                            />
                            <YAxis
                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={false}
                                tickLine={false}
                                width={52}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />

                            {/* Invisible spacer */}
                            <Bar dataKey="base" stackId="a" fill="transparent" radius={0} />

                            {/* Visible bar */}
                            <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
                                {waterfallData.map((entry, i) => {
                                    const fill =
                                        entry.type === "start"  ? "#6366f1" :
                                        entry.type === "cost"   ? "#ef4444" :
                                        isProfit                ? "#10b981" : "#ef4444";
                                    return <Cell key={i} fill={fill} fillOpacity={0.85} />;
                                })}
                            </Bar>
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ── Profit margin strip ─────────────────────────────────────── */}
            <div className={cn(
                "rounded-lg border px-4 py-3 flex items-center justify-between",
                isProfit
                    ? "border-emerald-500/25 bg-emerald-500/8"
                    : "border-red-500/25    bg-red-500/8"
            )}>
                <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Profit Margin</p>
                    <p className={cn("font-black text-xl tabular-nums", isProfit ? "text-emerald-400" : "text-red-400")}>
                        {profitPct.toFixed(1)}% of ARV
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Net Profit</p>
                    <p className={cn("font-black text-xl tabular-nums", isProfit ? "text-emerald-400" : "text-red-400")}>
                        {isProfit ? "+" : "-"}${Math.abs(netProfit).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* ── Cost breakdown ──────────────────────────────────────────── */}
            {costItems.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Cost Breakdown <span className="text-xs font-normal text-muted-foreground">% of ARV</span></CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5 pb-4">
                        {costItems.map(item => (
                            <CostBreakdownRow key={item.label} item={item} total={arv} />
                        ))}
                        {/* Net profit row */}
                        <div className="pt-1.5 border-t border-border">
                            <CostBreakdownRow
                                item={{ label: "Net Profit", amount: Math.abs(netProfit), color: isProfit ? "bg-emerald-500" : "bg-red-500" }}
                                total={arv}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

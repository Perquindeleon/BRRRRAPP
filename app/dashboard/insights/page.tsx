"use client";

import { useState } from "react";
import {
    Bot, MapPin, TrendingUp, Activity, AlertTriangle,
    ArrowUpRight, Search, Loader2, Shield, GraduationCap,
    Droplets, Home, DollarSign, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AddressAutocomplete } from "@/components/properties/address-autocomplete";
import {
    LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface MarketAnalysis {
    location: string;
    neighborhoodGrade: string;
    gradeScore: number;
    gradeReason: string;
    crimeLevel: string;
    crimeScore: number;
    schoolScore: number;
    schoolRating: string;
    floodZone: string;
    floodNote: string;
    gentrification: string;
    gentrificationNote: string;
    marketHeatScore: number;
    arvForecast: number;
    rentGrowth: number;
    avgRent: number;
    avgHomeValue: number;
    verdict: string;
    hotNeighborhoods: string[];
    priceTrend: { month: string; value: number }[];
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function gradeColor(grade: string) {
    return grade === "A" ? "text-emerald-500" :
           grade === "B" ? "text-blue-500" :
           grade === "C" ? "text-yellow-500" :
           grade === "D" ? "text-orange-500" : "text-red-500";
}
function gradeBg(grade: string) {
    return grade === "A" ? "border-emerald-500 bg-emerald-500/10" :
           grade === "B" ? "border-blue-500 bg-blue-500/10" :
           grade === "C" ? "border-yellow-500 bg-yellow-500/10" :
           grade === "D" ? "border-orange-500 bg-orange-500/10" :
                           "border-red-500 bg-red-500/10";
}
function crimeColor(level: string) {
    return level === "Very Low" || level === "Low" ? "text-emerald-500" :
           level === "Moderate" ? "text-yellow-500" : "text-red-500";
}
function floodColor(zone: string) {
    return zone === "Minimal" ? "text-emerald-500" :
           zone === "Moderate" ? "text-yellow-500" : "text-red-500";
}
function genColor(status: string) {
    return status === "Accelerating" || status === "Early Stage" ? "text-violet-500" :
           status === "Stable" ? "text-blue-500" :
           status === "Peaked" ? "text-yellow-500" : "text-muted-foreground";
}
function fmt(n: number) {
    return n >= 1_000_000
        ? `$${(n / 1_000_000).toFixed(2)}M`
        : `$${n.toLocaleString()}`;
}

/* ─── Score Bar ──────────────────────────────────────────────────────── */
function ScoreBar({ score, max = 10, color }: { score: number; max?: number; color: string }) {
    const pct = Math.round((score / max) * 100);
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">{score}/{max}</span>
        </div>
    );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function InsightsPage() {
    const [query, setQuery]       = useState("");
    const [data, setData]         = useState<MarketAnalysis | null>(null);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState<string | null>(null);

    const analyze = async (loc = query) => {
        const trimmed = loc.trim();
        if (!trimmed) return;
        setLoading(true);
        setError(null);
        setData(null);
        try {
            const res = await fetch("/api/market-analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ location: trimmed }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error || "Analysis failed"); return; }
            setData(json);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const EXAMPLES = ["Miami, FL", "33101", "Austin, TX", "Nashville, TN", "Phoenix, AZ"];

    return (
        <div className="p-6 space-y-6 min-h-screen">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bot className="h-6 w-6 text-violet-500" />
                        AI Market Insights
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Neighborhood grade, crime, schools, flood risk & market analytics — powered by AI.
                    </p>
                </div>
                {data && (
                    <Button variant="outline" size="sm" onClick={() => analyze()} disabled={loading}>
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                )}
            </div>

            {/* ── Search ── */}
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <AddressAutocomplete
                        label={null}
                        placeholder="Enter city, zip code or address  (e.g. Miami, FL  or  33101)"
                        value={query}
                        onChange={setQuery}
                        onSelect={(address) => { setQuery(address); analyze(address); }}
                    />
                </div>
                <Button onClick={() => analyze()} disabled={loading || !query.trim()}>
                    {loading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Search className="h-4 w-4" />}
                    <span className="ml-2">Analyze</span>
                </Button>
            </div>

            {/* Quick examples */}
            {!data && !loading && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Try:</span>
                    {EXAMPLES.map((ex) => (
                        <button
                            key={ex}
                            onClick={() => { setQuery(ex); analyze(ex); }}
                            className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-violet-400 hover:text-violet-500 transition-colors text-muted-foreground"
                        >
                            {ex}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
                    <div className="relative">
                        <Bot className="h-12 w-12 text-violet-500" />
                        <Loader2 className="h-5 w-5 text-violet-400 animate-spin absolute -top-1 -right-1" />
                    </div>
                    <div className="text-center">
                        <p className="font-medium text-foreground">Analyzing Market Data…</p>
                        <p className="text-sm mt-1">Fetching crime stats, school scores, flood risk & more</p>
                    </div>
                </div>
            )}

            {/* ── Error ── */}
            {!loading && error && (
                <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-medium">Analysis failed</p>
                        <p className="text-destructive/80">{error}</p>
                    </div>
                </div>
            )}

            {/* ── Results ── */}
            {!loading && data && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">

                    {/* Location badge */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-violet-500" />
                        <span className="font-medium text-foreground">{data.location}</span>
                    </div>

                    {/* ── Row 1: Neighborhood Grade + Crime + Schools + Flood ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Neighborhood Grade */}
                        <Card className={`border-2 ${gradeBg(data.neighborhoodGrade)}`}>
                            <CardHeader className="pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Neighborhood Grade
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className={`text-5xl font-black ${gradeColor(data.neighborhoodGrade)}`}>
                                    {data.neighborhoodGrade}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 leading-snug">{data.gradeReason}</p>
                            </CardContent>
                        </Card>

                        {/* Crime */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Crime Level</CardTitle>
                                <Shield className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className={`text-xl font-bold ${crimeColor(data.crimeLevel)}`}>{data.crimeLevel}</div>
                                <ScoreBar score={data.crimeScore} color="bg-emerald-500" />
                                <p className="text-xs text-muted-foreground mt-1">Safety score {data.crimeScore}/10</p>
                            </CardContent>
                        </Card>

                        {/* Schools */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">School Quality</CardTitle>
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-xl font-bold text-blue-500">{data.schoolRating}</div>
                                <ScoreBar score={data.schoolScore} color="bg-blue-500" />
                                <p className="text-xs text-muted-foreground mt-1">Rating {data.schoolScore}/10</p>
                            </CardContent>
                        </Card>

                        {/* Flood Zone */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Flood Risk</CardTitle>
                                <Droplets className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className={`text-xl font-bold ${floodColor(data.floodZone)}`}>{data.floodZone}</div>
                                <p className="text-xs text-muted-foreground mt-2 leading-snug">{data.floodNote}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Row 2: Market KPIs ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Market Heat */}
                        <Card className="border-t-4 border-t-violet-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Market Heat</CardTitle>
                                <Activity className="h-4 w-4 text-violet-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-3xl font-bold">{data.marketHeatScore}<span className="text-lg text-muted-foreground">/100</span></div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {data.marketHeatScore > 80 ? "🔥 Seller's Market" :
                                     data.marketHeatScore > 50 ? "⚖️ Balanced" : "❄️ Buyer's Market"}
                                </p>
                            </CardContent>
                        </Card>

                        {/* ARV Forecast */}
                        <Card className="border-t-4 border-t-emerald-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">12-Mo ARV Forecast</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className={`text-3xl font-bold ${data.arvForecast >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {data.arvForecast >= 0 ? "+" : ""}{data.arvForecast}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Predicted Value Increase</p>
                            </CardContent>
                        </Card>

                        {/* Rent Growth */}
                        <Card className="border-t-4 border-t-blue-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rent Growth</CardTitle>
                                <ArrowUpRight className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className={`text-3xl font-bold ${data.rentGrowth >= 0 ? "text-blue-500" : "text-red-500"}`}>
                                    {data.rentGrowth >= 0 ? "+" : ""}{data.rentGrowth}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">YoY Rent Demand</p>
                            </CardContent>
                        </Card>

                        {/* Gentrification */}
                        <Card className="border-t-4 border-t-orange-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gentrification</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className={`text-lg font-bold uppercase ${genColor(data.gentrification)}`}>
                                    {data.gentrification}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 leading-snug">{data.gentrificationNote}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Avg Rent + Avg Home Value ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                                    <DollarSign className="h-5 w-5 text-teal-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Monthly Rent</p>
                                    <p className="text-2xl font-bold text-teal-500">${data.avgRent.toLocaleString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                                    <Home className="h-5 w-5 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Home Value</p>
                                    <p className="text-2xl font-bold text-indigo-500">{fmt(data.avgHomeValue)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── AI Verdict + Chart + Hot Neighborhoods ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Left: Verdict + Chart */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <Bot className="h-4 w-4 text-violet-500" />
                                    AI Strategy Verdict
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-lg p-4">
                                    <p className="text-sm font-medium leading-relaxed italic">"{data.verdict}"</p>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-semibold">
                                        Price Trend (Last 6 Months — $K)
                                    </p>
                                    <ResponsiveContainer width="100%" height={140}>
                                        <LineChart data={data.priceTrend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                            <YAxis
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={(v) => `$${v}k`}
                                                width={46}
                                            />
                                            <Tooltip
                                                formatter={(v: number) => [`$${v}k`, "Avg Value"]}
                                                contentStyle={{
                                                    background: "hsl(var(--card))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: 6,
                                                    fontSize: 12,
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#8b5cf6"
                                                strokeWidth={2.5}
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right: Hot Neighborhoods */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-red-500" />
                                    Hot Neighborhoods
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.hotNeighborhoods.map((hood, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <span className="text-sm font-medium">{hood}</span>
                                        <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
                                    </div>
                                ))}
                                <div className="pt-4 border-t mt-4">
                                    <Button className="w-full" asChild>
                                        <Link href={`/dashboard/analyze?location=${encodeURIComponent(data.location)}`}>
                                            Analyze a Deal in {data.location.split(",")[0]}
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

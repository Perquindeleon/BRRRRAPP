"use client";

import { useState, useEffect } from "react";
import { Bot, MapPin, TrendingUp, TrendingDown, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { getMarketInsights, MarketData } from "./mock-data";
import { createClient } from "@/lib/supabase/client";

// Simple Line Chart Component (Recharts might be missing, using SVG for robustness if needed, but trying Recharts first if env allows. 
// Given install failure, let's use a pure CSS/SVG approach or safe import.)
// ACTUALLY: The user's codebase likely has recharts since it's a standard dashboard. 
// I will try to use Recharts. If it crashes, user will report.
// Wait, I can verify package.json content to be safe. 
// For now, I'll build a custom SVG chart to be 100% sure it works without dependencies.

function SimpleTrendChart({ data, color }: { data: { month: string, value: number }[], color: string }) {
    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const range = max - min || 1;

    // Normalize points to 0-100 height
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value - min) / range) * 100;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="h-32 w-full flex items-end justify-between gap-1 overflow-hidden relative mt-4">
            {/* Line */}
            <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    points={points}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>

            {/* X-Axis labels */}
            <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-muted-foreground uppercase pt-2">
                {data.map((d, i) => (
                    <span key={i}>{d.month}</span>
                ))}
            </div>
        </div>
    );
}

export default function InsightsPage() {
    const [city, setCity] = useState("miami");
    const [data, setData] = useState<MarketData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const insights = await getMarketInsights(city);
            setData(insights);
            setLoading(false);
        }
        load();
    }, [city]);

    return (
        <div className="p-8 space-y-8 min-h-screen bg-background text-foreground animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Bot className="h-8 w-8 text-violet-500" />
                        AI Market Insights
                    </h1>
                    <p className="text-muted-foreground">Predictive analytics and real-time market scores.</p>
                </div>
                <div className="w-full md:w-[200px]">
                    <Select value={city} onValueChange={setCity}>
                        <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="miami">Miami, FL</SelectItem>
                            <SelectItem value="tampa">Tampa, FL</SelectItem>
                            <SelectItem value="orlando">Orlando, FL</SelectItem>
                            <SelectItem value="jacksonville">Jacksonville, FL</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading || !data ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground animate-pulse">
                    Analyzing Market Data...
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Top Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* 1. Market Heat */}
                        <Card className="border-t-4 border-t-violet-500 shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Market Heat Score</CardTitle>
                                <Activity className="h-4 w-4 text-violet-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{data.marketHeatScore}/100</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {data.marketHeatScore > 80 ? "🔥 Seller's Market" : data.marketHeatScore > 50 ? "⚖️ Balanced" : "❄️ Buyer's Market"}
                                </p>
                            </CardContent>
                        </Card>

                        {/* 2. ARV Forecast */}
                        <Card className="border-t-4 border-t-emerald-500 shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">12-Mo ARV Forecast</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-emerald-500">+{data.arvForecast}%</div>
                                <p className="text-xs text-muted-foreground mt-1">Predicted Value Increase</p>
                            </CardContent>
                        </Card>

                        {/* 3. Rent Growth */}
                        <Card className="border-t-4 border-t-blue-500 shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Rent Growth</CardTitle>
                                <ArrowUpRight className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-500">+{data.rentGrowth}%</div>
                                <p className="text-xs text-muted-foreground mt-1">YoY Rent Demand</p>
                            </CardContent>
                        </Card>

                        {/* 4. Gentrification */}
                        <Card className="border-t-4 border-t-orange-500 shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Gentrification</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold uppercase text-orange-600">{data.gentrification}</div>
                                <p className="text-xs text-muted-foreground mt-1">Neighborhood Status</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Split */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left: AI Analysis */}
                        <Card className="lg:col-span-2 bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-violet-600" />
                                    AI Strategy Verdict
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-violet-50 dark:bg-violet-950/20 p-5 rounded-lg border border-violet-100 dark:border-violet-900/50">
                                    <p className="text-lg font-medium leading-relaxed italic text-foreground">
                                        "{data.description}"
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Price Trend (Last 6 Months)</h3>
                                    <SimpleTrendChart data={data.trends} color="#8b5cf6" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right: Top Areas */}
                        <Card className="bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-red-500" />
                                    Hot Neighborhoods
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.topNeighborhoods.map((hood, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
                                            <span className="font-semibold text-sm group-hover:text-primary transition-colors">{hood}</span>
                                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-6 border-t">
                                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" asChild>
                                        <Link href="/dashboard/analyze">Start Analysis in {city}</Link>
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

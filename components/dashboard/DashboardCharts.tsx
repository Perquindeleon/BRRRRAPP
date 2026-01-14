"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, TrendingUp, DollarSign, Activity, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RemindersWidget } from "./RemindersWidget";
import { QuickTools } from "./QuickTools";

export function DashboardCharts({ data }: { data: any }) {
    const { equityTrend, maintenanceAlerts, stats } = data;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* --- TOP: EQUITY GROWTH CHART --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 border-none shadow-md bg-card">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-foreground">Portfolio Equity Growth</CardTitle>
                                <CardDescription>Estimated equity trend over the last 12 months</CardDescription>
                            </div>
                            <div className="p-2 bg-violet-100 rounded-full">
                                <TrendingUp className="h-5 w-5 text-violet-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={equityTrend}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        hide={false}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `$${value / 1000}k`}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#7c3aed"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* --- SIDE: ALERTS & ACTIONS --- */}
                <div className="space-y-6">
                    <RemindersWidget initialReminders={maintenanceAlerts} />
                    <QuickTools />
                </div>
            </div>

            {/* --- BOTTOM: QUICK ROI SPREAD --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cash Flow Widget */}
                <Card className={`border-none shadow-sm overflow-hidden relative text-white ${stats.monthlyCashFlow < 0 ? 'bg-red-900' : 'bg-emerald-900'}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <DollarSign className="h-32 w-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className={stats.monthlyCashFlow < 0 ? "text-red-100" : "text-emerald-100"}>Actual Monthly Cash Flow</CardTitle>
                        <h3 className="text-4xl font-bold mt-2">${stats.monthlyCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    </CardHeader>
                    <CardContent>
                        <div className={`h-2 w-full rounded-full mt-4 overflow-hidden ${stats.monthlyCashFlow < 0 ? 'bg-red-800' : 'bg-emerald-800'}`}>
                            <div className={`h-full w-[75%] ${stats.monthlyCashFlow < 0 ? 'bg-red-400' : 'bg-emerald-400'}`} />
                        </div>
                        <p className={`text-xs mt-2 ${stats.monthlyCashFlow < 0 ? 'text-red-300' : 'text-emerald-300'}`}>75% of target goal active</p>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <p className={`text-xs uppercase ${stats.monthlyCashFlow < 0 ? 'text-red-300' : 'text-emerald-300'}`}>Per Property</p>
                                <p className="font-bold text-lg">${stats.totalProperties > 0 ? (stats.monthlyCashFlow / stats.totalProperties).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</p>
                            </div>
                            <div>
                                <p className={`text-xs uppercase ${stats.monthlyCashFlow < 0 ? 'text-red-300' : 'text-emerald-300'}`}>Annualized</p>
                                <p className="font-bold text-lg">${(stats.monthlyCashFlow * 12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ROI / Stats Widget */}
                <Card className="border-none shadow-sm bg-indigo-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Activity className="h-32 w-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-indigo-100">Portfolio Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-8">
                        <div>
                            <p className="text-xs text-indigo-300 uppercase mb-1">Active Rehabs</p>
                            <h3 className="text-3xl font-bold">{stats.activeRehabs}</h3>
                        </div>
                        <div>
                            <p className="text-xs text-indigo-300 uppercase mb-1">Total Doors</p>
                            <h3 className="text-3xl font-bold">{stats.totalProperties}</h3>
                        </div>
                        <div>
                            <p className="text-xs text-indigo-300 uppercase mb-1">Total Equity</p>
                            <h3 className="text-3xl font-bold text-indigo-200">${(stats.totalEquity / 1000).toFixed(0)}k</h3>
                        </div>
                        <div>
                            <p className="text-xs text-indigo-300 uppercase mb-1">Avg ROI</p>
                            <h3 className="text-3xl font-bold text-indigo-200">
                                {stats.avgRoi ? `${stats.avgRoi.toFixed(1)}%` : '0.0%'}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function CheckCircle(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}

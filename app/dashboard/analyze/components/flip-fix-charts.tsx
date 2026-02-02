"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FlipFixChartsProps {
    totalInvestment: number;
    netProfit: number;
    directCosts: {
        purchase: number;
        utilities: number;
        rehab: number;
        commission: number;
        management: number;
        closing: number;
        insurance: number;
    };
}

export function FlipFixCharts({ totalInvestment, netProfit, directCosts }: FlipFixChartsProps) {

    // Data for Bar Chart: Investment vs Net Profit
    const barData = [
        {
            name: "1", // Label hidden in screenshot mock, using placeholder
            "Utilidad Neta": netProfit,
            "Total estimado de fondos me": totalInvestment, // Label cut off in screenshot "Total estimado de fondos para ce..."
        },
    ];

    // Data for Pie Chart: Direct Costs Distribution
    const pieData = [
        { name: "Precio de compra", value: directCosts.purchase, fill: "#3b82f6" }, // Blue
        { name: "Costos remodelación", value: directCosts.rehab, fill: "#fbbf24" }, // Yellow/Gold
        { name: "Comisión adquisicion", value: directCosts.commission, fill: "#c084fc" }, // Purple
        { name: "Closing Costs", value: directCosts.closing, fill: "#2dd4bf" }, // Teal
        { name: "Administración", value: directCosts.management, fill: "#f87171" }, // Red
        { name: "Seguro", value: directCosts.insurance, fill: "#a855f7" }, // Violet
        { name: "Servicios Publicos", value: directCosts.utilities, fill: "#fb923c" }, // Orange
    ].filter(d => d.value > 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-center text-foreground">
                        Inversion requerida vs utilidad neta (USD miles)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={barData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            barGap={0}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={false} axisLine={false} />
                            <YAxis
                                tickFormatter={(value) => `${value / 1000}`} // Show in thousands without 'k' based on screenshot
                            />
                            <Tooltip
                                formatter={(value) => `$${Number(value).toLocaleString()}`}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                            <Bar dataKey="Total estimado de fondos me" name="Total estimado de fondos para cerrar" fill="#93c5fd" radius={[4, 4, 0, 0]}>
                                {/* Label on top */}
                            </Bar>
                            <Bar dataKey="Utilidad Neta" name="Utilidad Neta" fill="#34d399" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-center text-foreground">
                        Distribución de costos directos
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={80}
                                paddingAngle={0}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                            <Legend layout="vertical" align="right" verticalAlign="middle" iconType="square" wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getPortfolioData } from "../properties/actions";
import { useEffect } from "react";
import { ArrowLeftRight, Check } from "lucide-react";

export default function ComparePage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch client-side for simplicity in this interactive flow
        getPortfolioData().then(data => {
            setProperties(data);
            setLoading(false);
        });
    }, []);

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            if (selectedIds.length < 3) { // Limit to 3 for mobile layout safety
                setSelectedIds([...selectedIds, id]);
            } else {
                alert("You can compare up to 3 properties at a time.");
            }
        }
    };

    const selectedProperties = properties.filter(p => selectedIds.includes(p.id));

    if (loading) return <div className="p-8">Loading properties...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Compare Deals</h2>
                    <p className="text-muted-foreground">Select up to 3 properties to analyze side-by-side.</p>
                </div>
            </div>

            {/* SELECTION BAR */}
            <Card className="bg-gray-50 border-dashed">
                <CardContent className="p-4 flex gap-4 overflow-x-auto">
                    {properties.map(prop => (
                        <div
                            key={prop.id}
                            onClick={() => toggleSelection(prop.id)}
                            className={`
                                cursor-pointer flex-shrink-0 w-64 p-3 rounded-lg border transition-all
                                ${selectedIds.includes(prop.id) ? 'bg-violet-100 border-violet-500 ring-1 ring-violet-500' : 'bg-card border-border hover:border-violet-300'}
                            `}
                        >
                            <div className="flex items-start justify-between">
                                <div className="truncate">
                                    <p className="font-semibold text-sm truncate">{prop.address}</p>
                                    <p className="text-xs text-gray-500">{prop.city}, {prop.state}</p>
                                </div>
                                {selectedIds.includes(prop.id) && <Check className="h-4 w-4 text-violet-600" />}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* COMPARISON TABLE */}
            {selectedProperties.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 font-bold text-gray-500 uppercase text-xs w-1/4">Metric</th>
                                {selectedProperties.map(p => (
                                    <th key={p.id} className="p-4 font-bold text-foreground border-l">{p.address}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y text-foreground">
                            {/* Purchase Price */}
                            <tr>
                                <td className="p-4 font-medium text-gray-500">Purchase Price</td>
                                {selectedProperties.map(p => (
                                    <td key={p.id} className="p-4 border-l font-bold">${(p.purchase_price || 0).toLocaleString()}</td>
                                ))}
                            </tr>
                            {/* Rehab Budget */}
                            <tr>
                                <td className="p-4 font-medium text-gray-500">Est. Rehab Budget</td>
                                {selectedProperties.map(p => {
                                    // Hacky summary if we don't have joined rehab items here easily. 
                                    // For deeper comparison we'd need a richer fetch.
                                    // Let's assume user wants basic details first.
                                    return <td key={p.id} className="p-4 border-l">$ -</td>
                                })}
                            </tr>
                            {/* ARV (Estimated) */}
                            <tr>
                                <td className="p-4 font-medium text-gray-500">ARV Estimate</td>
                                {selectedProperties.map(p => (
                                    <td key={p.id} className="p-4 border-l font-bold text-indigo-600">${(p.arv_estimate || 0).toLocaleString()}</td>
                                ))}
                            </tr>

                            {/* CALCULATED METRICS */}
                            <tr className="bg-gray-50/50">
                                <td className="p-4 font-medium text-gray-500">Implied Equity</td>
                                {selectedProperties.map(p => {
                                    const equity = (p.arv_estimate || 0) * 0.25; // Crude 25% assumption
                                    return <td key={p.id} className="p-4 border-l font-bold text-emerald-600">+${Math.round(equity).toLocaleString()}</td>
                                })}
                            </tr>

                            <tr>
                                <td className="p-4 font-medium text-gray-500">Status</td>
                                {selectedProperties.map(p => (
                                    <td key={p.id} className="p-4 border-l capitalize">{p.status}</td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-20 opacity-50">
                    <ArrowLeftRight className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Select properties above to start comparing.</p>
                </div>
            )}
        </div>
    );
}

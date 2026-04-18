"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Bed,
    Bath,
    Maximize2,
    Calendar,
    Clock,
    TrendingUp,
    DollarSign,
    RefreshCw,
    Hammer,
} from "lucide-react";

export interface RentcastProperty {
    id?: string;
    formattedAddress?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    yearBuilt?: number;
    // Listing fields
    price?: number;
    listingType?: string;
    listedDate?: string;
    daysOnMarket?: number;
    // Property record fields
    lastSalePrice?: number;
    lastSaleDate?: string;
    assessedValue?: number;
    estimatedValue?: number;
    rentEstimate?: number;
}

function fmt(n?: number) {
    if (!n) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtNum(n?: number) {
    if (!n) return "—";
    return n.toLocaleString("en-US");
}

const TYPE_COLORS: Record<string, string> = {
    "Single Family": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Multi Family": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Condo": "bg-green-500/10 text-green-400 border-green-500/20",
    "Townhouse": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "Mobile Home": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export function PropertyCard({ property, selected, onSelect }: {
    property: RentcastProperty;
    selected?: boolean;
    onSelect?: () => void;
}) {
    const router = useRouter();

    const displayAddress =
        property.formattedAddress ||
        [property.addressLine1, property.city, property.state, property.zipCode]
            .filter(Boolean)
            .join(", ");

    const price = property.price ?? property.estimatedValue ?? property.lastSalePrice;
    const typeColor = TYPE_COLORS[property.propertyType ?? ""] ?? "bg-muted text-muted-foreground border-border";

    function buildParams() {
        const params = new URLSearchParams();
        if (displayAddress) params.set("address", displayAddress);
        if (price) params.set("price", String(price));
        if (property.estimatedValue) params.set("arv", String(property.estimatedValue));
        if (property.rentEstimate) params.set("rent", String(property.rentEstimate));
        return params;
    }

    const handleBRRRR = () => {
        const params = buildParams();
        params.set("strategy", "brrrr");
        router.push(`/dashboard/analyze?${params.toString()}`);
    };

    const handleFlip = () => {
        const params = buildParams();
        params.set("strategy", "flip");
        router.push(`/dashboard/analyze?${params.toString()}`);
    };

    return (
        <Card
            onClick={onSelect}
            className={`flex flex-col overflow-hidden cursor-pointer transition-all ${
                selected
                    ? "border-violet-500 ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/10"
                    : "hover:border-primary/50"
            }`}
        >
            {/* Header strip */}
            <div className={`px-4 py-3 border-b flex items-start justify-between gap-2 transition-colors ${selected ? "bg-violet-500/10" : "bg-muted/30"}`}>
                <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate">{displayAddress}</p>
                    {property.city && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {property.city}, {property.state} {property.zipCode}
                        </p>
                    )}
                </div>
                {property.propertyType && (
                    <Badge variant="outline" className={`shrink-0 text-xs ${typeColor}`}>
                        {property.propertyType}
                    </Badge>
                )}
            </div>

            <CardContent className="flex flex-col gap-4 p-4 flex-1">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/30 rounded-md py-2">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                            <Bed className="h-3 w-3" />
                            <span className="text-xs">Beds</span>
                        </div>
                        <p className="font-semibold text-sm">{property.bedrooms ?? "—"}</p>
                    </div>
                    <div className="bg-muted/30 rounded-md py-2">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                            <Bath className="h-3 w-3" />
                            <span className="text-xs">Baths</span>
                        </div>
                        <p className="font-semibold text-sm">{property.bathrooms ?? "—"}</p>
                    </div>
                    <div className="bg-muted/30 rounded-md py-2">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                            <Maximize2 className="h-3 w-3" />
                            <span className="text-xs">Sqft</span>
                        </div>
                        <p className="font-semibold text-sm">{fmtNum(property.squareFootage)}</p>
                    </div>
                </div>

                {/* Financial info */}
                <div className="space-y-1.5">
                    {price && (
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                {property.price ? "List Price" : property.estimatedValue ? "Est. Value" : "Last Sale"}
                            </span>
                            <span className="font-semibold text-sm">{fmt(price)}</span>
                        </div>
                    )}
                    {property.rentEstimate && (
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                Est. Rent
                            </span>
                            <span className="font-semibold text-sm text-green-500">
                                {fmt(property.rentEstimate)}/mo
                            </span>
                        </div>
                    )}
                    {property.yearBuilt && (
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Year Built
                            </span>
                            <span className="text-sm">{property.yearBuilt}</span>
                        </div>
                    )}
                    {property.daysOnMarket !== undefined && (
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Days on Market
                            </span>
                            <span className="text-sm">{property.daysOnMarket}</span>
                        </div>
                    )}
                </div>

                {/* CTA — two buttons when selected, single prompt when not */}
                <div className="mt-auto" onClick={e => e.stopPropagation()}>
                    {selected ? (
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <Button
                                size="sm"
                                onClick={handleBRRRR}
                                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 text-xs"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                BRRRR
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleFlip}
                                className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 gap-1.5 text-xs"
                            >
                                <Hammer className="h-3.5 w-3.5" />
                                Flip/Fix
                            </Button>
                        </div>
                    ) : (
                        <p className="text-center text-xs text-muted-foreground py-1">
                            Click to analyze
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

"use client";

import * as React from "react";
import { useFormState } from "react-dom";
import { addProperty } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, Home, Building, Building2 } from "lucide-react";
import Link from "next/link";
import { AddressAutocomplete } from "@/components/properties/address-autocomplete";

const initialState = { error: "" };

const PROPERTY_TYPES = [
    { value: "sfh", label: "Single Family", sublabel: "SFH", icon: Home, color: "violet" },
    { value: "apartment", label: "Apartment", sublabel: "APT", icon: Building, color: "blue" },
    { value: "multifamily", label: "Multi-Family", sublabel: "MFH", icon: Building2, color: "amber" },
];

export default function AddPropertyPage() {
    const [state, formAction] = useFormState(addProperty, initialState);
    const [city, setCity] = React.useState("");
    const [province, setProvince] = React.useState("");
    const [zip, setZip] = React.useState("");
    const [propertyType, setPropertyType] = React.useState("sfh");
    const [units, setUnits] = React.useState(2);

    const isMultifamily = propertyType === "multifamily";

    const handlePlaceSelect = async (_address: string, placeId: string) => {
        try {
            const response = await fetch(`/api/places/details?placeId=${placeId}`);
            if (!response.ok) return;
            const data = await response.json();
            const components = data.addressComponents || [];
            components.forEach((c: any) => {
                const types = c.types;
                if (types.includes("locality")) setCity(c.longText);
                if (types.includes("administrative_area_level_1")) setProvince(c.shortText);
                if (types.includes("postal_code")) setZip(c.longText);
            });
        } catch (error) {
            console.error("Failed to fetch place details:", error);
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-2xl mx-auto">
            <Link href="/dashboard/properties" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Property</CardTitle>
                    <CardDescription>Enter the details of your new deal or asset.</CardDescription>
                </CardHeader>
                <CardContent>
                    {state?.error && (
                        <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {state.error}
                        </div>
                    )}
                    <form action={formAction} className="space-y-5">

                        {/* hidden fields for controlled state */}
                        <input type="hidden" name="property_type" value={propertyType} />
                        <input type="hidden" name="units" value={isMultifamily ? units : 1} />

                        {/* PROPERTY TYPE */}
                        <div className="space-y-2">
                            <Label>Property Type <span className="text-red-500">*</span></Label>
                            <div className="grid grid-cols-3 gap-3">
                                {PROPERTY_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    const isSelected = propertyType === type.value;
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setPropertyType(type.value)}
                                            className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
                                                isSelected
                                                    ? "border-violet-500 bg-violet-500/10 text-violet-400"
                                                    : "border-border bg-background text-muted-foreground hover:border-violet-400 hover:text-foreground"
                                            }`}
                                        >
                                            <Icon className="h-6 w-6" />
                                            <span className="text-sm font-semibold">{type.label}</span>
                                            <span className="text-xs opacity-70">{type.sublabel}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* UNITS — only for multifamily */}
                        {isMultifamily && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-amber-600" />
                                    <span className="text-sm font-semibold text-amber-800">Multi-Family Configuration</span>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="units_input" className="text-amber-800 text-xs font-bold uppercase">
                                        Number of Units
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setUnits(Math.max(2, units - 1))}
                                            className="h-9 w-9 rounded-lg border border-amber-300 bg-white text-amber-700 font-bold text-lg hover:bg-amber-100 transition-colors"
                                        >
                                            −
                                        </button>
                                        <Input
                                            id="units_input"
                                            type="number"
                                            min={2}
                                            max={50}
                                            value={units}
                                            onChange={(e) => setUnits(Math.max(2, parseInt(e.target.value) || 2))}
                                            className="w-20 text-center font-bold text-lg border-amber-300 focus-visible:ring-amber-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setUnits(Math.min(50, units + 1))}
                                            className="h-9 w-9 rounded-lg border border-amber-300 bg-white text-amber-700 font-bold text-lg hover:bg-amber-100 transition-colors"
                                        >
                                            +
                                        </button>
                                        <span className="text-sm text-amber-700 font-medium">rental units</span>
                                    </div>
                                </div>
                                <p className="text-xs text-amber-600">
                                    One property record with {units} tenant slots. Single equity & financials for the whole building.
                                </p>
                            </div>
                        )}

                        {/* ADDRESS */}
                        <div className="space-y-2">
                            <AddressAutocomplete name="address" onSelect={handlePlaceSelect} />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                                <Input id="city" name="city" placeholder="e.g. Miami" required value={city} onChange={(e) => setCity(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                                <Input id="state" name="state" placeholder="e.g. FL" required value={province} onChange={(e) => setProvince(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zip">Zip <span className="text-red-500">*</span></Label>
                                <Input id="zip" name="zip" placeholder="e.g. 33101" required value={zip} onChange={(e) => setZip(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                                <select
                                    name="status"
                                    id="status"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="analyzing">Analyzing (Lead)</option>
                                    <option value="owned">Owned (Portfolio)</option>
                                    <option value="rehab">In Rehab</option>
                                    <option value="active">Active (Rented)</option>
                                    <option value="sold">Sold</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="purchase_price">Purchase Price <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <Input id="purchase_price" name="purchase_price" type="number" placeholder="0.00" className="pl-7" required />
                                </div>
                            </div>
                        </div>

                        {/* FINANCIALS */}
                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <span className="bg-violet-100 text-violet-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                BRRRR Financials
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="arv_estimate">After Repair Value (ARV)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input id="arv_estimate" name="arv_estimate" type="number" placeholder="0.00" className="pl-7" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rehab_cost">Rehab Budget</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input id="rehab_cost" name="rehab_cost" type="number" placeholder="0.00" className="pl-7" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="monthly_rent">
                                        {isMultifamily ? `Rent per Unit (× ${units} = $${(parseFloat("0") * units || 0).toLocaleString()})` : "Est. Monthly Rent"}
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input id="monthly_rent" name="monthly_rent" type="number" placeholder="0.00" className="pl-7" />
                                    </div>
                                    {isMultifamily && (
                                        <p className="text-xs text-muted-foreground">Total rent roll will be rent × {units} units</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taxes_annual">Annual Taxes</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input id="taxes_annual" name="taxes_annual" type="number" placeholder="0.00" className="pl-7" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="insurance_annual">Annual Insurance</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input id="insurance_annual" name="insurance_annual" type="number" placeholder="0.00" className="pl-7" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SubmitButton className="w-full">Create Property</SubmitButton>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

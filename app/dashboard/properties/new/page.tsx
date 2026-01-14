"use client";

import * as React from "react";
import { useFormState } from "react-dom";
import { addProperty } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AddressAutocomplete } from "@/components/properties/address-autocomplete";

const initialState = {
    error: "",
};

export default function AddPropertyPage() {
    const [state, formAction] = useFormState(addProperty, initialState);

    // Auto-fill state
    const [city, setCity] = React.useState("");
    const [province, setProvince] = React.useState(""); // State
    const [zip, setZip] = React.useState("");

    const handlePlaceSelect = async (address: string, placeId: string) => {
        try {
            const response = await fetch(`/api/places/details?placeId=${placeId}`);
            if (!response.ok) return;
            const data = await response.json();

            // Parse address components
            /* 
               Google Address Components Types:
               locality = City
               administrative_area_level_1 = State
               postal_code = Zip
            */
            const components = data.addressComponents || [];
            let newCity = "";
            let newState = "";
            let newZip = "";

            components.forEach((c: any) => {
                const types = c.types;
                if (types.includes("locality")) newCity = c.longText;
                if (types.includes("administrative_area_level_1")) newState = c.shortText;
                if (types.includes("postal_code")) newZip = c.longText;
            });

            if (newCity) setCity(newCity);
            if (newState) setProvince(newState);
            if (newZip) setZip(newZip);

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
                        <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {state.error}
                        </div>
                    )}
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            {/* Replaced standard Input with AddressAutocomplete */}
                            <AddressAutocomplete
                                name="address"
                                onSelect={handlePlaceSelect}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="e.g. San Diego"
                                    required
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                                <Input
                                    id="state"
                                    name="state"
                                    placeholder="e.g. CA"
                                    required
                                    value={province}
                                    onChange={(e) => setProvince(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zip">Zip Code <span className="text-red-500">*</span></Label>
                                <Input
                                    id="zip"
                                    name="zip"
                                    placeholder="e.g. 92101"
                                    required
                                    value={zip}
                                    onChange={(e) => setZip(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                                <select
                                    name="status"
                                    id="status"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

                        {/* Financials Section */}
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
                                    <Label htmlFor="monthly_rent">Est. Monthly Rent</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input id="monthly_rent" name="monthly_rent" type="number" placeholder="0.00" className="pl-7" />
                                    </div>
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

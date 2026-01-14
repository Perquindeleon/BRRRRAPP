"use client";

import { useState } from "react";
import { addTenant } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Calendar, DollarSign, Plus, Phone, Mail } from "lucide-react";

export function TenantManager({ propertyId, tenants }: { propertyId: string, tenants: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Lease Agreements</h3>
                <Button onClick={() => { setIsAdding(!isAdding); setFormError(null); }} variant={isAdding ? "destructive" : "default"}>
                    {isAdding ? "Cancel" : "Add Tenant"}
                </Button>
            </div>

            {isAdding && (
                <Card className="bg-slate-50 border-indigo-100">
                    <CardHeader>
                        <CardTitle className="text-base">New Lease Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {formError && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm font-medium">
                                {formError}
                            </div>
                        )}
                        <form action={async (formData) => {
                            setFormError(null);
                            const result = await addTenant(formData);
                            if (result?.error) {
                                setFormError(result.error);
                            } else {
                                setIsAdding(false);
                                setFormError(null);
                            }
                        }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="hidden" name="property_id" value={propertyId} />

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Tenant Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input name="name" className="pl-9 text-black bg-white" placeholder="John Doe" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Rent Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input name="rent_amount" type="number" className="pl-9 bg-white text-black" placeholder="2000" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input name="email" type="email" className="pl-9 bg-white text-black" placeholder="john@example.com" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input name="phone" type="tel" className="pl-9 bg-white text-black" placeholder="(555) 555-5555" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Lease Start</label>
                                <Input name="lease_start" type="date" className="bg-white text-black" required />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Lease End</label>
                                <Input name="lease_end" type="date" className="bg-white text-black" required />
                            </div>

                            <div className="md:col-span-2 pt-2">
                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Create Lease Record</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
                {tenants.map(tenant => (
                    <Card key={tenant.id} className="overflow-hidden">
                        <div className="h-1 bg-emerald-500 w-full" />
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-lg">{tenant.name}</h4>
                                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold uppercase">Active</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {tenant.email || 'N/A'}</span>
                                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {tenant.phone || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-emerald-700">${tenant.rent_amount}</div>
                                    <div className="text-xs text-gray-400 uppercase font-bold">Monthly Rent</div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-500" />
                                    <span className="font-medium text-gray-700">Lease Term:</span>
                                    <span>{new Date(tenant.lease_start).toLocaleDateString()} - {new Date(tenant.lease_end).toLocaleDateString()}</span>
                                </div>
                                <Button variant="link" className="h-auto p-0 text-indigo-600">View Contract</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {tenants.length === 0 && !isAdding && (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50/50">
                        <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-foreground font-medium">No Active Tenants</h3>
                        <p className="text-gray-500 text-sm">Property is currently vacant.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

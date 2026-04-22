"use client";

import { useState } from "react";
import {
    Building,
    Building2,
    Home,
    Users,
    AlertCircle,
    Wallet,
    Search,
    Trash,
    Edit
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { useRouter } from "next/navigation";
import { deleteProperty, updateProperty } from "./actions";
import { estimatedMonthlyCashFlow } from "@/lib/finance";

const PROPERTY_TYPES = [
    { value: "sfh",         label: "Single Family",  icon: Home,      color: "violet" },
    { value: "apartment",   label: "Apartment",      icon: Building,  color: "blue"   },
    { value: "multifamily", label: "Multi-Family",   icon: Building2, color: "amber"  },
];

function MetricCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <h2 className="text-3xl font-bold mt-2 text-foreground">{value}</h2>
                </div>
                <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
            </CardContent>
        </Card>
    );
}

export default function PortfolioView({ initialData }: { initialData: any[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    // --- EDIT MODAL STATE ---
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editProp, setEditProp] = useState<any>(null);
    const [editType, setEditType] = useState("sfh");
    const [editUnits, setEditUnits] = useState(1);
    const [editError, setEditError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- METRICS ---
    const totalProperties = initialData.length;
    const allTenants = initialData.flatMap(p =>
        (p.tenants || []).map((t: any) => ({ ...t, property_address: p.address, property_id: p.id }))
    );
    const activeTenants = allTenants.filter(t => t.status === 'active');
    const propertiesWithTenants = initialData.filter(p => p.tenants && p.tenants.length > 0 && p.tenants.some((t: any) => t.status === 'active'));
    const occupancyRate = totalProperties > 0 ? Math.round((propertiesWithTenants.length / totalProperties) * 100) : 0;
    const monthlyRentRoll = activeTenants.reduce((sum, t) => sum + (t.rent_amount || 0), 0);
    const lateCount = allTenants.filter(t => t.status === 'late').length;

    const filteredProperties = initialData.filter(p =>
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tenants?.some((t: any) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openEdit = (prop: any) => {
        setEditProp(prop);
        setEditType(prop.property_type || "sfh");
        setEditUnits(prop.units || 1);
        setEditError(null);
        setIsEditOpen(true);
    };

    const handleDeleteProperty = async (id: string) => {
        if (confirm("Are you sure you want to DELETE this property?\nThis action cannot be undone and will remove all associated data.")) {
            await deleteProperty(id);
            router.refresh();
        }
    };

    return (
        <div className="space-y-6 font-sans">

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard label="OCCUPANCY" icon={Building} value={`${occupancyRate}%`} color="text-indigo-600" bg="bg-indigo-50" />
                <MetricCard label="RENT ROLL" icon={Wallet} value={`$${monthlyRentRoll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="text-emerald-600" bg="bg-emerald-50" />
                <MetricCard label="TENANTS" icon={Users} value={allTenants.length} color="text-violet-600" bg="bg-violet-50" />
                <MetricCard label="LATE" icon={AlertCircle} value={lateCount} color="text-red-500" bg="bg-red-50" />
            </div>

            <Card className="border-none shadow-sm bg-card overflow-hidden">
                <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search properties..."
                            className="pl-9 bg-background border-input focus-visible:ring-violet-500 hover:border-violet-300 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => router.push('/dashboard/properties/new')}>
                        <Building className="h-4 w-4 mr-2" /> Add Property
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium">Property Address</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium hidden md:table-cell">Market Rent</th>
                                <th className="px-6 py-3 font-medium hidden md:table-cell">Current Rent</th>
                                <th className="px-6 py-3 font-medium hidden md:table-cell">Cash Flow</th>
                                <th className="px-6 py-3 font-medium hidden md:table-cell">Tenant</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProperties.map((prop) => {
                                const propActiveTenants = (prop.tenants || []).filter((t: any) => t.status === 'active' || t.status === 'late');
                                const tenant = propActiveTenants[0];
                                const currentRent = prop.tenants?.reduce((sum: number, t: any) => sum + (t.rent_amount || 0), 0) || 0;
                                // Market Rent = actual sum of all tenant rent amounts (real data)
                                const marketRent = currentRent > 0
                                    ? currentRent
                                    : Math.round((prop.purchase_price || 0) * 0.008) * (prop.property_type === 'multifamily' ? (prop.units || 1) : 1);
                                let cashFlow: number | null = null;
                                let equity: number | null = null;
                                const financials = Array.isArray(prop.financials) ? prop.financials[0] : prop.financials;

                                if (financials) {
                                    const loanAmount = (prop.arv_estimate || prop.purchase_price || 0) * ((financials.refinance_ltv || 75) / 100);
                                    equity   = (prop.arv_estimate || prop.purchase_price || 0) - loanAmount;
                                    cashFlow = estimatedMonthlyCashFlow({
                                        rent:            currentRent,
                                        loanAmount,
                                        annualRate:      financials.refinance_rate || 7.0,
                                        taxesAnnual:     financials.taxes_annual,
                                        insuranceAnnual: financials.insurance_annual,
                                        managementRate:  financials.management_rate,
                                    });
                                }

                                return (
                                    <tr key={prop.id} className="hover:bg-violet-50/10 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/projects/${prop.id}`)}>
                                        <td className="px-6 py-4 font-medium">
                                            <div className="flex items-center gap-2">
                                                <span>{prop.address}</span>
                                                {prop.property_type === 'multifamily' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                                        <Building2 className="h-3 w-3" /> {prop.units || '?'} units
                                                    </span>
                                                )}
                                                {prop.property_type === 'apartment' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                                        <Building className="h-3 w-3" /> APT
                                                    </span>
                                                )}
                                                {(!prop.property_type || prop.property_type === 'sfh') && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
                                                        <Home className="h-3 w-3" /> SFH
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground font-normal">{prop.city}, {prop.state}</span>
                                                <span className="text-[10px] text-slate-500">• Purch: {new Date(prop.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={
                                                tenant ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none' :
                                                prop.status === 'rehab' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                'bg-muted text-muted-foreground border-border shadow-none'
                                            }>
                                                {prop.status === 'rehab' ? 'In Rehab' : tenant ? 'Occupied' : 'Vacant'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                                            <div className="flex flex-col">
                                                <span>${marketRent.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                                                {equity !== null && (
                                                    <span className="text-[10px] text-emerald-500/80">Eq: ${Math.round(equity / 1000)}k</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold hidden md:table-cell">
                                            ${currentRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 font-bold hidden md:table-cell">
                                            {cashFlow !== null ? (
                                                <span className={cashFlow >= 0 ? "text-emerald-400" : "text-red-400"}>
                                                    {cashFlow < 0 ? "-" : ""}${Math.abs(cashFlow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground border border-dashed border-slate-700 px-2 py-1 rounded hover:bg-slate-800"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/analyze/${prop.id}`); }}>
                                                    Add Data
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            {propActiveTenants.length === 0 ? (
                                                <span className="text-gray-400 italic text-xs">None</span>
                                            ) : prop.property_type === 'multifamily' ? (
                                                <div className="space-y-1">
                                                    {propActiveTenants.map((t: any) => (
                                                        <div key={t.id} className="flex items-center gap-1.5">
                                                            <div className="h-5 w-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                                {(t.name || '?').charAt(0)}
                                                            </div>
                                                            <span className="text-xs truncate max-w-[110px]">{t.name}</span>
                                                            {t.unit_number && (
                                                                <span className="text-[10px] text-muted-foreground shrink-0">{t.unit_number}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                                                        {(tenant.name || '?').charAt(0)}
                                                    </div>
                                                    <span>{tenant.name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-violet-100 hover:text-violet-600"
                                                    onClick={(e) => { e.stopPropagation(); openEdit(prop); }} title="Edit Property">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteProperty(prop.id); }} title="Delete Property">
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredProperties.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <Building className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No properties found.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* EDIT PROPERTY MODAL */}
            {editProp && (
                <SimpleDialog
                    isOpen={isEditOpen}
                    onClose={() => { setIsEditOpen(false); setEditError(null); }}
                    title={<><Edit className="h-4 w-4 text-violet-600" /> Edit Property</>}
                >
                    <form action={async (formData) => {
                        setIsSaving(true);
                        setEditError(null);
                        const res = await updateProperty(formData);
                        setIsSaving(false);
                        if (res?.error) { setEditError(res.error); }
                        else { setIsEditOpen(false); router.refresh(); }
                    }} className="p-6 space-y-5">
                        <input type="hidden" name="id" value={editProp.id} />
                        <input type="hidden" name="property_type" value={editType} />
                        <input type="hidden" name="units" value={editUnits} />

                        {editError && (
                            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">{editError}</div>
                        )}

                        {/* Property Type */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Property Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {PROPERTY_TYPES.map(({ value, label, icon: Icon, color }) => {
                                    const sel = editType === value;
                                    return (
                                        <button key={value} type="button" onClick={() => setEditType(value)}
                                            className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                                                sel
                                                    ? color === "violet" ? "border-violet-500 bg-violet-500/10 text-violet-400"
                                                    : color === "blue"   ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                                    :                      "border-violet-500 bg-violet-500/10 text-violet-400"
                                                    : "border-border text-muted-foreground hover:border-violet-400 hover:text-foreground"
                                            }`}>
                                            <Icon className="h-5 w-5" />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Units — only for multifamily */}
                        {editType === "multifamily" && (
                            <div className="p-3 bg-muted/50 border border-border rounded-lg space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Number of Units</label>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setEditUnits(Math.max(2, editUnits - 1))}
                                        className="h-8 w-8 rounded-lg border border-border bg-background text-foreground font-bold hover:bg-accent transition-colors">−</button>
                                    <Input type="number" min={2} max={50} value={editUnits}
                                        onChange={(e) => setEditUnits(Math.max(2, parseInt(e.target.value) || 2))}
                                        className="w-16 text-center font-bold focus-visible:ring-violet-500" />
                                    <button type="button" onClick={() => setEditUnits(Math.min(50, editUnits + 1))}
                                        className="h-8 w-8 rounded-lg border border-border bg-background text-foreground font-bold hover:bg-accent transition-colors">+</button>
                                    <span className="text-sm text-muted-foreground">units</span>
                                </div>
                            </div>
                        )}

                        {/* Status — key field to move deal → portfolio */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                            <Select name="status" defaultValue={editProp.status}>
                                <SelectTrigger className="focus:ring-violet-500 hover:border-violet-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="analyzing">🔍 Analyzing (Deal / Lead)</SelectItem>
                                    <SelectItem value="owned">🏠 Owned (Portfolio)</SelectItem>
                                    <SelectItem value="rehab">🔨 In Rehab</SelectItem>
                                    <SelectItem value="active">✅ Active (Rented)</SelectItem>
                                    <SelectItem value="sold">💰 Sold</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Address */}
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                                <Input name="address" defaultValue={editProp.address} className="focus-visible:ring-violet-500" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">City</label>
                                    <Input name="city" defaultValue={editProp.city} className="focus-visible:ring-violet-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">State</label>
                                    <Input name="state" defaultValue={editProp.state} className="focus-visible:ring-violet-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Zip</label>
                                    <Input name="zip" defaultValue={editProp.zip} className="focus-visible:ring-violet-500" />
                                </div>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="border-t pt-4 space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase">Financials</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Purchase Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                        <Input name="purchase_price" type="number" defaultValue={editProp.purchase_price} className="pl-7 focus-visible:ring-violet-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">ARV / Current Value</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                        <Input name="arv_estimate" type="number" defaultValue={editProp.arv_estimate} className="pl-7 focus-visible:ring-violet-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">
                                        {editType === "multifamily" ? `Rent / Unit (× ${editUnits})` : "Monthly Rent"}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                        <Input name="monthly_rent" type="number"
                                            defaultValue={editType === "multifamily" && editProp.financials
                                                ? Math.round((Array.isArray(editProp.financials) ? editProp.financials[0] : editProp.financials)?.monthly_rent / (editProp.units || 1))
                                                : (Array.isArray(editProp.financials) ? editProp.financials[0] : editProp.financials)?.monthly_rent}
                                            className="pl-7 focus-visible:ring-violet-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Annual Taxes</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                        <Input name="taxes_annual" type="number"
                                            defaultValue={(Array.isArray(editProp.financials) ? editProp.financials[0] : editProp.financials)?.taxes_annual}
                                            className="pl-7 focus-visible:ring-violet-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Annual Insurance</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                        <Input name="insurance_annual" type="number"
                                            defaultValue={(Array.isArray(editProp.financials) ? editProp.financials[0] : editProp.financials)?.insurance_annual}
                                            className="pl-7 focus-visible:ring-violet-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Rehab Cost</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                        <Input name="rehab_cost" type="number"
                                            defaultValue={(Array.isArray(editProp.financials) ? editProp.financials[0] : editProp.financials)?.rehab_cost}
                                            className="pl-7 focus-visible:ring-violet-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </SimpleDialog>
            )}
        </div>
    );
}

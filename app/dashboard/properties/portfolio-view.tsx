"use client";

import { useState } from "react";
import {
    Building,
    Users,
    AlertCircle,
    Wallet,
    Search,
    Plus,
    MoreHorizontal,
    Mail,
    Edit,
    Sparkles,
    X,
    Send,
    CheckCircle2,
    Loader2,
    Trash
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { addTenant, updateTenant, deleteTenant, getPayments, addPayment, deletePayment } from "../projects/actions";
import { deleteProperty } from "./actions";
import { SimpleDialog } from "@/components/ui/simple-dialog";



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

    // --- STATE FOR MODALS ---
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
    const [isEditTenantOpen, setIsEditTenantOpen] = useState(false);

    const [selectedTenant, setSelectedTenant] = useState<any>(null);
    const [selectedTenantForEmail, setSelectedTenantForEmail] = useState<any>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [emailDraft, setEmailDraft] = useState("");
    const [emailSubject, setEmailSubject] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    // --- PAYMENTS STATE ---
    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(false);

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

    // --- FILTERS ---
    const filteredProperties = initialData.filter(p =>
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tenants?.some((t: any) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredTenants = allTenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- HANDLERS ---
    const handleGenerateEmail = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setEmailSubject("Important Notice: Upcoming Maintenance");
            setEmailDraft(`Dear ${selectedTenantForEmail?.name || 'Tenant'},\n\nI hope this email finds you well.\n\nThis is to inform you that we have scheduled routine maintenance for the building on [Date]. Please let us know if you have any questions or concerns.\n\nBest regards,\nProperty Management`);
            setIsGenerating(false);
        }, 1500);
    };

    const handleSendEmail = () => {
        alert(`Email sent to ${selectedTenantForEmail?.email}! 🚀`);
        setIsAiOpen(false);
        setEmailDraft("");
        setEmailSubject("");
    };

    const handleDeleteTenant = async (id: string, propertyId: string) => {
        if (confirm("Are you sure you want to remove this tenant?")) {
            await deleteTenant(id, propertyId);
            router.refresh();
        }
    }

    const handleDeleteProperty = async (id: string) => {
        if (confirm("Are you sure you want to DELETE this property?\nThis action cannot be undone and will remove all associated data.")) {
            await deleteProperty(id);
            router.refresh(); // Refresh to update list
        }
    }

    const handleOpenPayments = async (tenant: any) => {
        setSelectedTenant(tenant);
        setIsPaymentsOpen(true);
        setIsLoadingPayments(true);
        try {
            const payments = await getPayments(tenant.id);
            setPaymentHistory(payments || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingPayments(false);
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
                <Tabs defaultValue="properties" className="w-full">

                    <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card">
                        <div className="flex items-center gap-4">
                            <TabsList className="bg-muted p-1">
                                <TabsTrigger value="properties" className="data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary">Properties</TabsTrigger>
                                <TabsTrigger value="tenants" className="data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary">Tenants</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-9 bg-background border-input focus-visible:ring-violet-500 hover:border-violet-300 transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button className="flex-1 sm:flex-none bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200 transition-all hover:scale-105" onClick={() => setIsAddTenantOpen(true)}>
                                    <Users className="h-4 w-4 mr-2" /> Add <span className="hidden sm:inline">Tenant</span>
                                </Button>
                                <Button variant="outline" className="flex-1 sm:flex-none border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => router.push('/dashboard/properties/new')}>
                                    <Building className="h-4 w-4 mr-2" /> Add <span className="hidden sm:inline">Property</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* PROPERTIES TABLE */}
                    <TabsContent value="properties" className="m-0">
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
                                        const tenant = prop.tenants?.[0]; // Just confirms occupancy
                                        const currentRent = prop.tenants?.reduce((sum: number, t: any) => sum + (t.rent_amount || 0), 0) || 0;
                                        const marketRent = Math.round((prop.purchase_price || 0) * 0.008);

                                        // Calculate Cash Flow
                                        let cashFlow: number | null = null;
                                        let equity: number | null = null;
                                        const financials = Array.isArray(prop.financials) ? prop.financials[0] : prop.financials;

                                        if (financials) {
                                            // Income (Actual only)
                                            const income = currentRent;

                                            // Expenses
                                            const taxesMo = (financials.taxes_annual || 0) / 12;
                                            const insMo = (financials.insurance_annual || 0) / 12;
                                            // Actually, for "Actual Cash Flow", vacancy is realized by 0 income. We shouldn't double count vacancy expense unless it's a "reserve".
                                            // Let's treat expenses as explicit costs (Tax, Ins, HOA, Utils, Mgmt).
                                            // Management is usually % of COLLECTED rent.
                                            const mgmt = income * ((financials.management_rate || 0) / 100);

                                            // Reserves (CapEx/Vacancy) - Users usually want to see "Net Cash Flow" including reserves.
                                            const reserves = (financials.monthly_rent || income) * (((financials.vacancy_rate || 0) + (financials.capex_rate || 0)) / 100);

                                            // Debt Service (PMT)
                                            let debtService = 0;
                                            const loanAmount = (prop.arv_estimate || prop.purchase_price || 0) * ((financials.refinance_ltv || 75) / 100);
                                            const rate = financials.refinance_rate || 7.0;
                                            if (loanAmount > 0 && rate > 0) {
                                                const r = rate / 100 / 12;
                                                const n = 360; // 30 years
                                                debtService = (loanAmount * r) / (1 - Math.pow(1 + r, -n));
                                            }

                                            // Equity Calculation
                                            // Equity = ARV (or Purchase) - Loan Balance
                                            const currentValue = prop.arv_estimate || prop.purchase_price || 0;
                                            const currentLoan = loanAmount; // Simplified, assuming Refi loan is the current debt
                                            equity = currentValue - currentLoan;

                                            // Note: If vacant, we still pay Tax, Ins, Debt. We implicitly don't pay Mgmt (if % of collected). 
                                            // Reserves are theoretical. Let's include Tax, Ins, Debt, HOA(0), Utilities(0). 
                                            // To be simple and robust:
                                            const fixedExpenses = taxesMo + insMo + debtService;
                                            const variableExpenses = mgmt; // + reserves if we want to be conservative

                                            cashFlow = income - (fixedExpenses + variableExpenses);
                                        }

                                        return (
                                            <tr key={prop.id} className="hover:bg-violet-50/10 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/projects/${prop.id}`)}>
                                                <td className="px-6 py-4 font-medium">
                                                    <div>{prop.address}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground font-normal">{prop.city}, {prop.state}</span>
                                                        <span className="text-[10px] text-slate-500">• Purch: {new Date(prop.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={`
                                                            ${tenant ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none' : prop.status === 'rehab' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-muted text-muted-foreground border-border shadow-none'}
                                                        `}>
                                                        {prop.status === 'rehab' ? 'In Rehab' : (tenant ? 'Occupied' : 'Vacant')}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                                                    <div className="flex flex-col">
                                                        <span>${marketRent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                        {equity !== null && (
                                                            <span className="text-[10px] text-emerald-500/80">Eq: ${Math.round(equity / 1000)}k</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold hidden md:table-cell">
                                                    ${currentRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 font-bold hidden md:table-cell">
                                                    {cashFlow !== null ? (
                                                        <span className={cashFlow >= 0 ? "text-emerald-400" : "text-red-400"}>
                                                            {cashFlow < 0 ? "-" : ""}${Math.abs(cashFlow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground border border-dashed border-slate-700 px-2 py-1 rounded hover:bg-slate-800" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/analyze/${prop.id}`); }}>
                                                            Add Data
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    {tenant ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                                                                {tenant.name.charAt(0)}
                                                            </div>
                                                            <span>{tenant.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">None</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteProperty(prop.id);
                                                        }}
                                                        title="Delete Property"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    {/* TENANTS TABLE */}
                    <TabsContent value="tenants" className="m-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Tenant</th>
                                        <th className="px-6 py-3 font-medium">Contact</th>
                                        <th className="px-6 py-3 font-medium">Property</th>
                                        <th className="px-6 py-3 font-medium">Financials</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTenants.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-violet-50/30 text-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                                                        {tenant.name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-foreground">{tenant.name}</span>
                                                    {tenant.unit_number && (
                                                        <Badge variant="outline" className="ml-2 bg-slate-50 text-slate-600 border-slate-200">
                                                            Unit {tenant.unit_number}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                                    <Mail className="h-3 w-3" /> {tenant.email || '-'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <div className="h-3 w-3" /> {tenant.phone || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-foreground">
                                                {tenant.property_address}
                                                {tenant.contract_url && (
                                                    <div className="mt-1">
                                                        <a href={tenant.contract_url} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center text-violet-600 hover:underline">
                                                            <span className="mr-1">📄</span> Contract
                                                        </a>
                                                    </div>
                                                )}

                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <div className="mb-1"><span className="text-muted-foreground w-8 inline-block">Rent:</span> <span className="font-bold text-foreground">${(tenant.rent_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={
                                                    tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-none' :
                                                        'bg-red-100 text-red-700 hover:bg-red-200 shadow-none border-none'
                                                }>
                                                    {tenant.status === 'active' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                                                    {tenant.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                                        onClick={() => handleOpenPayments(tenant)}
                                                        title="Payment History"
                                                    >
                                                        <Wallet className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50"
                                                        onClick={() => {
                                                            setSelectedTenantForEmail(tenant);
                                                            setIsAiOpen(true);
                                                        }}
                                                        title="Send Email"
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-gray-900"
                                                        onClick={() => {
                                                            setSelectedTenant(tenant);
                                                            setIsEditTenantOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                                                        onClick={() => handleDeleteTenant(tenant.id, tenant.property_id)}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>

            {/* --- AI COMPOSER MODAL --- */}
            <SimpleDialog
                isOpen={isAiOpen}
                onClose={() => setIsAiOpen(false)}
                title={<><Sparkles className="h-5 w-5 text-violet-600" /> AI Composer</>}
            >
                <div className="p-6 space-y-4">
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Topic</label>
                        <Select>
                            <SelectTrigger className="w-full focus:ring-violet-500 hover:border-violet-300">
                                <SelectValue placeholder="General Announcement" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General Announcement</SelectItem>
                                <SelectItem value="maintenance">Maintenance Notice</SelectItem>
                                <SelectItem value="payment">Payment Reminder</SelectItem>
                                <SelectItem value="rent_increase">Rent Increase</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-md shadow-violet-200 transition-all hover:scale-[1.02]"
                            onClick={handleGenerateEmail}
                            disabled={isGenerating}
                        >
                            {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Drafting...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Draft</>}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                        <Input
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Subject line..."
                            className="focus-visible:ring-violet-500 hover:border-violet-300 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Message Body</label>
                        <Textarea
                            className="min-h-[150px] resize-none focus-visible:ring-violet-500 hover:border-violet-300 transition-colors"
                            placeholder="Click generate to create an AI draft..."
                            value={emailDraft}
                            onChange={(e) => setEmailDraft(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setIsAiOpen(false)}>Cancel</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSendEmail}>
                            <Send className="h-4 w-4 mr-2" /> Send Now
                        </Button>
                    </div>
                </div>
            </SimpleDialog>

            {/* --- ADD TENANT MODAL --- */}
            <SimpleDialog
                isOpen={isAddTenantOpen}
                onClose={() => { setIsAddTenantOpen(false); setFormError(null); }}
                title="Add New Tenant"
            >
                <form action={async (formData) => {
                    setFormError(null);
                    const res = await addTenant(formData);
                    if (res?.error) {
                        setFormError(res.error);
                    } else {
                        setIsAddTenantOpen(false);
                        setFormError(null);
                        router.refresh();
                    }
                }} className="p-6 space-y-4">
                    {formError && (
                        <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm font-medium">
                            {formError}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Assign to Property</label>
                        <Select name="property_id" required>
                            <SelectTrigger className="focus:ring-violet-500 hover:border-violet-300">
                                <SelectValue placeholder="Select Property" />
                            </SelectTrigger>
                            <SelectContent>
                                {initialData.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                            <Input name="name" placeholder="Tenant Name" required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Unit / Apt</label>
                            <Input name="unit_number" placeholder="e.g. Apt 1" className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Monthly Rent</label>
                        <Input name="rent_amount" type="number" placeholder="$0.00" required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                        <Input name="email" type="email" placeholder="email@example.com" className="focus-visible:ring-violet-500 hover:border-violet-300" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                            <Input name="lease_start" type="date" required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
                            <Input name="lease_end" type="date" required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Lease Contract (PDF/Image)</label>
                        <Input name="contract" type="file" accept=".pdf,image/*" className="cursor-pointer file:cursor-pointer file:text-violet-600 file:font-semibold" />
                    </div>
                    <div className="pt-2">
                        <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200">Save Tenant</Button>
                    </div>
                </form>
            </SimpleDialog>

            {/* --- EDIT TENANT MODAL --- */}
            {
                selectedTenant && (
                    <SimpleDialog
                        isOpen={isEditTenantOpen}
                        onClose={() => { setIsEditTenantOpen(false); setFormError(null); }}
                        title="Edit Tenant"
                    >
                        <form action={async (formData) => {
                            setFormError(null);
                            const res = await updateTenant(formData);
                            if (res?.error) {
                                setFormError(res.error);
                            } else {
                                setIsEditTenantOpen(false);
                                setFormError(null);
                                router.refresh();
                            }
                        }} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm font-medium">
                                    {formError}
                                </div>
                            )}
                            <input type="hidden" name="id" value={selectedTenant.id} />
                            <input type="hidden" name="property_id" value={selectedTenant.property_id} />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                                    <Input name="name" defaultValue={selectedTenant.name} required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Unit / Apt</label>
                                    <Input name="unit_number" defaultValue={selectedTenant.unit_number} placeholder="e.g. Apt 1" className="focus-visible:ring-violet-500 hover:border-violet-300" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Monthly Rent</label>
                                <Input name="rent_amount" type="number" defaultValue={selectedTenant.rent_amount} required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                                <Input name="email" type="email" defaultValue={selectedTenant.email} className="focus-visible:ring-violet-500 hover:border-violet-300" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                                <Input name="phone" type="tel" defaultValue={selectedTenant.phone} className="focus-visible:ring-violet-500 hover:border-violet-300" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                                    <Input name="lease_start" type="date" defaultValue={selectedTenant.lease_start} className="focus-visible:ring-violet-500 hover:border-violet-300" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
                                    <Input name="lease_end" type="date" defaultValue={selectedTenant.lease_end} className="focus-visible:ring-violet-500 hover:border-violet-300" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                <Select name="status" defaultValue={selectedTenant.status}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="late">Late</SelectItem>
                                        <SelectItem value="eviction">Eviction</SelectItem>
                                        <SelectItem value="past">Past</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Lease Contract (Upload to replace)</label>
                                <Input name="contract" type="file" accept=".pdf,image/*" className="cursor-pointer file:cursor-pointer file:text-violet-600 file:font-semibold" />
                                {selectedTenant.contract_url && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Current: <a href={selectedTenant.contract_url} target="_blank" rel="noopener noreferrer" className="text-violet-600 underline hover:text-violet-700">View Contract</a>
                                    </p>
                                )}
                            </div>
                            <div className="pt-2">
                                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200">Update Tenant</Button>
                            </div>
                        </form>
                    </SimpleDialog >
                )
            }
            {/* --- PAYMENTS MODAL --- */}
            {
                selectedTenant && (
                    <SimpleDialog
                        isOpen={isPaymentsOpen}
                        onClose={() => setIsPaymentsOpen(false)}
                        title={`Payment History: ${selectedTenant.name}`}
                    >
                        <div className="p-6 space-y-6">
                            {/* New Payment Form */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-violet-600" /> Log New Payment
                                </h4>
                                <form action={async (formData) => {
                                    await addPayment(formData);
                                    // Refresh list
                                    const payments = await getPayments(selectedTenant.id);
                                    setPaymentHistory(payments || []);
                                    router.refresh();
                                }} className="grid gap-4">
                                    <input type="hidden" name="tenant_id" value={selectedTenant.id} />
                                    <input type="hidden" name="property_id" value={selectedTenant.property_id} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input name="amount" type="number" placeholder="Amount ($)" step="0.01" required className="bg-background" />
                                        <Input name="payment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="bg-background" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select name="method" defaultValue="transfer">
                                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="check">Check</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select name="status" defaultValue="paid">
                                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="late">Late</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input name="notes" placeholder="Notes (optional)" className="bg-background" />
                                    <Button size="sm" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Record Payment</Button>
                                </form>
                            </div>

                            {/* History List */}
                            <div className="max-h-[300px] overflow-y-auto space-y-3">
                                {isLoadingPayments ? (
                                    <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                ) : paymentHistory.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-4">No payments recorded yet.</p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Date</th>
                                                <th className="px-3 py-2 text-left">Amount</th>
                                                <th className="px-3 py-2 text-left">Method</th>
                                                <th className="px-3 py-2 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {paymentHistory.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-muted/50">
                                                    <td className="px-3 py-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                                    <td className="px-3 py-2 font-bold text-emerald-600">${payment.amount}</td>
                                                    <td className="px-3 py-2 text-muted-foreground capitalize">{payment.method}</td>
                                                    <td className="px-3 py-2 text-right">
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm("Delete this payment?")) {
                                                                    await deletePayment(payment.id);
                                                                    const updated = await getPayments(selectedTenant.id);
                                                                    setPaymentHistory(updated || []);
                                                                    router.refresh();
                                                                }
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash className="h-3 w-3" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </SimpleDialog>
                )
            }
        </div >
    );
}

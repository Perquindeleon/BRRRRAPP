"use client";

import { useState } from "react";
import {
    Users,
    AlertCircle,
    Wallet,
    Search,
    Plus,
    Mail,
    Edit,
    Sparkles,
    Send,
    CheckCircle2,
    Loader2,
    Trash,
    Phone,
    Clock,
    FileText,
    Building2,
    DoorOpen,
    UserPlus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { addTenant, updateTenant, deleteTenant, getPayments, addPayment, deletePayment } from "../projects/actions";
import { SimpleDialog } from "@/components/ui/simple-dialog";

type EmailLang = 'en' | 'es';
type EmailTopic = 'general' | 'maintenance' | 'payment' | 'rent_increase';

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

function getLeaseBadge(leaseEnd?: string) {
    if (!leaseEnd) return null;
    const end = new Date(leaseEnd);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
        return <Badge className="text-[10px] bg-red-100 text-red-700 border-none shadow-none ml-1">Expired</Badge>;
    }
    if (daysLeft <= 30) {
        return <Badge className="text-[10px] bg-amber-100 text-amber-700 border-none shadow-none ml-1">Exp. {daysLeft}d</Badge>;
    }
    return null;
}

function generateDraft(tenant: any, topic: EmailTopic, lang: EmailLang): { subject: string; body: string } {
    const name = tenant?.name || 'Tenant';
    const rent = tenant?.rent_amount ? `$${(tenant.rent_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '[Amount]';

    const templates: Record<EmailLang, Record<EmailTopic, { subject: string; body: string }>> = {
        en: {
            general: {
                subject: "General Announcement",
                body: `Dear ${name},\n\nI hope this email finds you well.\n\nThis is to inform you about an upcoming general announcement regarding your tenancy. Please don't hesitate to reach out if you have any questions.\n\nBest regards,\nProperty Management`
            },
            maintenance: {
                subject: "Important Notice: Upcoming Maintenance",
                body: `Dear ${name},\n\nI hope this email finds you well.\n\nThis is to inform you that we have scheduled routine maintenance for the building on [Date]. Please let us know if you have any questions or concerns.\n\nBest regards,\nProperty Management`
            },
            payment: {
                subject: "Friendly Reminder: Rent Payment Due",
                body: `Dear ${name},\n\nThis is a friendly reminder that your monthly rent payment of ${rent} is due on [Date].\n\nPlease ensure your payment is made on time to avoid any late fees. If you have already submitted your payment, please disregard this notice.\n\nThank you,\nProperty Management`
            },
            rent_increase: {
                subject: "Notice of Rent Adjustment",
                body: `Dear ${name},\n\nThis letter serves as formal notice that your monthly rent will be adjusted effective [Date].\n\nThe new monthly rent amount will be [New Amount]. Please review your lease agreement for details regarding this change.\n\nThank you for your understanding,\nProperty Management`
            }
        },
        es: {
            general: {
                subject: "Anuncio General",
                body: `Estimado/a ${name},\n\nEsperamos que se encuentre bien.\n\nLe escribimos para informarle sobre un anuncio general relacionado con su arrendamiento. No dude en contactarnos si tiene alguna pregunta.\n\nAtentamente,\nGestión de Propiedades`
            },
            maintenance: {
                subject: "Aviso Importante: Mantenimiento Programado",
                body: `Estimado/a ${name},\n\nEsperamos que se encuentre bien.\n\nLe informamos que hemos programado mantenimiento de rutina para el edificio el día [Fecha]. Por favor, háganos saber si tiene alguna pregunta o inquietud.\n\nAtentamente,\nGestión de Propiedades`
            },
            payment: {
                subject: "Recordatorio: Pago de Renta",
                body: `Estimado/a ${name},\n\nLe enviamos este mensaje para recordarle que su pago mensual de renta por ${rent} vence el [Fecha].\n\nPor favor, realice su pago a tiempo para evitar cargos adicionales. Si ya realizó su pago, puede ignorar este aviso.\n\nGracias,\nGestión de Propiedades`
            },
            rent_increase: {
                subject: "Aviso de Ajuste de Renta",
                body: `Estimado/a ${name},\n\nPor medio de la presente le comunicamos que, a partir del [Fecha], su renta mensual será ajustada a [Nuevo Monto].\n\nPor favor, revise su contrato de arrendamiento para más detalles sobre este cambio.\n\nGracias por su comprensión,\nGestión de Propiedades`
            }
        }
    };

    return templates[lang][topic];
}

export default function TenantsView({ initialData }: { initialData: any[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    // --- MODAL STATE ---
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
    const [isEditTenantOpen, setIsEditTenantOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<any>(null);
    const [selectedTenantForEmail, setSelectedTenantForEmail] = useState<any>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [addTenantType, setAddTenantType] = useState<'primary' | 'coliving'>('primary');
    const [selectedAddProperty, setSelectedAddProperty] = useState<string | null>(null);
    const [prefilledUnit, setPrefilledUnit] = useState<string>("");

    // --- EMAIL STATE ---
    const [emailTopic, setEmailTopic] = useState<EmailTopic>('general');
    const [emailLang, setEmailLang] = useState<EmailLang>('en');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [emailDraft, setEmailDraft] = useState("");
    const [emailSubject, setEmailSubject] = useState("");

    // --- PAYMENTS STATE ---
    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(false);

    // --- DATA ---
    const allTenants = initialData.flatMap(p =>
        (p.tenants || []).map((t: any) => ({ ...t, property_address: p.address, property_id: p.id }))
    );
    const activeTenants = allTenants.filter(t => t.status === 'active');
    const lateCount = allTenants.filter(t => t.status === 'late').length;
    const monthlyRentRoll = activeTenants.reduce((sum, t) => sum + (t.rent_amount || 0), 0);

    const filteredTenants = allTenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- HANDLERS ---
    const handleGenerateEmail = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const { subject, body } = generateDraft(selectedTenantForEmail, emailTopic, emailLang);
            setEmailSubject(subject);
            setEmailDraft(body);
            setIsGenerating(false);
        }, 900);
    };

    const handleSendEmail = async () => {
        if (!selectedTenantForEmail?.email) {
            setSendResult({ type: 'error', message: emailLang === 'es' ? 'El inquilino no tiene email registrado.' : 'This tenant has no email on file.' });
            return;
        }
        setIsSending(true);
        setSendResult(null);
        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: selectedTenantForEmail.email,
                    subject: emailSubject,
                    body: emailDraft,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setSendResult({ type: 'error', message: json.error || 'Failed to send email.' });
            } else {
                setSendResult({ type: 'success', message: emailLang === 'es' ? `¡Email enviado a ${selectedTenantForEmail.email}!` : `Email sent to ${selectedTenantForEmail.email}!` });
                setTimeout(() => {
                    setIsAiOpen(false);
                    setEmailDraft("");
                    setEmailSubject("");
                    setSendResult(null);
                }, 2000);
            }
        } catch (err: any) {
            setSendResult({ type: 'error', message: err.message });
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteTenant = async (id: string, propertyId: string) => {
        if (confirm("Are you sure you want to remove this tenant?")) {
            await deleteTenant(id, propertyId);
            router.refresh();
        }
    };

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

    const openEmailComposer = (tenant: any) => {
        setSelectedTenantForEmail(tenant);
        setEmailDraft("");
        setEmailSubject("");
        setSendResult(null);
        setIsAiOpen(true);
    };

    const openAddTenantForUnit = (propertyId: string, unitNumber: string) => {
        setAddTenantType('primary');
        setSelectedAddProperty(propertyId);
        setPrefilledUnit(unitNumber);
        setFormError(null);
        setIsAddTenantOpen(true);
    };

    // Multifamily properties with their unit map
    const multifamilyProperties = initialData.filter(p => p.property_type === 'multifamily' && (p.units || 0) > 1);

    return (
        <div className="space-y-6 font-sans">

            {/* METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="TOTAL TENANTS" icon={Users} value={allTenants.length} color="text-violet-600" bg="bg-violet-50" />
                <MetricCard label="ACTIVE" icon={CheckCircle2} value={activeTenants.length} color="text-emerald-600" bg="bg-emerald-50" />
                <MetricCard label="RENT ROLL" icon={Wallet} value={`$${monthlyRentRoll.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="text-blue-600" bg="bg-blue-50" />
                <MetricCard label="LATE" icon={AlertCircle} value={lateCount} color="text-red-500" bg="bg-red-50" />
            </div>

            {/* MULTIFAMILY UNITS PANEL */}
            {multifamilyProperties.length > 0 && (
                <div className="space-y-3">
                    {multifamilyProperties.map((prop) => {
                        const totalUnits: number = prop.units || 0;
                        const propTenants: any[] = (prop.tenants || []).filter((t: any) => t.status === 'active' || t.status === 'late');

                        // Build unit map: unit label -> tenant or null
                        const unitMap: Record<string, any> = {};
                        propTenants.forEach((t: any) => {
                            const key = t.unit_number || `Unit ${propTenants.indexOf(t) + 1}`;
                            unitMap[key] = t;
                        });

                        const units = Array.from({ length: totalUnits }, (_, i) => {
                            const label = `Unit ${i + 1}`;
                            // Try to match by unit_number
                            const tenant = propTenants.find((t: any) =>
                                t.unit_number === label ||
                                t.unit_number === String(i + 1) ||
                                t.unit_number === `${i + 1}`
                            ) ?? null;
                            return { label, tenant };
                        });

                        const occupiedCount = units.filter(u => u.tenant).length;

                        return (
                            <Card key={prop.id} className="border border-amber-200 bg-amber-50/30 shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-amber-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-amber-600" />
                                        <span className="font-semibold text-sm text-foreground">{prop.address}</span>
                                        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                                            {occupiedCount}/{totalUnits} occupied
                                        </span>
                                    </div>
                                    <div className="w-32 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-amber-500 transition-all"
                                            style={{ width: `${totalUnits > 0 ? (occupiedCount / totalUnits) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {units.map(({ label, tenant }) => (
                                        <div
                                            key={label}
                                            className={`relative rounded-xl border-2 p-3 flex flex-col gap-2 transition-all ${
                                                tenant
                                                    ? tenant.status === 'late'
                                                        ? 'border-red-300 bg-red-50'
                                                        : 'border-emerald-300 bg-emerald-50'
                                                    : 'border-dashed border-gray-300 bg-background hover:border-amber-400 hover:bg-amber-50/50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">{label}</span>
                                                {tenant ? (
                                                    <span className={`h-2 w-2 rounded-full ${tenant.status === 'late' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                ) : (
                                                    <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
                                                )}
                                            </div>

                                            {tenant ? (
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground truncate">{tenant.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">${(tenant.rent_amount || 0).toLocaleString()}/mo</p>
                                                    {tenant.status === 'late' && (
                                                        <span className="text-[10px] font-bold text-red-600">Late</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => openAddTenantForUnit(prop.id, label)}
                                                    className="flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-800 transition-colors mt-1"
                                                >
                                                    <UserPlus className="h-3 w-3" />
                                                    Assign
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Card className="border-none shadow-sm bg-card overflow-hidden">
                {/* HEADER */}
                <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search tenants..."
                            className="pl-9 bg-background border-input focus-visible:ring-violet-500 hover:border-violet-300 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200 transition-all hover:scale-105"
                        onClick={() => setIsAddTenantOpen(true)}
                    >
                        <Users className="h-4 w-4 mr-2" /> Add Tenant
                    </Button>
                </div>

                {/* TENANTS TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tenant</th>
                                <th className="px-6 py-3 font-medium">Contact</th>
                                <th className="px-6 py-3 font-medium">Property</th>
                                <th className="px-6 py-3 font-medium">Rent</th>
                                <th className="px-6 py-3 font-medium hidden md:table-cell">Lease</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-violet-50/30 text-gray-700 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                {tenant.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="font-medium text-foreground block">{tenant.name}</span>
                                                {tenant.unit_number && (
                                                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 mt-0.5">
                                                        Unit {tenant.unit_number}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {tenant.email && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                                <Mail className="h-3 w-3 flex-shrink-0" />
                                                <span>{tenant.email}</span>
                                            </div>
                                        )}
                                        {tenant.phone && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Phone className="h-3 w-3 flex-shrink-0" />
                                                <span>{tenant.phone}</span>
                                            </div>
                                        )}
                                        {!tenant.email && !tenant.phone && (
                                            <span className="text-muted-foreground italic">No contact</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-foreground">
                                        <span>{tenant.property_address}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <span className="font-bold text-foreground text-sm">
                                            ${(tenant.rent_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-muted-foreground">/mo</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs hidden md:table-cell">
                                        {tenant.lease_end ? (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-muted-foreground">
                                                    {new Date(tenant.lease_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                                </span>
                                                {getLeaseBadge(tenant.lease_end)}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground italic text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge className={
                                            tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-none' :
                                            tenant.status === 'late' ? 'bg-red-100 text-red-700 hover:bg-red-200 shadow-none border-none' :
                                            'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-none border-none'
                                        }>
                                            {tenant.status === 'active' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                                            {tenant.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
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
                                                onClick={() => openEmailComposer(tenant)}
                                                title="Send Email"
                                            >
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            {tenant.contract_url ? (
                                                <a
                                                    href={tenant.contract_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="View Signed Contract"
                                                    className="h-8 w-8 flex items-center justify-center rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </a>
                                            ) : (
                                                <span className="h-8 w-8 flex items-center justify-center rounded-md text-gray-200 cursor-default" title="No contract uploaded">
                                                    <FileText className="h-4 w-4" />
                                                </span>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-gray-900"
                                                onClick={() => {
                                                    setSelectedTenant(tenant);
                                                    setIsEditTenantOpen(true);
                                                }}
                                                title="Edit Tenant"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteTenant(tenant.id, tenant.property_id)}
                                                title="Remove Tenant"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTenants.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No tenants found.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* --- AI COMPOSER MODAL --- */}
            <SimpleDialog
                isOpen={isAiOpen}
                onClose={() => setIsAiOpen(false)}
                title={<><Sparkles className="h-5 w-5 text-violet-600" /> AI Composer</>}
            >
                <div className="p-6 space-y-4">
                    {selectedTenantForEmail && (
                        <div className="flex items-center gap-2 p-2 bg-violet-50 rounded-lg border border-violet-100">
                            <div className="h-7 w-7 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-xs font-bold">
                                {selectedTenantForEmail.name.charAt(0)}
                            </div>
                            <div className="text-xs">
                                <span className="font-medium text-foreground">{selectedTenantForEmail.name}</span>
                                {selectedTenantForEmail.email && (
                                    <span className="text-muted-foreground ml-1">· {selectedTenantForEmail.email}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Topic</label>
                            <Select value={emailTopic} onValueChange={(v) => setEmailTopic(v as EmailTopic)}>
                                <SelectTrigger className="focus:ring-violet-500 hover:border-violet-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General Announcement</SelectItem>
                                    <SelectItem value="maintenance">Maintenance Notice</SelectItem>
                                    <SelectItem value="payment">Payment Reminder</SelectItem>
                                    <SelectItem value="rent_increase">Rent Increase</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Language / Idioma</label>
                            <Select value={emailLang} onValueChange={(v) => setEmailLang(v as EmailLang)}>
                                <SelectTrigger className="focus:ring-violet-500 hover:border-violet-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">🇺🇸 English</SelectItem>
                                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-md shadow-violet-200 transition-all hover:scale-[1.02]"
                        onClick={handleGenerateEmail}
                        disabled={isGenerating}
                    >
                        {isGenerating
                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {emailLang === 'es' ? 'Generando...' : 'Drafting...'}</>
                            : <><Sparkles className="h-4 w-4 mr-2" /> {emailLang === 'es' ? 'Generar Borrador' : 'Generate Draft'}</>
                        }
                    </Button>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">{emailLang === 'es' ? 'Asunto' : 'Subject'}</label>
                        <Input
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder={emailLang === 'es' ? 'Línea de asunto...' : 'Subject line...'}
                            className="focus-visible:ring-violet-500 hover:border-violet-300 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">{emailLang === 'es' ? 'Cuerpo del mensaje' : 'Message Body'}</label>
                        <Textarea
                            className="min-h-[160px] resize-none focus-visible:ring-violet-500 hover:border-violet-300 transition-colors"
                            placeholder={emailLang === 'es' ? 'Haz clic en Generar para crear un borrador...' : 'Click generate to create an AI draft...'}
                            value={emailDraft}
                            onChange={(e) => setEmailDraft(e.target.value)}
                        />
                    </div>

                    {sendResult && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${sendResult.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {sendResult.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => { setIsAiOpen(false); setSendResult(null); }}>
                            {emailLang === 'es' ? 'Cancelar' : 'Cancel'}
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleSendEmail}
                            disabled={!emailDraft || isSending}
                        >
                            {isSending
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {emailLang === 'es' ? 'Enviando...' : 'Sending...'}</>
                                : <><Send className="h-4 w-4 mr-2" /> {emailLang === 'es' ? 'Enviar' : 'Send Now'}</>
                            }
                        </Button>
                    </div>
                </div>
            </SimpleDialog>

            {/* --- ADD TENANT MODAL --- */}
            <SimpleDialog
                isOpen={isAddTenantOpen}
                onClose={() => { setIsAddTenantOpen(false); setFormError(null); setAddTenantType('primary'); setSelectedAddProperty(null); setPrefilledUnit(""); }}
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
                        setAddTenantType('primary');
                        setSelectedAddProperty(null);
                        setPrefilledUnit("");
                        router.refresh();
                    }
                }} className="p-6 space-y-4">
                    <input type="hidden" name="is_coliving" value={addTenantType === 'coliving' ? 'true' : 'false'} />
                    {prefilledUnit && (
                        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>Assigning tenant to <strong>{prefilledUnit}</strong></span>
                        </div>
                    )}

                    {formError && (
                        <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm font-medium">
                            {formError}
                        </div>
                    )}

                    {/* Tenant type toggle */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tenant Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => { setAddTenantType('primary'); setSelectedAddProperty(null); }}
                                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${addTenantType === 'primary' ? 'bg-violet-600 text-white border-violet-600' : 'bg-background border-border text-muted-foreground hover:border-violet-300'}`}
                            >
                                🏠 Primary Tenant
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAddTenantType('coliving'); setSelectedAddProperty(null); }}
                                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${addTenantType === 'coliving' ? 'bg-amber-500 text-white border-amber-500' : 'bg-background border-border text-muted-foreground hover:border-amber-300'}`}
                            >
                                👥 Co-living / Co-tenant
                            </button>
                        </div>
                        {addTenantType === 'coliving' && (
                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                                Will be added to a property that already has a tenant. The rent amount is this co-tenant's individual share.
                            </p>
                        )}
                    </div>

                    {/* Property selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Assign to Property</label>
                        {addTenantType === 'primary' ? (
                            <Select name="property_id" required value={selectedAddProperty || undefined} onValueChange={(v) => setSelectedAddProperty(v)}>
                                <SelectTrigger className="focus:ring-violet-500 hover:border-violet-300">
                                    <SelectValue placeholder="Select vacant property..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(() => {
                                        const vacant = initialData.filter(p => !p.tenants?.some((t: any) => t.status === 'active'));
                                        const occupied = initialData.filter(p => p.tenants?.some((t: any) => t.status === 'active'));
                                        return (
                                            <>
                                                <SelectGroup>
                                                    <SelectLabel className="text-emerald-600">✓ Vacant — Available</SelectLabel>
                                                    {vacant.length === 0
                                                        ? <div className="px-8 py-2 text-xs text-muted-foreground italic">No vacant properties</div>
                                                        : vacant.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>
                                                        ))
                                                    }
                                                </SelectGroup>
                                                {occupied.length > 0 && (
                                                    <>
                                                        <SelectSeparator />
                                                        <SelectGroup>
                                                            <SelectLabel className="text-amber-600">⚠ Occupied (use Co-living instead)</SelectLabel>
                                                            {occupied.map(p => (
                                                                <SelectItem key={p.id} value={p.id} disabled>
                                                                    {p.address} — {p.tenants?.filter((t:any) => t.status === 'active').map((t:any) => t.name).join(', ')}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Select name="property_id" required onValueChange={(v) => setSelectedAddProperty(v)}>
                                <SelectTrigger className="focus:ring-amber-500 hover:border-amber-300 border-amber-300">
                                    <SelectValue placeholder="Select occupied property..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(() => {
                                        const occupied = initialData.filter(p => p.tenants?.some((t: any) => t.status === 'active'));
                                        const vacant = initialData.filter(p => !p.tenants?.some((t: any) => t.status === 'active'));
                                        return (
                                            <>
                                                <SelectGroup>
                                                    <SelectLabel className="text-amber-600">👥 Occupied — Co-living</SelectLabel>
                                                    {occupied.length === 0
                                                        ? <div className="px-8 py-2 text-xs text-muted-foreground italic">No occupied properties</div>
                                                        : occupied.map(p => {
                                                            const existingNames = p.tenants?.filter((t:any) => t.status === 'active').map((t:any) => t.name).join(', ');
                                                            return (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    <span>{p.address}</span>
                                                                    <span className="text-xs text-muted-foreground ml-1">· with {existingNames}</span>
                                                                </SelectItem>
                                                            );
                                                        })
                                                    }
                                                </SelectGroup>
                                                {vacant.length > 0 && (
                                                    <>
                                                        <SelectSeparator />
                                                        <SelectGroup>
                                                            <SelectLabel className="text-muted-foreground">Vacant (use Primary instead)</SelectLabel>
                                                            {vacant.map(p => (
                                                                <SelectItem key={p.id} value={p.id} disabled>{p.address}</SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Co-living: show existing tenants on selected property */}
                    {addTenantType === 'coliving' && selectedAddProperty && (() => {
                        const prop = initialData.find(p => p.id === selectedAddProperty);
                        const existing = prop?.tenants?.filter((t: any) => t.status === 'active') || [];
                        if (existing.length === 0) return null;
                        return (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs font-bold text-amber-700 mb-2 uppercase">Current tenants in this property</p>
                                <div className="space-y-1">
                                    {existing.map((t: any) => (
                                        <div key={t.id} className="flex items-center gap-2 text-xs text-amber-800">
                                            <div className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center font-bold text-[10px]">{t.name.charAt(0)}</div>
                                            <span className="font-medium">{t.name}</span>
                                            <span className="text-amber-600">· ${(t.rent_amount || 0).toLocaleString()} /mo</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                            <Input name="name" placeholder="Tenant Name" required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Unit / Room</label>
                            <Input
                                name="unit_number"
                                defaultValue={prefilledUnit}
                                placeholder={addTenantType === 'coliving' ? 'e.g. Room 2' : 'e.g. Unit 1'}
                                className="focus-visible:ring-violet-500 hover:border-violet-300"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            Monthly Rent {addTenantType === 'coliving' ? '(this co-tenant\'s share)' : ''}
                        </label>
                        <Input name="rent_amount" type="number" placeholder="$0.00" required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                            <Input name="email" type="email" placeholder="email@example.com" className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                            <Input name="phone" type="tel" placeholder="787-000-0000" className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Lease Start</label>
                            <Input name="lease_start" type="date" required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Lease End</label>
                            <Input name="lease_end" type="date" required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Signed Lease Contract</label>
                        <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${addTenantType === 'coliving' ? 'border-amber-300 hover:bg-amber-50/50' : 'border-violet-300 hover:bg-violet-50/50'}`}>
                            <div className="flex flex-col items-center justify-center gap-1">
                                <span className="text-2xl">📎</span>
                                <span className="text-xs font-medium text-muted-foreground">Click to attach signed contract</span>
                                <span className="text-[10px] text-muted-foreground">PDF or image — stored securely</span>
                            </div>
                            <Input name="contract" type="file" accept=".pdf,image/*" className="hidden" />
                        </label>
                    </div>
                    <div className="pt-2">
                        <Button type="submit" className={`w-full shadow-lg ${addTenantType === 'coliving' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-violet-600 hover:bg-violet-700 shadow-violet-200'}`}>
                            {addTenantType === 'coliving' ? '👥 Add Co-Tenant' : 'Save Tenant'}
                        </Button>
                    </div>
                </form>
            </SimpleDialog>

            {/* --- EDIT TENANT MODAL --- */}
            {selectedTenant && (
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                                <Input name="email" type="email" defaultValue={selectedTenant.email} className="focus-visible:ring-violet-500 hover:border-violet-300" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                                <Input name="phone" type="tel" defaultValue={selectedTenant.phone} className="focus-visible:ring-violet-500 hover:border-violet-300" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Lease Start</label>
                                <Input name="lease_start" type="date" defaultValue={selectedTenant.lease_start} className="focus-visible:ring-violet-500 hover:border-violet-300" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Lease End</label>
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
                            <label className="text-xs font-bold text-gray-500 uppercase">Signed Lease Contract</label>
                            {selectedTenant.contract_url && (
                                <a href={selectedTenant.contract_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-700 hover:bg-violet-100 transition-colors">
                                    <span>📄</span>
                                    <span className="font-medium">View current signed contract</span>
                                    <span className="text-violet-400 ml-auto">↗</span>
                                </a>
                            )}
                            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-violet-300 rounded-lg cursor-pointer hover:bg-violet-50/50 transition-colors">
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <span className="text-xl">📎</span>
                                    <span className="text-xs font-medium text-muted-foreground">{selectedTenant.contract_url ? 'Upload new contract (replaces current)' : 'Attach signed contract'}</span>
                                    <span className="text-[10px] text-muted-foreground">PDF or image</span>
                                </div>
                                <Input name="contract" type="file" accept=".pdf,image/*" className="hidden" />
                            </label>
                        </div>
                        <div className="pt-2">
                            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200">Update Tenant</Button>
                        </div>
                    </form>
                </SimpleDialog>
            )}

            {/* --- PAYMENTS MODAL --- */}
            {selectedTenant && (
                <SimpleDialog
                    isOpen={isPaymentsOpen}
                    onClose={() => setIsPaymentsOpen(false)}
                    title={`Payment History: ${selectedTenant.name}`}
                >
                    <div className="p-6 space-y-6">
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <Plus className="h-4 w-4 text-violet-600" /> Log New Payment
                            </h4>
                            <form action={async (formData) => {
                                await addPayment(formData);
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
            )}
        </div>
    );
}

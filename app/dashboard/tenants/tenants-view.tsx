"use client";

import { useState, useEffect } from "react";
import {
    Users, AlertCircle, Wallet, Search, Plus, Mail, Edit, Sparkles, Send,
    CheckCircle2, Loader2, Trash, Phone, Clock, FileText, Building2,
    DoorOpen, UserPlus, CalendarDays,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectGroup, SelectItem,
    SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import {
    addTenant, updateTenant, deleteTenant,
    getPayments, addPayment, deletePayment,
    applyLateFee, markRentPaid,
} from "../projects/actions";
import { SimpleDialog } from "@/components/ui/simple-dialog";

type EmailLang  = 'en' | 'es';
type EmailTopic = 'general' | 'maintenance' | 'payment' | 'rent_increase';
type LeaseType  = 'mtm' | '6mo' | '1yr' | 'custom';

/* ─── Formatting helpers ──────────────────────────────────────────────── */

function formatPhone(val: string): string {
    const d = val.replace(/\D/g, '').slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function currencyChange(val: string): { raw: string; display: string } {
    const stripped = val.replace(/[^0-9.]/g, '');
    if (!stripped) return { raw: '', display: '' };
    const dotIdx = stripped.indexOf('.');
    const intStr = dotIdx >= 0 ? stripped.slice(0, dotIdx) : stripped;
    const decStr = dotIdx >= 0 ? stripped.slice(dotIdx + 1, dotIdx + 3) : '';
    const intNum = parseInt(intStr || '0');
    const formatted = intNum.toLocaleString('en-US');
    const display = (decStr.length > 0 || stripped.endsWith('.'))
        ? `$${formatted}.${decStr}`
        : `$${formatted}`;
    const raw = decStr.length > 0 ? `${intNum}.${decStr}` : String(intNum);
    return { raw, display };
}

function addMonths(dateStr: string, months: number): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1 + months, d);
    return dt.toISOString().split('T')[0];
}

function calcEnd(start: string, type: LeaseType): string {
    if (!start || type === 'mtm' || type === 'custom') return '';
    return addMonths(start, type === '6mo' ? 6 : 12);
}

function splitName(name: string): { first: string; last: string } {
    const parts = (name || '').trim().split(' ');
    if (parts.length <= 1) return { first: parts[0] || '', last: '' };
    return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

const LEASE_OPTIONS: { value: LeaseType; label: string }[] = [
    { value: 'mtm',    label: 'Month to Month' },
    { value: '6mo',    label: '6 Months' },
    { value: '1yr',    label: '1 Year' },
    { value: 'custom', label: 'Custom Dates' },
];

/* ─── Sub-components ──────────────────────────────────────────────────── */

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
    if (daysLeft < 0)   return <Badge className="text-[10px] bg-red-100 text-red-700 border-none shadow-none ml-1">Expired</Badge>;
    if (daysLeft <= 30) return <Badge className="text-[10px] bg-amber-100 text-amber-700 border-none shadow-none ml-1">Exp. {daysLeft}d</Badge>;
    return null;
}

function generateDraft(tenant: any, topic: EmailTopic, lang: EmailLang): { subject: string; body: string } {
    const name = tenant?.name || 'Tenant';
    const rent = tenant?.rent_amount
        ? `$${(tenant.rent_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : '[Amount]';

    const templates: Record<EmailLang, Record<EmailTopic, { subject: string; body: string }>> = {
        en: {
            general:      { subject: "General Announcement", body: `Dear ${name},\n\nI hope this email finds you well.\n\nThis is to inform you about an upcoming general announcement regarding your tenancy. Please don't hesitate to reach out if you have any questions.\n\nBest regards,\nProperty Management` },
            maintenance:  { subject: "Important Notice: Upcoming Maintenance", body: `Dear ${name},\n\nWe have scheduled routine maintenance for the building on [Date]. Please let us know if you have any questions.\n\nBest regards,\nProperty Management` },
            payment:      { subject: "Friendly Reminder: Rent Payment Due", body: `Dear ${name},\n\nThis is a friendly reminder that your monthly rent payment of ${rent} is due on [Date].\n\nPlease ensure your payment is made on time to avoid any late fees.\n\nThank you,\nProperty Management` },
            rent_increase:{ subject: "Notice of Rent Adjustment", body: `Dear ${name},\n\nThis letter serves as formal notice that your monthly rent will be adjusted effective [Date].\n\nThe new monthly rent amount will be [New Amount].\n\nThank you for your understanding,\nProperty Management` },
        },
        es: {
            general:      { subject: "Anuncio General", body: `Estimado/a ${name},\n\nLe escribimos para informarle sobre un anuncio general relacionado con su arrendamiento.\n\nAtentamente,\nGestión de Propiedades` },
            maintenance:  { subject: "Aviso Importante: Mantenimiento Programado", body: `Estimado/a ${name},\n\nHemos programado mantenimiento de rutina para el edificio el día [Fecha].\n\nAtentamente,\nGestión de Propiedades` },
            payment:      { subject: "Recordatorio: Pago de Renta", body: `Estimado/a ${name},\n\nSu pago mensual de renta por ${rent} vence el [Fecha].\n\nGracias,\nGestión de Propiedades` },
            rent_increase:{ subject: "Aviso de Ajuste de Renta", body: `Estimado/a ${name},\n\nA partir del [Fecha], su renta mensual será ajustada a [Nuevo Monto].\n\nGracias,\nGestión de Propiedades` },
        },
    };

    return templates[lang][topic];
}

/* ─── Lease Section ───────────────────────────────────────────────────── */

function LeaseSection({
    leaseType, setLeaseType,
    leaseStart, setLeaseStart,
    leaseEnd, setLeaseEnd,
    accent = 'violet',
}: {
    leaseType: LeaseType; setLeaseType: (t: LeaseType) => void;
    leaseStart: string;   setLeaseStart: (d: string) => void;
    leaseEnd: string;     setLeaseEnd: (d: string) => void;
    accent?: string;
}) {
    const ring = accent === 'amber' ? 'focus:ring-amber-500 hover:border-amber-300' : 'focus:ring-violet-500 hover:border-violet-300';

    const handleTypeChange = (t: LeaseType) => {
        setLeaseType(t);
        if (t !== 'custom') setLeaseEnd(calcEnd(leaseStart, t));
    };

    const handleStartChange = (d: string) => {
        setLeaseStart(d);
        if (leaseType !== 'custom') setLeaseEnd(calcEnd(d, leaseType));
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> Lease Term
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                    {LEASE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleTypeChange(opt.value)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                                leaseType === opt.value
                                    ? accent === 'amber'
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-violet-600 text-white border-violet-600'
                                    : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {leaseType === 'mtm' ? (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                    <Input
                        type="date"
                        value={leaseStart}
                        onChange={e => handleStartChange(e.target.value)}
                        required
                        className={`focus-visible:ring-violet-500 ${ring}`}
                    />
                    <input type="hidden" name="lease_start" value={leaseStart} />
                    <input type="hidden" name="lease_end" value="" />
                    <p className="text-[11px] text-muted-foreground">Month-to-month — no fixed end date</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                        <Input
                            type="date"
                            value={leaseStart}
                            onChange={e => handleStartChange(e.target.value)}
                            required
                            className={`focus-visible:ring-violet-500 ${ring}`}
                        />
                        <input type="hidden" name="lease_start" value={leaseStart} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            End Date
                            {leaseType !== 'custom' && leaseEnd && (
                                <span className="ml-1 text-emerald-600 font-normal normal-case">(auto)</span>
                            )}
                        </label>
                        <Input
                            type="date"
                            value={leaseEnd}
                            onChange={e => setLeaseEnd(e.target.value)}
                            readOnly={leaseType !== 'custom'}
                            required
                            className={`focus-visible:ring-violet-500 ${ring} ${leaseType !== 'custom' ? 'bg-muted/50 cursor-default' : ''}`}
                        />
                        <input type="hidden" name="lease_end" value={leaseEnd} />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Main component ──────────────────────────────────────────────────── */

export default function TenantsView({ initialData, currentMonthPayments = [] }: { initialData: any[]; currentMonthPayments?: any[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    /* ── Modal state ── */
    const [isAiOpen,         setIsAiOpen]         = useState(false);
    const [isAddTenantOpen,  setIsAddTenantOpen]  = useState(false);
    const [isEditTenantOpen, setIsEditTenantOpen] = useState(false);
    const [selectedTenant,   setSelectedTenant]   = useState<any>(null);
    const [selectedTenantForEmail, setSelectedTenantForEmail] = useState<any>(null);
    const [formError,        setFormError]         = useState<string | null>(null);
    const [addTenantType,    setAddTenantType]     = useState<'primary' | 'coliving'>('primary');
    const [selectedAddProperty, setSelectedAddProperty] = useState<string | null>(null);
    const [prefilledUnit,    setPrefilledUnit]     = useState<string>("");

    /* ── Add form controlled state ── */
    const [addFirstName,    setAddFirstName]    = useState('');
    const [addLastName,     setAddLastName]     = useState('');
    const [addPhone,        setAddPhone]        = useState('');
    const [addRentRaw,      setAddRentRaw]      = useState('');
    const [addRentDisplay,  setAddRentDisplay]  = useState('');
    const [addLeaseType,    setAddLeaseType]    = useState<LeaseType>('1yr');
    const [addLeaseStart,   setAddLeaseStart]   = useState('');
    const [addLeaseEnd,     setAddLeaseEnd]     = useState('');
    const [addUnitSelected, setAddUnitSelected] = useState('');

    /* ── Edit form controlled state ── */
    const [editFirstName,   setEditFirstName]   = useState('');
    const [editLastName,    setEditLastName]     = useState('');
    const [editPhone,       setEditPhone]       = useState('');
    const [editRentRaw,     setEditRentRaw]     = useState('');
    const [editRentDisplay, setEditRentDisplay] = useState('');
    const [editLeaseType,   setEditLeaseType]   = useState<LeaseType>('custom');
    const [editLeaseStart,  setEditLeaseStart]  = useState('');
    const [editLeaseEnd,    setEditLeaseEnd]    = useState('');

    /* ── Email state ── */
    const [emailTopic,    setEmailTopic]    = useState<EmailTopic>('general');
    const [emailLang,     setEmailLang]     = useState<EmailLang>('en');
    const [isGenerating,  setIsGenerating]  = useState(false);
    const [isSending,     setIsSending]     = useState(false);
    const [sendResult,    setSendResult]    = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [emailDraft,    setEmailDraft]    = useState("");
    const [emailSubject,  setEmailSubject]  = useState("");

    /* ── Payments state ── */
    const [isPaymentsOpen,     setIsPaymentsOpen]     = useState(false);
    const [paymentHistory,     setPaymentHistory]     = useState<any[]>([]);
    const [isLoadingPayments,  setIsLoadingPayments]  = useState(false);

    /* ── Late tracker action state ── */
    const [applyingFeeId, setApplyingFeeId] = useState<string | null>(null);
    const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

    /* ── Payment form controlled state ── */
    const [pmtAmount,  setPmtAmount]  = useState('');
    const [pmtDate,    setPmtDate]    = useState(new Date().toISOString().split('T')[0]);
    const [pmtMethod,  setPmtMethod]  = useState('transfer');
    const [pmtStatus,  setPmtStatus]  = useState('paid');
    const [pmtNotes,   setPmtNotes]   = useState('');
    const [pmtLoading, setPmtLoading] = useState(false);
    const [pmtError,   setPmtError]   = useState<string | null>(null);
    const [pmtSuccess, setPmtSuccess] = useState(false);

    /* ── Init edit form when tenant selected ── */
    useEffect(() => {
        if (selectedTenant && isEditTenantOpen) {
            const { first, last } = splitName(selectedTenant.name || '');
            setEditFirstName(first);
            setEditLastName(last);
            setEditPhone(formatPhone(selectedTenant.phone || ''));
            const rent = selectedTenant.rent_amount || 0;
            setEditRentRaw(String(rent));
            setEditRentDisplay(rent ? '$' + parseFloat(String(rent)).toLocaleString('en-US') : '');
            setEditLeaseStart(selectedTenant.lease_start || '');
            setEditLeaseEnd(selectedTenant.lease_end || '');
            setEditLeaseType('custom');
        }
    }, [selectedTenant, isEditTenantOpen]);

    /* ── Reset add form ── */
    const resetAddForm = () => {
        setAddFirstName(''); setAddLastName('');
        setAddPhone('');
        setAddRentRaw(''); setAddRentDisplay('');
        setAddLeaseType('1yr'); setAddLeaseStart(''); setAddLeaseEnd('');
        setAddUnitSelected('');
        setAddTenantType('primary'); setSelectedAddProperty(null); setPrefilledUnit('');
        setFormError(null);
    };

    /* ── Data ── */
    const allTenants = initialData.flatMap(p =>
        (p.tenants || []).map((t: any) => ({ ...t, property_address: p.address, property_id: p.id }))
    );
    const activeTenants    = allTenants.filter(t => t.status === 'active');
    const lateCount        = allTenants.filter(t => t.status === 'late').length;
    const monthlyRentRoll  = activeTenants.reduce((sum, t) => sum + (t.rent_amount || 0), 0);

    const filteredTenants = allTenants.filter(t =>
        (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /* ── Late rent detection ── */
    const paidTenantIds = new Set(currentMonthPayments.map((p: any) => p.tenant_id));
    const today = new Date();
    const todayDay = today.getDate();

    const lateTenants = allTenants
        .filter(t => t.status !== 'past' && t.status !== 'eviction')
        .map(t => {
            const dueDay  = t.late_fee_day  ?? 5;
            const latePct = t.late_fee_pct  ?? 10;
            const paidThisMonth = paidTenantIds.has(t.id);
            const isOverdue     = todayDay > dueDay && !paidThisMonth;
            const daysLate      = isOverdue ? todayDay - dueDay : 0;
            const lateFee       = parseFloat(((t.rent_amount || 0) * (latePct / 100)).toFixed(2));
            const totalDue      = (t.rent_amount || 0) + lateFee;
            return { ...t, dueDay, latePct, paidThisMonth, isOverdue, daysLate, lateFee, totalDue };
        })
        .filter(t => t.isOverdue);

    /* ── Selected property for add form ── */
    const selectedProp      = initialData.find(p => p.id === selectedAddProperty);
    const isMultifamilyProp = selectedProp?.property_type === 'multifamily' && (selectedProp?.units || 0) > 1;
    const occupiedUnitSet   = new Set(
        (selectedProp?.tenants || [])
            .filter((t: any) => t.status === 'active' || t.status === 'late')
            .map((t: any) => t.unit_number)
            .filter(Boolean)
    );
    const availableUnits    = isMultifamilyProp
        ? Array.from({ length: selectedProp.units }, (_, i) => `Unit ${i + 1}`)
            .filter(u => !occupiedUnitSet.has(u))
        : [];

    /* ── Multifamily properties list ── */
    const multifamilyProperties = initialData.filter(
        p => p.property_type === 'multifamily' && (p.units || 0) > 1
    );

    /* ── Handlers ── */
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
        setIsSending(true); setSendResult(null);
        try {
            const res  = await fetch('/api/send-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: selectedTenantForEmail.email, subject: emailSubject, body: emailDraft }),
            });
            const json = await res.json();
            if (!res.ok) {
                setSendResult({ type: 'error', message: json.error || 'Failed to send email.' });
            } else {
                setSendResult({ type: 'success', message: emailLang === 'es' ? `¡Email enviado a ${selectedTenantForEmail.email}!` : `Email sent to ${selectedTenantForEmail.email}!` });
                setTimeout(() => { setIsAiOpen(false); setEmailDraft(""); setEmailSubject(""); setSendResult(null); }, 2000);
            }
        } catch (err: any) {
            setSendResult({ type: 'error', message: err.message });
        } finally { setIsSending(false); }
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
        setPmtAmount(''); setPmtDate(new Date().toISOString().split('T')[0]);
        setPmtMethod('transfer'); setPmtStatus('paid'); setPmtNotes(''); setPmtError(null);
        try {
            const payments = await getPayments(tenant.id);
            setPaymentHistory(payments || []);
        } catch (error) { console.error(error); }
        finally { setIsLoadingPayments(false); }
    };

    const handleRecordPayment = async () => {
        if (!selectedTenant || !pmtAmount) return;
        setPmtLoading(true); setPmtError(null);
        const res = await addPayment({
            tenantId:    selectedTenant.id,
            propertyId:  selectedTenant.property_id,
            amount:      parseFloat(pmtAmount) || 0,
            paymentDate: pmtDate,
            status:      pmtStatus,
            method:      pmtMethod,
            notes:       pmtNotes,
        });
        setPmtLoading(false);
        if (res?.error) {
            setPmtError(res.error);
        } else {
            // Full reset + success flash
            setPmtAmount('');
            setPmtDate(new Date().toISOString().split('T')[0]);
            setPmtMethod('transfer');
            setPmtStatus('paid');
            setPmtNotes('');
            setPmtError(null);
            setPmtSuccess(true);
            setTimeout(() => setPmtSuccess(false), 3000);
            const payments = await getPayments(selectedTenant.id);
            setPaymentHistory(payments || []);
            router.refresh();
        }
    };

    const openEmailComposer = (tenant: any) => {
        setSelectedTenantForEmail(tenant); setEmailDraft(""); setEmailSubject(""); setSendResult(null); setIsAiOpen(true);
    };

    const openAddTenantForUnit = (propertyId: string, unitNumber: string) => {
        resetAddForm();
        setAddTenantType('primary');
        setSelectedAddProperty(propertyId);
        setPrefilledUnit(unitNumber);
        setAddUnitSelected(unitNumber);
        setIsAddTenantOpen(true);
    };

    /* ═══════════════════════════════════════════════════════════════════ */
    return (
        <div className="space-y-6 font-sans">

            {/* METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="TOTAL TENANTS" icon={Users}        value={allTenants.length}   color="text-violet-600" bg="bg-violet-50" />
                <MetricCard label="ACTIVE"        icon={CheckCircle2} value={activeTenants.length} color="text-emerald-600" bg="bg-emerald-50" />
                <MetricCard label="RENT ROLL"     icon={Wallet}       value={`$${monthlyRentRoll.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="text-blue-600" bg="bg-blue-50" />
                <MetricCard label="LATE"          icon={AlertCircle}  value={lateCount}            color="text-red-500" bg="bg-red-50" />
            </div>

            {/* ── LATE RENT TRACKER ── */}
            {lateTenants.length > 0 && (
                <Card className="border border-red-200 bg-red-50/20 dark:bg-red-950/10 overflow-hidden">
                    <div className="px-5 py-3 border-b border-red-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="font-semibold text-sm text-foreground">Late Rent Tracker</span>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                {lateTenants.length} tenant{lateTenants.length > 1 ? 's' : ''} overdue
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Past day {lateTenants[0]?.dueDay} of {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>

                    <div className="divide-y divide-red-100">
                        {lateTenants.map(t => (
                            <div key={t.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Left: tenant info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm shrink-0">
                                        {(t.name || '?').charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-foreground truncate">{t.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {t.property_address}
                                            {t.unit_number ? ` · ${t.unit_number}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Center: amounts */}
                                <div className="flex items-center gap-4 text-sm shrink-0">
                                    <div className="text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Base Rent</p>
                                        <p className="font-bold">${(t.rent_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <span className="text-muted-foreground">+</span>
                                    <div className="text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Late Fee ({t.latePct}%)</p>
                                        <p className="font-bold text-red-600">+${t.lateFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <span className="text-muted-foreground">=</span>
                                    <div className="text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Due</p>
                                        <p className="font-bold text-red-700 text-base">${t.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Days Late</p>
                                        <p className="font-bold text-orange-600">{t.daysLate}d</p>
                                    </div>
                                </div>

                                {/* Right: actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-300 text-red-700 hover:bg-red-50 text-xs h-8"
                                        disabled={applyingFeeId === t.id}
                                        onClick={async () => {
                                            setApplyingFeeId(t.id);
                                            await applyLateFee(t.id, t.property_id, t.lateFee);
                                            setApplyingFeeId(null);
                                            router.refresh();
                                        }}
                                    >
                                        {applyingFeeId === t.id
                                            ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                            : <AlertCircle className="h-3 w-3 mr-1" />}
                                        Charge ${t.lateFee.toLocaleString('en-US', { minimumFractionDigits: 2 })} Fee
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                                        disabled={markingPaidId === t.id}
                                        onClick={async () => {
                                            setMarkingPaidId(t.id);
                                            await markRentPaid(t.id, t.property_id, t.totalDue);
                                            setMarkingPaidId(null);
                                            router.refresh();
                                        }}
                                    >
                                        {markingPaidId === t.id
                                            ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                            : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                        Mark Paid ${t.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* All good banner — shown when everyone paid */}
            {lateTenants.length === 0 && activeTenants.length > 0 && todayDay > 5 && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50/30 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    All tenants are up to date with rent payments this month.
                </div>
            )}

            {/* MULTIFAMILY UNITS PANEL */}
            {multifamilyProperties.length > 0 && (
                <div className="space-y-3">
                    {multifamilyProperties.map((prop) => {
                        const totalUnits: number = prop.units || 0;
                        const propTenants: any[] = (prop.tenants || []).filter((t: any) => t.status === 'active' || t.status === 'late');

                        const units = Array.from({ length: totalUnits }, (_, i) => {
                            const label = `Unit ${i + 1}`;
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
                                                        ? 'border-red-400/60 bg-red-500/10'
                                                        : 'border-amber-400/60 bg-amber-500/10'
                                                    : 'border-dashed border-border bg-background hover:border-amber-400 hover:bg-amber-500/5'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">{label}</span>
                                                {tenant ? (
                                                    <span className={`h-2 w-2 rounded-full ${tenant.status === 'late' ? 'bg-red-500' : 'bg-amber-500'}`} />
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
                                                    <UserPlus className="h-3 w-3" /> Assign
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

            {/* TENANTS TABLE */}
            <Card className="border-none shadow-sm bg-card overflow-hidden">
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
                        onClick={() => { resetAddForm(); setIsAddTenantOpen(true); }}
                    >
                        <Users className="h-4 w-4 mr-2" /> Add Tenant
                    </Button>
                </div>

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
                                                {(tenant.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="font-medium text-foreground block">{tenant.name}</span>
                                                {tenant.unit_number && (
                                                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 mt-0.5">
                                                        {tenant.unit_number}
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
                                        ) : tenant.lease_start ? (
                                            <span className="text-muted-foreground text-[11px]">Month-to-Month</span>
                                        ) : (
                                            <span className="text-muted-foreground italic text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge className={
                                            tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-none' :
                                            tenant.status === 'late'   ? 'bg-red-100 text-red-700 hover:bg-red-200 shadow-none border-none' :
                                                                          'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-none border-none'
                                        }>
                                            {tenant.status === 'active' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                                            {tenant.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleOpenPayments(tenant)} title="Payment History">
                                                <Wallet className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50" onClick={() => openEmailComposer(tenant)} title="Send Email">
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            {tenant.contract_url ? (
                                                <a href={tenant.contract_url} target="_blank" rel="noopener noreferrer" title="View Signed Contract" className="h-8 w-8 flex items-center justify-center rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                                                    <FileText className="h-4 w-4" />
                                                </a>
                                            ) : (
                                                <span className="h-8 w-8 flex items-center justify-center rounded-md text-gray-200 cursor-default" title="No contract">
                                                    <FileText className="h-4 w-4" />
                                                </span>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900" onClick={() => { setSelectedTenant(tenant); setIsEditTenantOpen(true); }} title="Edit Tenant">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteTenant(tenant.id, tenant.property_id)} title="Remove Tenant">
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

            {/* ════════════ AI COMPOSER MODAL ════════════ */}
            <SimpleDialog isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} title={<><Sparkles className="h-5 w-5 text-violet-600" /> AI Composer</>}>
                <div className="p-6 space-y-4">
                    {selectedTenantForEmail && (
                        <div className="flex items-center gap-2 p-2 bg-violet-50 rounded-lg border border-violet-100">
                            <div className="h-7 w-7 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-xs font-bold">
                                {(selectedTenantForEmail.name || '?').charAt(0)}
                            </div>
                            <div className="text-xs">
                                <span className="font-medium text-foreground">{selectedTenantForEmail.name}</span>
                                {selectedTenantForEmail.email && <span className="text-muted-foreground ml-1">· {selectedTenantForEmail.email}</span>}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Topic</label>
                            <Select value={emailTopic} onValueChange={(v) => setEmailTopic(v as EmailTopic)}>
                                <SelectTrigger className="focus:ring-violet-500 hover:border-violet-300"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General Announcement</SelectItem>
                                    <SelectItem value="maintenance">Maintenance Notice</SelectItem>
                                    <SelectItem value="payment">Payment Reminder</SelectItem>
                                    <SelectItem value="rent_increase">Rent Increase</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Language</label>
                            <Select value={emailLang} onValueChange={(v) => setEmailLang(v as EmailLang)}>
                                <SelectTrigger className="focus:ring-violet-500 hover:border-violet-300"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">🇺🇸 English</SelectItem>
                                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={handleGenerateEmail} disabled={isGenerating}>
                        {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Drafting…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Draft</>}
                    </Button>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                        <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject line..." className="focus-visible:ring-violet-500 hover:border-violet-300" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Message Body</label>
                        <Textarea className="min-h-[160px] resize-none focus-visible:ring-violet-500" placeholder="Click generate to create an AI draft..." value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
                    </div>
                    {sendResult && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${sendResult.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {sendResult.message}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => { setIsAiOpen(false); setSendResult(null); }}>Cancel</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSendEmail} disabled={!emailDraft || isSending}>
                            {isSending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : <><Send className="h-4 w-4 mr-2" />Send Now</>}
                        </Button>
                    </div>
                </div>
            </SimpleDialog>

            {/* ════════════ ADD TENANT MODAL ════════════ */}
            <SimpleDialog
                isOpen={isAddTenantOpen}
                onClose={() => { setIsAddTenantOpen(false); resetAddForm(); }}
                title="Add New Tenant"
            >
                <form
                    action={async (formData) => {
                        setFormError(null);
                        const res = await addTenant(formData);
                        if (res?.error) {
                            setFormError(res.error);
                        } else {
                            setIsAddTenantOpen(false);
                            resetAddForm();
                            router.refresh();
                        }
                    }}
                    className="p-6 space-y-4"
                >
                    {/* Hidden fields — these ensure FormData always has the values regardless of Radix Select sync */}
                    <input type="hidden" name="name"        value={`${addFirstName.trim()} ${addLastName.trim()}`.trim() || 'Unnamed'} />
                    <input type="hidden" name="is_coliving" value={addTenantType === 'coliving' ? 'true' : 'false'} />
                    <input type="hidden" name="property_id" value={selectedAddProperty || ''} />

                    {prefilledUnit && (
                        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>Assigning tenant to <strong>{prefilledUnit}</strong></span>
                        </div>
                    )}
                    {formError && (
                        <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm font-medium">{formError}</div>
                    )}

                    {/* Tenant type toggle */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tenant Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => { setAddTenantType('primary'); setSelectedAddProperty(null); }}
                                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${addTenantType === 'primary' ? 'bg-violet-600 text-white border-violet-600' : 'bg-background border-border text-muted-foreground hover:border-violet-300'}`}>
                                🏠 Primary Tenant
                            </button>
                            <button type="button" onClick={() => { setAddTenantType('coliving'); setSelectedAddProperty(null); }}
                                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${addTenantType === 'coliving' ? 'bg-amber-500 text-white border-amber-500' : 'bg-background border-border text-muted-foreground hover:border-amber-300'}`}>
                                👥 Co-Tenant
                            </button>
                        </div>
                    </div>

                    {/* Property selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Assign to Property</label>
                        {addTenantType === 'primary' ? (
                            <Select value={selectedAddProperty || undefined} onValueChange={(v) => { setSelectedAddProperty(v); setAddUnitSelected(''); }}>
                                <SelectTrigger className="focus:ring-violet-500 hover:border-violet-300">
                                    <SelectValue placeholder="Select vacant property…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(() => {
                                        const vacant   = initialData.filter(p => !p.tenants?.some((t: any) => t.status === 'active'));
                                        const occupied = initialData.filter(p =>  p.tenants?.some((t: any) => t.status === 'active'));
                                        return (<>
                                            <SelectGroup>
                                                <SelectLabel className="text-emerald-600">✓ Vacant — Available</SelectLabel>
                                                {vacant.length === 0
                                                    ? <div className="px-8 py-2 text-xs text-muted-foreground italic">No vacant properties</div>
                                                    : vacant.map(p => <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>)
                                                }
                                            </SelectGroup>
                                            {occupied.length > 0 && (<>
                                                <SelectSeparator />
                                                <SelectGroup>
                                                    <SelectLabel className="text-amber-600">⚠ Occupied — use Co-Tenant</SelectLabel>
                                                    {occupied.map(p => (
                                                        <SelectItem key={p.id} value={p.id} disabled>{p.address}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </>)}
                                        </>);
                                    })()}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Select onValueChange={(v) => setSelectedAddProperty(v)}>
                                <SelectTrigger className="focus:ring-amber-500 hover:border-amber-300 border-amber-300">
                                    <SelectValue placeholder="Select occupied property…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(() => {
                                        const occupied = initialData.filter(p =>  p.tenants?.some((t: any) => t.status === 'active'));
                                        const vacant   = initialData.filter(p => !p.tenants?.some((t: any) => t.status === 'active'));
                                        return (<>
                                            <SelectGroup>
                                                <SelectLabel className="text-amber-600">👥 Occupied — Co-living</SelectLabel>
                                                {occupied.length === 0
                                                    ? <div className="px-8 py-2 text-xs text-muted-foreground italic">No occupied properties</div>
                                                    : occupied.map(p => {
                                                        const names = p.tenants?.filter((t:any) => t.status === 'active').map((t:any) => t.name).join(', ');
                                                        return (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                <span>{p.address}</span>
                                                                <span className="text-xs text-muted-foreground ml-1">· with {names}</span>
                                                            </SelectItem>
                                                        );
                                                    })
                                                }
                                            </SelectGroup>
                                            {vacant.length > 0 && (<>
                                                <SelectSeparator />
                                                <SelectGroup>
                                                    <SelectLabel className="text-muted-foreground">Vacant (use Primary instead)</SelectLabel>
                                                    {vacant.map(p => <SelectItem key={p.id} value={p.id} disabled>{p.address}</SelectItem>)}
                                                </SelectGroup>
                                            </>)}
                                        </>);
                                    })()}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Unit selector (multifamily) or text input */}
                    {selectedAddProperty && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Unit / Apartment</label>
                            {isMultifamilyProp ? (
                                availableUnits.length > 0 ? (
                                    <Select
                                        name="unit_number"
                                        value={addUnitSelected}
                                        onValueChange={setAddUnitSelected}
                                        required
                                    >
                                        <SelectTrigger className="focus:ring-violet-500 hover:border-violet-300">
                                            <SelectValue placeholder="Select available unit…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUnits.map(u => (
                                                <SelectItem key={u} value={u}>{u} — Available</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                        All units are currently occupied in this property.
                                    </div>
                                )
                            ) : (
                                <Input
                                    name="unit_number"
                                    value={addUnitSelected}
                                    onChange={e => setAddUnitSelected(e.target.value)}
                                    placeholder={addTenantType === 'coliving' ? 'e.g. Room 2' : 'e.g. Apt 1 (optional)'}
                                    className="focus-visible:ring-violet-500 hover:border-violet-300"
                                />
                            )}
                        </div>
                    )}

                    {/* First + Last Name */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                            <Input
                                value={addFirstName}
                                onChange={e => setAddFirstName(e.target.value)}
                                placeholder="First"
                                required
                                className="focus-visible:ring-violet-500 hover:border-violet-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                            <Input
                                value={addLastName}
                                onChange={e => setAddLastName(e.target.value)}
                                placeholder="Last"
                                className="focus-visible:ring-violet-500 hover:border-violet-300"
                            />
                        </div>
                    </div>

                    {/* Monthly Rent — currency mask */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            Monthly Rent {addTenantType === 'coliving' ? "(this co-tenant's share)" : ''}
                        </label>
                        <Input
                            value={addRentDisplay}
                            onChange={e => {
                                const { raw, display } = currencyChange(e.target.value);
                                setAddRentRaw(raw); setAddRentDisplay(display);
                            }}
                            placeholder="$0"
                            required
                            className="focus-visible:ring-violet-500 hover:border-violet-300"
                        />
                        <input type="hidden" name="rent_amount" value={addRentRaw} />
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                            <Input name="email" type="email" placeholder="email@example.com" className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                            <Input
                                value={addPhone}
                                onChange={e => setAddPhone(formatPhone(e.target.value))}
                                placeholder="(305) 555-1234"
                                maxLength={14}
                                className="focus-visible:ring-violet-500 hover:border-violet-300"
                            />
                            <input type="hidden" name="phone" value={addPhone} />
                        </div>
                    </div>

                    {/* Hidden unit_number — ensures FormData has the value from the Select */}
                    <input type="hidden" name="unit_number" value={addUnitSelected || ''} />

                    {/* Lease section */}
                    <LeaseSection
                        leaseType={addLeaseType}   setLeaseType={setAddLeaseType}
                        leaseStart={addLeaseStart} setLeaseStart={setAddLeaseStart}
                        leaseEnd={addLeaseEnd}     setLeaseEnd={setAddLeaseEnd}
                        accent={addTenantType === 'coliving' ? 'amber' : 'violet'}
                    />

                    {/* Contract upload */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Signed Lease Contract</label>
                        <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${addTenantType === 'coliving' ? 'border-amber-300 hover:bg-amber-50/50' : 'border-violet-300 hover:bg-violet-50/50'}`}>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-2xl">📎</span>
                                <span className="text-xs font-medium text-muted-foreground">Click to attach signed contract</span>
                                <span className="text-[10px] text-muted-foreground">PDF or image — stored securely</span>
                            </div>
                            <Input name="contract" type="file" accept=".pdf,image/*" className="hidden" />
                        </label>
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className={`w-full shadow-lg ${addTenantType === 'coliving' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-violet-600 hover:bg-violet-700 shadow-violet-200'}`}
                        >
                            {addTenantType === 'coliving' ? '👥 Add Co-Tenant' : 'Save Tenant'}
                        </Button>
                    </div>
                </form>
            </SimpleDialog>

            {/* ════════════ EDIT TENANT MODAL ════════════ */}
            {selectedTenant && (
                <SimpleDialog isOpen={isEditTenantOpen} onClose={() => { setIsEditTenantOpen(false); setFormError(null); }} title="Edit Tenant">
                    <form
                        action={async (formData) => {
                            setFormError(null);
                            const res = await updateTenant(formData);
                            if (res?.error) { setFormError(res.error); }
                            else { setIsEditTenantOpen(false); setFormError(null); router.refresh(); }
                        }}
                        className="p-6 space-y-4"
                    >
                        {formError && <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm font-medium">{formError}</div>}
                        <input type="hidden" name="id"          value={selectedTenant.id} />
                        <input type="hidden" name="property_id" value={selectedTenant.property_id} />
                        {/* Combined name hidden input */}
                        <input type="hidden" name="name" value={`${editFirstName.trim()} ${editLastName.trim()}`.trim() || selectedTenant.name} />

                        {/* First + Last Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                                <Input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} required className="focus-visible:ring-violet-500 hover:border-violet-300" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                                <Input value={editLastName} onChange={e => setEditLastName(e.target.value)} className="focus-visible:ring-violet-500 hover:border-violet-300" />
                            </div>
                        </div>

                        {/* Unit */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Unit / Apt</label>
                            <Input name="unit_number" defaultValue={selectedTenant.unit_number} placeholder="e.g. Apt 1" className="focus-visible:ring-violet-500 hover:border-violet-300" />
                        </div>

                        {/* Monthly Rent — currency mask */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Monthly Rent</label>
                            <Input
                                value={editRentDisplay}
                                onChange={e => {
                                    const { raw, display } = currencyChange(e.target.value);
                                    setEditRentRaw(raw); setEditRentDisplay(display);
                                }}
                                placeholder="$0"
                                required
                                className="focus-visible:ring-violet-500 hover:border-violet-300"
                            />
                            <input type="hidden" name="rent_amount" value={editRentRaw} />
                        </div>

                        {/* Email + Phone */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                                <Input name="email" type="email" defaultValue={selectedTenant.email} className="focus-visible:ring-violet-500 hover:border-violet-300" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                                <Input
                                    value={editPhone}
                                    onChange={e => setEditPhone(formatPhone(e.target.value))}
                                    placeholder="(305) 555-1234"
                                    maxLength={14}
                                    className="focus-visible:ring-violet-500 hover:border-violet-300"
                                />
                                <input type="hidden" name="phone" value={editPhone} />
                            </div>
                        </div>

                        {/* Lease section */}
                        <LeaseSection
                            leaseType={editLeaseType}   setLeaseType={setEditLeaseType}
                            leaseStart={editLeaseStart} setLeaseStart={setEditLeaseStart}
                            leaseEnd={editLeaseEnd}     setLeaseEnd={setEditLeaseEnd}
                        />

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                            <Select name="status" defaultValue={selectedTenant.status}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="late">Late</SelectItem>
                                    <SelectItem value="eviction">Eviction</SelectItem>
                                    <SelectItem value="past">Past</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Late Fee Settings */}
                        <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Late Fee Settings</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500">Due Day of Month</label>
                                    <div className="relative">
                                        <Input name="late_fee_day" type="number" min={1} max={28} defaultValue={selectedTenant.late_fee_day ?? 5} className="focus-visible:ring-violet-500" />
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">day</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Rent is due on this day each month</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500">Late Fee</label>
                                    <div className="relative">
                                        <Input name="late_fee_pct" type="number" min={0} max={50} step={0.5} defaultValue={selectedTenant.late_fee_pct ?? 10} className="focus-visible:ring-violet-500" />
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Added after the due day</p>
                                </div>
                            </div>
                        </div>

                        {/* Contract upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Signed Lease Contract</label>
                            {selectedTenant.contract_url && (
                                <a href={selectedTenant.contract_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-700 hover:bg-violet-100 transition-colors">
                                    <span>📄</span><span className="font-medium">View current signed contract</span><span className="text-violet-400 ml-auto">↗</span>
                                </a>
                            )}
                            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-violet-300 rounded-lg cursor-pointer hover:bg-violet-50/50 transition-colors">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xl">📎</span>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {selectedTenant.contract_url ? 'Upload new contract (replaces current)' : 'Attach signed contract'}
                                    </span>
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

            {/* ════════════ PAYMENTS MODAL ════════════ */}
            {selectedTenant && (
                <SimpleDialog
                    isOpen={isPaymentsOpen}
                    onClose={() => setIsPaymentsOpen(false)}
                    title={
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            <span>Payment History — {selectedTenant.name}</span>
                        </div>
                    }
                >
                    <div className="p-6 space-y-5">

                        {/* ── Log New Payment ── */}
                        <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-3">
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Plus className="h-4 w-4 text-violet-600" /> Log New Payment
                            </h4>

                            {/* Amount + Date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">$</span>
                                        <Input
                                            value={pmtAmount}
                                            onChange={e => setPmtAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                            placeholder="0.00"
                                            className="pl-6 bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Payment Date</label>
                                    <Input
                                        type="date"
                                        value={pmtDate}
                                        onChange={e => setPmtDate(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                            </div>

                            {/* Method + Status */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Method</label>
                                    <Select value={pmtMethod} onValueChange={setPmtMethod}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="check">Check</SelectItem>
                                            <SelectItem value="zelle">Zelle / Venmo</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
                                    <Select value={pmtStatus} onValueChange={setPmtStatus}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="paid">✅ Paid</SelectItem>
                                            <SelectItem value="pending">⏳ Pending</SelectItem>
                                            <SelectItem value="late">🔴 Late</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Notes */}
                            <Input
                                value={pmtNotes}
                                onChange={e => setPmtNotes(e.target.value)}
                                placeholder="Notes (optional)"
                                className="bg-background"
                            />

                            {pmtError && (
                                <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded p-2">{pmtError}</p>
                            )}
                            {pmtSuccess && (
                                <p className="text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded p-2 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Payment recorded successfully
                                </p>
                            )}

                            <Button
                                onClick={handleRecordPayment}
                                disabled={pmtLoading || !pmtAmount}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {pmtLoading
                                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Recording…</>
                                    : <><CheckCircle2 className="h-4 w-4 mr-2" />Record Payment</>
                                }
                            </Button>
                        </div>

                        {/* ── Payment History ── */}
                        <div>
                            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" /> Full Payment History
                            </h4>

                            {isLoadingPayments ? (
                                <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                            ) : paymentHistory.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No payments recorded yet.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Summary strip */}
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        {(() => {
                                            const paid    = paymentHistory.filter(p => p.status === 'paid');
                                            const pending = paymentHistory.filter(p => p.status === 'pending');
                                            const totalPaid = paid.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
                                            return (<>
                                                <div className="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                                    <p className="text-[10px] text-muted-foreground uppercase">Total Paid</p>
                                                    <p className="font-bold text-emerald-700">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <div className="text-center p-2 rounded-lg bg-muted/30 border border-border">
                                                    <p className="text-[10px] text-muted-foreground uppercase">Payments</p>
                                                    <p className="font-bold">{paid.length}</p>
                                                </div>
                                                <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-100">
                                                    <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                                                    <p className="font-bold text-amber-700">{pending.length}</p>
                                                </div>
                                            </>);
                                        })()}
                                    </div>

                                    <div className="max-h-[260px] overflow-y-auto rounded-lg border border-border">
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Date</th>
                                                    <th className="px-3 py-2 text-left">Amount</th>
                                                    <th className="px-3 py-2 text-left">Method</th>
                                                    <th className="px-3 py-2 text-left">Status</th>
                                                    <th className="px-3 py-2 text-left">Notes</th>
                                                    <th className="px-3 py-2 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {paymentHistory.map((pmt) => (
                                                    <tr key={pmt.id} className="hover:bg-muted/40">
                                                        <td className="px-3 py-2 text-xs whitespace-nowrap">
                                                            {new Date(pmt.payment_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                                        </td>
                                                        <td className="px-3 py-2 font-bold text-sm">
                                                            <span className={pmt.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'}>
                                                                ${parseFloat(pmt.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-xs text-muted-foreground capitalize">{pmt.method}</td>
                                                        <td className="px-3 py-2">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                                pmt.status === 'paid'    ? 'bg-emerald-100 text-emerald-700' :
                                                                pmt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                                           'bg-red-100 text-red-700'
                                                            }`}>
                                                                {pmt.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[120px] truncate">{pmt.notes || '—'}</td>
                                                        <td className="px-3 py-2 text-right">
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm("Delete this payment?")) {
                                                                        await deletePayment(pmt.id);
                                                                        const updated = await getPayments(selectedTenant.id);
                                                                        setPaymentHistory(updated || []);
                                                                        router.refresh();
                                                                    }
                                                                }}
                                                                className="text-muted-foreground hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash className="h-3 w-3" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </SimpleDialog>
            )}
        </div>
    );
}

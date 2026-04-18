"use client";

import * as React from "react";
import {
    Wrench, Plus, CheckCircle2, Clock, AlertTriangle, XCircle,
    UserCheck, Camera, X, LogOut, Building, Zap, FileText,
    DollarSign, CalendarDays, CreditCard, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────

type Request = {
    id: string;
    title: string;
    description?: string;
    category: string;
    priority: string;
    status: string;
    photo_url?: string;
    created_at: string;
    actual_cost?: number;
};

type Tenant = {
    id: string;
    name: string;
    email: string;
    unit_number?: string;
    lease_start?: string;
    lease_end?: string;
    rent_amount?: number;
    late_fee_pct?: number;
    late_fee_day?: number;
    property_id: string;
    properties?: { id: string; address: string; city: string; state: string; zip?: string; property_type?: string };
};

type Payment = {
    id: string;
    amount: number;
    payment_date: string;
    status: string;
    method: string;
    notes?: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES = [
    { value: "plumbing",    label: "Plumbing",    emoji: "🚿" },
    { value: "electrical",  label: "Electrical",  emoji: "⚡" },
    { value: "hvac",        label: "A/C & Heat",  emoji: "❄️" },
    { value: "appliance",   label: "Appliance",   emoji: "🍳" },
    { value: "pest",        label: "Pest",        emoji: "🐛" },
    { value: "structural",  label: "Structural",  emoji: "🏗️" },
    { value: "roofing",     label: "Roofing",     emoji: "🏠" },
    { value: "landscaping", label: "Landscaping", emoji: "🌿" },
    { value: "general",     label: "Other",       emoji: "🔧" },
];

const PRIORITIES = [
    { value: "low",       label: "Not urgent",  desc: "Can wait a few days",     color: "border-green-500/40 bg-green-500/10 text-green-400" },
    { value: "normal",    label: "Normal",      desc: "Needs attention soon",    color: "border-blue-500/40 bg-blue-500/10 text-blue-400" },
    { value: "urgent",    label: "Urgent",      desc: "Please fix this week",    color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
    { value: "emergency", label: "Emergency",   desc: "Safety hazard/flooding",  color: "border-red-500/40 bg-red-500/10 text-red-400" },
];

const STATUS = {
    open:        { label: "Open",        icon: AlertTriangle, cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    assigned:    { label: "Assigned",    icon: UserCheck,     cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    in_progress: { label: "In Progress", icon: Clock,         cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    completed:   { label: "Completed",   icon: CheckCircle2,  cls: "bg-green-500/10 text-green-400 border-green-500/20" },
    closed:      { label: "Closed",      icon: XCircle,       cls: "bg-white/10 text-white/40 border-white/10" },
} as Record<string, any>;

// ─── Main Component ─────────────────────────────────────────────────────────

// ─── Rent status helper ─────────────────────────────────────────────────────

function getRentStatus(tenant: Tenant, payments: Payment[]) {
    const rent       = tenant.rent_amount || 0;
    const dueDay     = tenant.late_fee_day ?? 5;
    const latePct    = tenant.late_fee_pct ?? 10;
    const today      = new Date();
    const todayDay   = today.getDate();
    const month      = today.getMonth();
    const year       = today.getFullYear();

    // Due date this month
    const dueDate = new Date(year, month, dueDay);
    const isLate  = todayDay > dueDay;
    const lateFee = isLate ? rent * (latePct / 100) : 0;
    const amountDue = rent + lateFee;

    // Check if already paid this month
    const thisMonthPaid = payments.some(p => {
        const d = new Date(p.payment_date);
        return d.getMonth() === month && d.getFullYear() === year && p.status === "paid";
    });

    // Next due: if paid this month or day hasn't come yet
    const nextDueDate = thisMonthPaid
        ? new Date(year, month + 1, dueDay)
        : dueDate;

    const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / 86400000);

    return { rent, dueDay, latePct, lateFee, amountDue, isLate, thisMonthPaid, nextDueDate, daysUntilDue };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TenantPortalView({
    tenant,
    requests: initialRequests,
    payments,
    userEmail,
}: {
    tenant: Tenant | null;
    requests: Request[];
    payments: Payment[];
    userEmail: string;
}) {
    const router = useRouter();
    const supabase = createClient();
    const [requests, setRequests] = React.useState<Request[]>(initialRequests);
    const [showForm, setShowForm] = React.useState(false);

    // Form state
    const [title, setTitle]             = React.useState("");
    const [description, setDescription] = React.useState("");
    const [category, setCategory]       = React.useState("general");
    const [priority, setPriority]       = React.useState("normal");
    const [photo, setPhoto]             = React.useState<File | null>(null);
    const [preview, setPreview]         = React.useState<string | null>(null);
    const [loading, setLoading]         = React.useState(false);
    const [error, setError]             = React.useState("");
    const [success, setSuccess]         = React.useState(false);

    const fileRef = React.useRef<HTMLInputElement>(null);

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhoto(file);
        const reader = new FileReader();
        reader.onload = ev => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!tenant) return;
        if (!title.trim()) { setError("Please enter a title."); return; }

        setLoading(true);
        setError("");

        const fd = new FormData();
        fd.append("property_id", tenant.property_id);
        fd.append("tenant_id", tenant.id);
        fd.append("title", title);
        fd.append("description", description);
        fd.append("category", category);
        fd.append("priority", priority);
        if (photo) fd.append("photo", photo);

        try {
            const res = await fetch("/api/maintenance/submit", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok || data.error) { setError(data.error || "Failed to submit."); return; }
            setSuccess(true);
            setShowForm(false);
            setTitle(""); setDescription(""); setCategory("general"); setPriority("normal");
            setPhoto(null); setPreview(null);
            // Reload to show new request
            setTimeout(() => { window.location.reload(); }, 1000);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/tenant/login");
    }

    // ── Not a registered tenant ──────────────────────────────────────────────
    if (!tenant) {
        return (
            <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4 text-white">
                <div className="max-w-md text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mb-2">
                        <AlertTriangle className="h-7 w-7 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Account not linked</h2>
                    <p className="text-white/50 text-sm">
                        Your email <span className="text-white font-medium">{userEmail}</span> is not registered as a tenant. Ask your landlord to add your email to your tenant profile.
                    </p>
                    <Button onClick={handleLogout} variant="outline" className="border-white/20 text-white hover:bg-white/10 mt-4">
                        <LogOut className="h-4 w-4 mr-2" /> Sign out
                    </Button>
                </div>
            </div>
        );
    }

    const property = tenant.properties;
    const daysLeft = tenant.lease_end
        ? Math.ceil((new Date(tenant.lease_end).getTime() - Date.now()) / 86400000)
        : null;

    return (
        <div className="min-h-screen bg-[#050810] text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#050810]/80 backdrop-blur-md sticky top-0 z-20">
                <div className="container max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-lg">
                        <span className="text-teal-400">BRRRR</span>
                        <span className="text-white/80 font-normal text-sm">Tenant Portal</span>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
                        <LogOut className="h-4 w-4" /> Sign out
                    </button>
                </div>
            </header>

            <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">

                {/* Welcome card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Welcome back</p>
                            <h1 className="text-xl font-bold">{tenant.name}</h1>
                            {property && (
                                <p className="text-white/50 text-sm mt-1 flex items-center gap-1.5">
                                    <Building className="h-3.5 w-3.5" />
                                    {property.address}, {property.city}{property.state ? `, ${property.state}` : ""}
                                    {tenant.unit_number && <span className="text-teal-400 font-semibold ml-1">· {tenant.unit_number}</span>}
                                </p>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            {tenant.rent_amount && (
                                <p className="text-sm font-bold text-teal-400">${tenant.rent_amount.toLocaleString()}<span className="text-white/30 font-normal text-xs">/mo</span></p>
                            )}
                            {daysLeft !== null && (
                                <p className={`text-xs mt-0.5 ${daysLeft < 60 ? "text-amber-400" : "text-white/40"}`}>
                                    {daysLeft > 0 ? `Lease: ${daysLeft}d left` : "Lease expired"}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RENT STATUS CARD ── */}
                {tenant && (() => {
                    const rs = getRentStatus(tenant, payments);
                    return (
                        <div className={`rounded-2xl border p-5 space-y-4 ${
                            rs.thisMonthPaid
                                ? "border-green-500/30 bg-green-500/5"
                                : rs.isLate
                                ? "border-red-500/30 bg-red-500/5"
                                : "border-amber-500/30 bg-amber-500/5"
                        }`}>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-widest text-white/40">Rent Status</p>
                                {rs.thisMonthPaid ? (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Paid this month
                                    </span>
                                ) : rs.isLate ? (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                                        <AlertTriangle className="h-3.5 w-3.5" /> Overdue
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                                        <Clock className="h-3.5 w-3.5" /> Due in {rs.daysUntilDue}d
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Base Rent</p>
                                    <p className="text-lg font-black text-white">${rs.rent.toLocaleString()}</p>
                                </div>
                                <div className={`rounded-xl p-3 text-center ${rs.isLate && !rs.thisMonthPaid ? "bg-red-500/10" : "bg-white/5"}`}>
                                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Late Fee</p>
                                    <p className={`text-lg font-black ${rs.isLate && !rs.thisMonthPaid ? "text-red-400" : "text-white/30"}`}>
                                        {rs.isLate && !rs.thisMonthPaid ? `+$${rs.lateFee.toLocaleString()}` : "—"}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">
                                        {rs.thisMonthPaid ? "Next Due" : "Total Due"}
                                    </p>
                                    <p className={`text-lg font-black ${rs.thisMonthPaid ? "text-green-400" : rs.isLate ? "text-red-400" : "text-white"}`}>
                                        ${(rs.thisMonthPaid ? rs.rent : rs.amountDue).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-white/40">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {rs.thisMonthPaid
                                    ? `Next payment due ${rs.nextDueDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                                    : rs.isLate
                                    ? `Was due on the ${rs.dueDay}${rs.dueDay === 1 ? "st" : rs.dueDay === 2 ? "nd" : rs.dueDay === 3 ? "rd" : "th"} — ${rs.latePct}% late fee applies`
                                    : `Due by the ${rs.dueDay}${rs.dueDay === 1 ? "st" : rs.dueDay === 2 ? "nd" : rs.dueDay === 3 ? "rd" : "th"} of each month`
                                }
                            </div>
                        </div>
                    );
                })()}

                {/* ── PAYMENT HISTORY ── */}
                {payments.length > 0 && (
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Payment History
                        </h2>
                        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Date</th>
                                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Amount</th>
                                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-white/30 hidden sm:table-cell">Method</th>
                                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {payments.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-white/60 text-xs">
                                                {new Date(p.payment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-green-400">
                                                ${Number(p.amount).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-white/40 text-xs capitalize hidden sm:table-cell">{p.method}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                    p.status === "paid"    ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                    p.status === "late"    ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                    "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Success banner */}
                {success && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Request submitted successfully!
                    </div>
                )}

                {/* New Request button */}
                <Button
                    onClick={() => { setShowForm(!showForm); setError(""); }}
                    className="w-full h-12 bg-teal-500 hover:bg-teal-400 text-black font-bold gap-2"
                >
                    <Plus className="h-5 w-5" />
                    {showForm ? "Cancel" : "Submit Maintenance Request"}
                </Button>

                {/* New Request Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <h2 className="font-bold text-lg">New Request</h2>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-white/70">What's the issue? <span className="text-red-400">*</span></Label>
                            <Input
                                placeholder="e.g. Kitchen faucet is leaking"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/70">Category</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORIES.map(c => (
                                    <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-semibold transition-colors ${
                                            category === c.value
                                                ? "border-teal-500 bg-teal-500/10 text-teal-400"
                                                : "border-white/10 bg-white/5 text-white/50 hover:border-white/30"
                                        }`}>
                                        <span className="text-lg">{c.emoji}</span>{c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/70">How urgent?</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {PRIORITIES.map(p => (
                                    <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                                        className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-colors ${
                                            priority === p.value ? `border-2 ${p.color}` : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                                        }`}>
                                        <span className="text-sm font-semibold">{p.label}</span>
                                        <span className="text-xs opacity-70 mt-0.5">{p.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-white/70">Description <span className="text-white/30 text-xs">(optional)</span></Label>
                            <textarea
                                rows={3}
                                placeholder="Describe the problem in detail…"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="flex w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                            />
                        </div>

                        {/* Photo */}
                        <div className="space-y-2">
                            <Label className="text-white/70">Photo <span className="text-white/30 text-xs">(optional but helpful)</span></Label>
                            {preview ? (
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => { setPhoto(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileRef.current?.click()}
                                    className="w-full border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center gap-2 text-white/40 hover:border-teal-500/50 hover:text-teal-400 transition-colors">
                                    <Camera className="h-7 w-7" />
                                    <span className="text-sm font-medium">Tap to add a photo</span>
                                </button>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full h-12 bg-teal-500 hover:bg-teal-400 text-black font-bold">
                            {loading ? "Submitting…" : "Submit Request"}
                        </Button>
                    </form>
                )}

                {/* Request History */}
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> My Requests ({requests.length})
                    </h2>

                    {requests.length === 0 ? (
                        <div className="text-center py-12 text-white/30">
                            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">No requests yet. Submit one above.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map(req => {
                                const cfg = STATUS[req.status] || STATUS.open;
                                const StatusIcon = cfg.icon;
                                return (
                                    <div key={req.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                                                        <StatusIcon className="h-3 w-3" />{cfg.label}
                                                    </span>
                                                    <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full capitalize">{req.category}</span>
                                                    <span className="flex items-center gap-0.5 text-xs font-bold text-amber-400">
                                                        <Zap className="h-3 w-3" />{req.priority}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-sm">{req.title}</p>
                                                {req.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{req.description}</p>}
                                                <p className="text-xs text-white/30 mt-2">{new Date(req.created_at).toLocaleDateString()}</p>
                                            </div>
                                            {req.photo_url && (
                                                <a href={req.photo_url} target="_blank" rel="noopener noreferrer">
                                                    <img src={req.photo_url} alt="photo" className="w-16 h-16 rounded-lg object-cover border border-white/10 hover:opacity-80 shrink-0" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

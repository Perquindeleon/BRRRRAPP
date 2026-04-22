"use client";

import * as React from "react";
import {
    Wrench, Plus, AlertTriangle, CheckCircle2, Clock, XCircle,
    User, Building, Phone, Mail, Trash2, UserCheck, Pencil,
    DollarSign, FileText, Calendar, Zap, Link2, Copy, Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    createMaintenanceRequest,
    assignContractor,
    markCompleted,
    closeRequest,
    deleteMaintenanceRequest,
    updateMaintenanceRequest,
} from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Request = {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    photo_url?: string;
    estimated_cost: number;
    actual_cost: number;
    notes: string;
    created_at: string;
    assigned_at?: string;
    completed_at?: string;
    closed_at?: string;
    property_id: string;
    tenant_id?: string;
    contractor_id?: string;
    properties?: { address: string; city: string };
    tenants?: { name: string; phone: string; email: string };
    contractors?: { name: string; phone: string; email: string; specialty: string };
};

type Property = {
    id: string;
    address: string;
    city: string;
    tenants?: { id: string; name: string; unit_number?: string }[];
};

type Contractor = {
    id: string;
    name: string;
    specialty: string;
    phone: string;
    email: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
    "general", "plumbing", "electrical", "hvac", "roofing",
    "appliance", "pest", "landscaping", "structural", "other"
];

const PRIORITIES = [
    { value: "low", label: "Low", color: "text-green-500" },
    { value: "normal", label: "Normal", color: "text-blue-500" },
    { value: "urgent", label: "Urgent", color: "text-amber-500" },
    { value: "emergency", label: "Emergency", color: "text-red-500" },
];

const STATUS_TABS = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "assigned", label: "Assigned" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "closed", label: "Closed" },
];

const statusConfig: Record<string, { label: string; icon: React.ElementType; classes: string }> = {
    open:        { label: "Open",        icon: AlertTriangle, classes: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    assigned:    { label: "Assigned",    icon: UserCheck,     classes: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    in_progress: { label: "In Progress", icon: Clock,         classes: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
    completed:   { label: "Completed",   icon: CheckCircle2,  classes: "bg-green-500/10 text-green-500 border-green-500/20" },
    closed:      { label: "Closed",      icon: XCircle,       classes: "bg-muted/80 text-muted-foreground border-border" },
};

const priorityConfig: Record<string, string> = {
    low:       "text-green-500",
    normal:    "text-blue-500",
    urgent:    "text-amber-500",
    emergency: "text-red-500",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MaintenanceView({
    initialRequests,
    properties,
    contractors,
}: {
    initialRequests: Request[];
    properties: Property[];
    contractors: Contractor[];
}) {
    const router = useRouter();
    const [requests, setRequests] = React.useState<Request[]>(initialRequests);
    const [activeTab, setActiveTab] = React.useState("all");

    // Modals
    const [showCreate, setShowCreate] = React.useState(false);
    const [assignTarget, setAssignTarget] = React.useState<Request | null>(null);
    const [closeTarget, setCloseTarget] = React.useState<Request | null>(null);
    const [detailTarget, setDetailTarget] = React.useState<Request | null>(null);
    const [editTarget, setEditTarget] = React.useState<Request | null>(null);

    // Edit form state
    const [editLoading, setEditLoading] = React.useState(false);
    const [editError, setEditError] = React.useState("");

    // Create form state
    const [createLoading, setCreateLoading] = React.useState(false);
    const [createError, setCreateError] = React.useState("");
    const [selectedCreateProperty, setSelectedCreateProperty] = React.useState("");

    // Assign form state
    const [assignLoading, setAssignLoading] = React.useState(false);
    const [selectedContractor, setSelectedContractor] = React.useState("");

    // Close form state
    const [closeLoading, setCloseLoading] = React.useState(false);
    const [closeActualCost, setCloseActualCost] = React.useState("");
    const [closeNotes, setCloseNotes] = React.useState("");

    // Share link
    const [showSharePanel, setShowSharePanel] = React.useState(false);
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    function copyLink(propertyId: string) {
        const url = `${window.location.origin}/maintenance/submit/${propertyId}`;
        navigator.clipboard.writeText(url);
        setCopiedId(propertyId);
        setTimeout(() => setCopiedId(null), 2000);
    }

    const filtered = activeTab === "all"
        ? requests
        : requests.filter(r => r.status === activeTab);

    // Stats
    const stats = {
        open: requests.filter(r => r.status === "open").length,
        assigned: requests.filter(r => r.status === "assigned" || r.status === "in_progress").length,
        completed: requests.filter(r => r.status === "completed" || r.status === "closed").length,
        totalCost: requests.reduce((s, r) => s + (r.actual_cost || 0), 0),
    };

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError("");
        const fd = new FormData(e.currentTarget);
        const result = await createMaintenanceRequest(fd);
        setCreateLoading(false);
        if (result?.error) { setCreateError(result.error); return; }
        setShowCreate(false);
        // Refresh by reloading — simple approach since server action revalidates
        router.refresh();
    }

    async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editTarget) return;
        setEditLoading(true); setEditError("");
        const fd = new FormData(e.currentTarget);
        const res = await updateMaintenanceRequest(editTarget.id, {
            title:         fd.get("title") as string,
            description:   fd.get("description") as string,
            category:      fd.get("category") as string,
            priority:      fd.get("priority") as string,
            estimatedCost: parseFloat(fd.get("estimated_cost") as string) || undefined,
        });
        setEditLoading(false);
        if (res?.error) { setEditError(res.error); return; }
        setRequests(prev => prev.map(r => r.id === editTarget.id
            ? { ...r,
                title:          fd.get("title") as string,
                description:    fd.get("description") as string,
                category:       fd.get("category") as string,
                priority:       fd.get("priority") as string,
                estimated_cost: parseFloat(fd.get("estimated_cost") as string) || r.estimated_cost,
              }
            : r
        ));
        setEditTarget(null);
    }

    async function handleAssign(e: React.FormEvent) {
        e.preventDefault();
        if (!assignTarget || !selectedContractor) return;
        setAssignLoading(true);
        await assignContractor(assignTarget.id, selectedContractor);
        setAssignLoading(false);
        setAssignTarget(null);
        setSelectedContractor("");
        router.refresh();
    }

    async function handleClose(e: React.FormEvent) {
        e.preventDefault();
        if (!closeTarget) return;
        setCloseLoading(true);
        await closeRequest(closeTarget.id, parseFloat(closeActualCost) || 0, closeNotes);
        setCloseLoading(false);
        setCloseTarget(null);
        setCloseActualCost("");
        setCloseNotes("");
        router.refresh();
    }

    async function handleMarkCompleted(req: Request) {
        await markCompleted(req.id, req.actual_cost || 0, req.notes || "");
        router.refresh();
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this maintenance request?")) return;
        await deleteMaintenanceRequest(id);
        setRequests(prev => prev.filter(r => r.id !== id));
    }

    const tenantsForProperty = properties
        .find(p => p.id === selectedCreateProperty)
        ?.tenants || [];

    return (
        <div className="space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={AlertTriangle} label="Open" value={stats.open} color="amber" />
                <StatCard icon={Clock} label="In Progress" value={stats.assigned} color="blue" />
                <StatCard icon={CheckCircle2} label="Resolved" value={stats.completed} color="green" />
                <StatCard icon={DollarSign} label="Total Spent" value={`$${stats.totalCost.toLocaleString()}`} color="violet" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                                activeTab === tab.value
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => setShowSharePanel(!showSharePanel)}
                        className="gap-2 text-sm"
                    >
                        <Link2 className="h-4 w-4" /> Tenant Links
                    </Button>
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                    >
                        <Plus className="h-4 w-4" /> New Request
                    </Button>
                </div>
            </div>

            {/* Share panel */}
            {showSharePanel && (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                        Share these links with your tenants so they can submit requests directly
                    </p>
                    {properties.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No properties found.</p>
                    ) : properties.map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-3 bg-background border border-border rounded-lg px-3 py-2">
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{p.address}</p>
                                <p className="text-xs text-muted-foreground truncate">{`${window?.location?.origin || ""}/maintenance/submit/${p.id}`}</p>
                            </div>
                            <button
                                onClick={() => copyLink(p.id)}
                                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                            >
                                {copiedId === p.id
                                    ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied</>
                                    : <><Copy className="h-3.5 w-3.5" /> Copy</>
                                }
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Request Cards */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No maintenance requests</p>
                    <p className="text-sm mt-1">Create your first request to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(req => (
                        <RequestCard
                            key={req.id}
                            req={req}
                            onAssign={() => { setAssignTarget(req); setSelectedContractor(req.contractor_id || ""); }}
                            onClose={() => { setCloseTarget(req); setCloseActualCost(String(req.actual_cost || "")); setCloseNotes(req.notes || ""); }}
                            onComplete={() => handleMarkCompleted(req)}
                            onDelete={() => handleDelete(req.id)}
                            onDetail={() => setDetailTarget(req)}
                            onEdit={() => { setEditTarget(req); setEditError(""); }}
                        />
                    ))}
                </div>
            )}

            {/* ── CREATE MODAL ── */}
            {showCreate && (
                <Modal title="New Maintenance Request" onClose={() => { setShowCreate(false); setCreateError(""); }}>
                    <form onSubmit={handleCreate} className="space-y-4">
                        {createError && (
                            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">{createError}</div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <Label>Title <span className="text-red-500">*</span></Label>
                                <Input name="title" placeholder="e.g. Leaking kitchen faucet" required />
                            </div>

                            <div className="col-span-2 space-y-1.5">
                                <Label>Property <span className="text-red-500">*</span></Label>
                                <select
                                    name="property_id"
                                    required
                                    value={selectedCreateProperty}
                                    onChange={e => setSelectedCreateProperty(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Select property…</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.address}, {p.city}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedCreateProperty && tenantsForProperty.length > 0 && (
                                <div className="col-span-2 space-y-1.5">
                                    <Label>Reported by (Tenant)</Label>
                                    <select
                                        name="tenant_id"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">None / Owner submitted</option>
                                        {tenantsForProperty.map((t: any) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}{t.unit_number ? ` (${t.unit_number})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label>Category</Label>
                                <select
                                    name="category"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Priority</Label>
                                <select
                                    name="priority"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {PRIORITIES.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2 space-y-1.5">
                                <Label>Description</Label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    placeholder="Describe the issue in detail…"
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Estimated Cost ($)</Label>
                                <Input name="estimated_cost" type="number" placeholder="0.00" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button type="submit" disabled={createLoading} className="bg-violet-600 hover:bg-violet-700 text-white">
                                {createLoading ? "Creating…" : "Create Request"}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── ASSIGN CONTRACTOR MODAL ── */}
            {assignTarget && (
                <Modal title="Assign Contractor" onClose={() => setAssignTarget(null)}>
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm">
                            <p className="font-semibold">{assignTarget.title}</p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                {assignTarget.properties?.address} · {assignTarget.category}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Contractor <span className="text-red-500">*</span></Label>
                            <select
                                required
                                value={selectedContractor}
                                onChange={e => setSelectedContractor(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">Select contractor…</option>
                                {contractors.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{c.specialty ? ` — ${c.specialty}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedContractor && (() => {
                            const c = contractors.find(x => x.id === selectedContractor);
                            return c ? (
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm space-y-1">
                                    {c.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-blue-500" />{c.phone}</p>}
                                    {c.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-blue-500" />{c.email}</p>}
                                </div>
                            ) : null;
                        })()}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setAssignTarget(null)}>Cancel</Button>
                            <Button type="submit" disabled={assignLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {assignLoading ? "Assigning…" : "Assign Contractor"}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── CLOSE REQUEST MODAL ── */}
            {closeTarget && (
                <Modal title="Close Request & Log Expense" onClose={() => setCloseTarget(null)}>
                    <form onSubmit={handleClose} className="space-y-4">
                        <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm">
                            <p className="font-semibold">{closeTarget.title}</p>
                            {closeTarget.contractors && (
                                <p className="text-muted-foreground text-xs mt-0.5">
                                    Contractor: {closeTarget.contractors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Actual Cost ($)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-7"
                                    value={closeActualCost}
                                    onChange={e => setCloseActualCost(e.target.value)}
                                />
                            </div>
                            {closeTarget.estimated_cost > 0 && (
                                <p className="text-xs text-muted-foreground">Estimated: ${closeTarget.estimated_cost.toLocaleString()}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Closing Notes</Label>
                            <textarea
                                rows={3}
                                placeholder="Work completed, warranty info, follow-up needed…"
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                value={closeNotes}
                                onChange={e => setCloseNotes(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setCloseTarget(null)}>Cancel</Button>
                            <Button type="submit" disabled={closeLoading} className="bg-green-600 hover:bg-green-700 text-white">
                                {closeLoading ? "Closing…" : "Close & Log Expense"}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── EDIT MODAL ── */}
            {editTarget && (
                <Modal title="Edit Request" onClose={() => setEditTarget(null)}>
                    <form onSubmit={handleEdit} className="space-y-4">
                        {editError && <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">{editError}</div>}

                        <div className="space-y-1.5">
                            <Label>Title <span className="text-red-500">*</span></Label>
                            <input name="title" required defaultValue={editTarget.title}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Category</Label>
                                <select name="category" defaultValue={editTarget.category}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Priority</Label>
                                <select name="priority" defaultValue={editTarget.priority}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <textarea name="description" rows={3} defaultValue={editTarget.description}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Estimated Cost ($)</Label>
                            <input name="estimated_cost" type="number" defaultValue={editTarget.estimated_cost || ""}
                                placeholder="0.00"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                            <Button type="submit" disabled={editLoading} className="bg-violet-600 hover:bg-violet-700 text-white">
                                {editLoading ? "Saving…" : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── DETAIL MODAL ── */}
            {detailTarget && (
                <Modal title="Request Details" onClose={() => setDetailTarget(null)}>
                    <RequestDetail req={detailTarget} onClose={() => setDetailTarget(null)} />
                </Modal>
            )}
        </div>
    );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({
    req, onAssign, onClose, onComplete, onDelete, onDetail, onEdit
}: {
    req: Request;
    onAssign: () => void;
    onClose: () => void;
    onComplete: () => void;
    onDelete: () => void;
    onDetail: () => void;
    onEdit: () => void;
}) {
    const cfg = statusConfig[req.status] || statusConfig.open;
    const StatusIcon = cfg.icon;
    const priColor = priorityConfig[req.priority] || "text-muted-foreground";

    return (
        <div className="rounded-xl border border-border bg-card p-4 hover:border-violet-500/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.classes}`}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                        </span>
                        <span className={`text-xs font-bold uppercase ${priColor}`}>
                            <Zap className="inline h-3 w-3 mr-0.5" />{req.priority}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full capitalize">
                            {req.category}
                        </span>
                    </div>

                    <h3
                        className="font-semibold mt-2 cursor-pointer hover:text-violet-400 transition-colors"
                        onClick={onDetail}
                    >
                        {req.title}
                    </h3>

                    {req.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
                    )}

                    {req.photo_url && (
                        <img
                            src={req.photo_url}
                            alt="photo"
                            onClick={onDetail}
                            className="mt-2 h-20 w-32 rounded-lg object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity"
                        />
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {req.properties && (
                            <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {req.properties.address}
                            </span>
                        )}
                        {req.tenants && (
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {req.tenants.name}
                            </span>
                        )}
                        {req.contractors && (
                            <span className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                {req.contractors.name}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(req.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Cost */}
                <div className="text-right shrink-0">
                    {req.actual_cost > 0 ? (
                        <p className="text-sm font-bold text-green-500">${req.actual_cost.toLocaleString()}</p>
                    ) : req.estimated_cost > 0 ? (
                        <p className="text-sm text-muted-foreground">~${req.estimated_cost.toLocaleString()}</p>
                    ) : null}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                {(req.status === "open") && (
                    <Button size="sm" variant="outline" className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10 h-7 text-xs" onClick={onAssign}>
                        <UserCheck className="h-3 w-3 mr-1" /> Assign Contractor
                    </Button>
                )}
                {(req.status === "assigned" || req.status === "in_progress") && (
                    <>
                        <Button size="sm" variant="outline" className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10 h-7 text-xs" onClick={onAssign}>
                            <UserCheck className="h-3 w-3 mr-1" /> Reassign
                        </Button>
                        <Button size="sm" variant="outline" className="text-violet-500 border-violet-500/30 hover:bg-violet-500/10 h-7 text-xs" onClick={onComplete}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Completed
                        </Button>
                    </>
                )}
                {(req.status === "completed") && (
                    <Button size="sm" variant="outline" className="text-green-500 border-green-500/30 hover:bg-green-500/10 h-7 text-xs" onClick={onClose}>
                        <DollarSign className="h-3 w-3 mr-1" /> Close & Log Expense
                    </Button>
                )}
                <div className="ml-auto flex items-center gap-1">
                    <button
                        onClick={onEdit}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-border hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 transition-colors"
                        title="Edit request"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                        title="Delete request"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Request Detail ───────────────────────────────────────────────────────────

function RequestDetail({ req, onClose }: { req: Request; onClose: () => void }) {
    const cfg = statusConfig[req.status] || statusConfig.open;
    const StatusIcon = cfg.icon;

    return (
        <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.classes}`}>
                    <StatusIcon className="h-3.5 w-3.5" />{cfg.label}
                </span>
                <span className={`text-xs font-bold uppercase ${priorityConfig[req.priority]}`}>
                    <Zap className="inline h-3 w-3 mr-0.5" />{req.priority} priority
                </span>
                <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full capitalize">{req.category}</span>
            </div>

            {req.description && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                    <p className="text-foreground">{req.description}</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {req.properties && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1"><Building className="h-3 w-3" /> Property</p>
                        <p className="font-medium">{req.properties.address}</p>
                        <p className="text-muted-foreground text-xs">{req.properties.city}</p>
                    </div>
                )}
                {req.tenants && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1"><User className="h-3 w-3" /> Reported By</p>
                        <p className="font-medium">{req.tenants.name}</p>
                        {req.tenants.phone && <p className="text-muted-foreground text-xs">{req.tenants.phone}</p>}
                    </div>
                )}
                {req.contractors && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs font-semibold text-blue-400 uppercase mb-1 flex items-center gap-1"><UserCheck className="h-3 w-3" /> Contractor</p>
                        <p className="font-medium">{req.contractors.name}</p>
                        {req.contractors.specialty && <p className="text-muted-foreground text-xs">{req.contractors.specialty}</p>}
                        {req.contractors.phone && <p className="text-muted-foreground text-xs">{req.contractors.phone}</p>}
                    </div>
                )}
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Costs</p>
                    <p className="text-xs text-muted-foreground">Estimated: <span className="text-foreground font-medium">${(req.estimated_cost || 0).toLocaleString()}</span></p>
                    <p className="text-xs text-muted-foreground">Actual: <span className="text-green-400 font-bold">${(req.actual_cost || 0).toLocaleString()}</span></p>
                </div>
            </div>

            {req.photo_url && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><FileText className="h-3 w-3" /> Photo</p>
                    <a href={req.photo_url} target="_blank" rel="noopener noreferrer">
                        <img
                            src={req.photo_url}
                            alt="Maintenance photo"
                            className="w-full rounded-xl object-cover max-h-64 border border-border hover:opacity-90 transition-opacity cursor-pointer"
                        />
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">Click to open full size</p>
                </div>
            )}

            {req.notes && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1"><FileText className="h-3 w-3" /> Notes</p>
                    <p className="text-foreground">{req.notes}</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                <p>Created: {new Date(req.created_at).toLocaleString()}</p>
                {req.assigned_at && <p>Assigned: {new Date(req.assigned_at).toLocaleString()}</p>}
                {req.completed_at && <p>Completed: {new Date(req.completed_at).toLocaleString()}</p>}
                {req.closed_at && <p>Closed: {new Date(req.closed_at).toLocaleString()}</p>}
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType; label: string; value: string | number; color: string;
}) {
    const colorMap: Record<string, string> = {
        amber:  "bg-amber-500/10 text-amber-500",
        blue:   "bg-blue-500/10 text-blue-500",
        green:  "bg-green-500/10 text-green-500",
        violet: "bg-violet-500/10 text-violet-500",
    };
    return (
        <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorMap[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="font-bold text-lg">{title}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">&times;</button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

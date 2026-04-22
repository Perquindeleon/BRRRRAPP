"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Receipt, Plus, Trash2, Search, Download, Pencil,
    Building2, TrendingDown, BarChart3, X,
    ChevronLeft, ChevronRight, Loader2, Home,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { useRouter } from "next/navigation";
import { addExpense, updateExpense, deleteExpense, getMonthlyPLByProperty } from "./actions";
import { EXPENSE_CATEGORIES } from "./constants";

const CAT_COLORS: Record<string, string> = {
    mortgage:    "bg-violet-500/10 text-violet-400 border-violet-500/20",
    taxes:       "bg-orange-500/10 text-orange-400 border-orange-500/20",
    insurance:   "bg-blue-500/10  text-blue-400   border-blue-500/20",
    utilities:   "bg-cyan-500/10  text-cyan-400   border-cyan-500/20",
    management:  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    hoa:         "bg-pink-500/10  text-pink-400   border-pink-500/20",
    repairs:     "bg-amber-500/10 text-amber-400  border-amber-500/20",
    landscaping: "bg-green-500/10 text-green-400  border-green-500/20",
    advertising: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    legal:       "bg-red-500/10   text-red-400    border-red-500/20",
    other:       "bg-muted        text-muted-foreground border-border",
};

function catLabel(val: string) {
    return EXPENSE_CATEGORIES.find(c => c.value === val)?.label ?? val;
}

function catBadge(cat: string) {
    const cls = CAT_COLORS[cat] ?? CAT_COLORS.other;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
            {catLabel(cat)}
        </span>
    );
}

/* ── Expense Form Modal (add + edit) ──────────────────────────────────────── */

function ExpenseModal({
    isOpen, onClose, properties, onSaved, editExpense,
}: {
    isOpen: boolean;
    onClose: () => void;
    properties: any[];
    onSaved: (saved: any) => void;
    editExpense?: any;
}) {
    const isEdit = !!editExpense;

    const [propId,  setPropId]  = useState(editExpense?.property_id ?? "");
    const [unit,    setUnit]    = useState(editExpense?.unit_number  ?? "");
    const [cat,     setCat]     = useState(editExpense?.category     ?? "other");
    const [desc,    setDesc]    = useState(editExpense?.description  ?? "");
    const [date,    setDate]    = useState(editExpense?.expense_date ?? new Date().toISOString().split("T")[0]);
    const [vendor,  setVendor]  = useState(editExpense?.vendor       ?? "");
    const [notes,   setNotes]   = useState(editExpense?.notes        ?? "");
    const [loading, setLoading] = useState(false);
    const [err,     setErr]     = useState<string|null>(null);

    // Amount state — seed from editExpense
    const seedAmt = editExpense?.amount ? String(parseFloat(editExpense.amount)) : "";
    const seedDisp = editExpense?.amount
        ? `$${parseFloat(editExpense.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
        : "";
    const [amtRaw,  setAmtRaw]  = useState(seedAmt);
    const [amtDisp, setAmtDisp] = useState(seedDisp);

    const selectedProp = properties.find(p => p.id === propId);
    const isMulti      = selectedProp?.property_type === "multifamily";
    const unitCount    = selectedProp?.units ?? 0;
    const unitOptions  = isMulti
        ? Array.from({ length: unitCount }, (_, i) => `Unit ${i + 1}`)
        : [];

    function handleAmtChange(v: string) {
        const stripped = v.replace(/[^0-9.]/g, "");
        if (!stripped) { setAmtRaw(""); setAmtDisp(""); return; }
        const dotIdx = stripped.indexOf(".");
        const intStr = dotIdx >= 0 ? stripped.slice(0, dotIdx) : stripped;
        const decStr = dotIdx >= 0 ? stripped.slice(dotIdx + 1, dotIdx + 3) : "";
        const intNum = parseInt(intStr || "0");
        const display = decStr.length > 0 || stripped.endsWith(".")
            ? `$${intNum.toLocaleString("en-US")}.${decStr}`
            : `$${intNum.toLocaleString("en-US")}`;
        setAmtDisp(display); setAmtRaw(decStr.length > 0 ? `${intNum}.${decStr}` : String(intNum));
    }

    async function handleSubmit() {
        if (!desc || !amtRaw || !date) { setErr("Description, amount and date are required."); return; }
        setLoading(true); setErr(null);
        const payload = {
            propertyId:  propId || undefined,
            unitNumber:  unit   || undefined,
            category:    cat,
            description: desc,
            amount:      parseFloat(amtRaw),
            expenseDate: date,
            vendor:      vendor || undefined,
            notes:       notes  || undefined,
        };
        const res = isEdit
            ? await updateExpense(editExpense.id, payload)
            : await addExpense(payload);
        setLoading(false);
        if (res?.error) { setErr(res.error); return; }
        onSaved(isEdit
            ? { ...editExpense, ...payload, expense_date: date, amount: parseFloat(amtRaw) }
            : null
        );
        onClose();
    }

    return (
        <SimpleDialog isOpen={isOpen} onClose={onClose} title={
            <div className="flex items-center gap-2 text-foreground">
                <Receipt className="h-5 w-5 text-amber-500" />
                {isEdit ? "Edit Expense" : "Add Expense"}
            </div>
        }>
            <div className="space-y-3 p-1">
                {/* Property + Unit */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Property</label>
                        <Select value={propId || "__none__"} onValueChange={v => { setPropId(v === "__none__" ? "" : v); setUnit(""); }}>
                            <SelectTrigger className="bg-background"><SelectValue placeholder="Select…" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                {properties.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.address?.split(",")[0]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {isMulti ? (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Unit (optional)</label>
                            <Select value={unit || "__none__"} onValueChange={v => setUnit(v === "__none__" ? "" : v)}>
                                <SelectTrigger className="bg-background"><SelectValue placeholder="All units" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">All units</SelectItem>
                                    {unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : <div />}
                </div>

                {/* Category */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Category</label>
                    <Select value={cat} onValueChange={setCat}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {EXPENSE_CATEGORIES.map(c => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Description *</label>
                    <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Monthly mortgage payment" className="bg-background" />
                </div>

                {/* Amount + Date */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Amount *</label>
                        <Input value={amtDisp} onChange={e => handleAmtChange(e.target.value)} placeholder="$0.00" className="bg-background" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Date *</label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-background" />
                    </div>
                </div>

                {/* Vendor + Notes */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Vendor</label>
                        <Input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Vendor / payee" className="bg-background" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Notes</label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className="bg-background" />
                    </div>
                </div>

                {err && <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded p-2">{err}</p>}

                <Button onClick={handleSubmit} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold">
                    {loading ? "Saving…" : isEdit ? "Update Expense" : "Save Expense"}
                </Button>
            </div>
        </SimpleDialog>
    );
}

/* ── Monthly P&L Panel ────────────────────────────────────────────────────── */

function MonthlyPL() {
    const now       = new Date();
    const [year,  setYear]  = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
    const [data,  setData]  = useState<{ rows: any[]; totals: any } | null>(null);
    const [loading, setLoading] = useState(false);

    const monthKey  = `${year}-${String(month).padStart(2, "0")}`;
    const monthLabel = new Date(year, month - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });

    function prev() {
        if (month === 1) { setMonth(12); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    }
    function next() {
        const n = new Date(); if (year > n.getFullYear() || (year === n.getFullYear() && month >= n.getMonth() + 1)) return;
        if (month === 12) { setMonth(1); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    }

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getMonthlyPLByProperty(monthKey);
        setData(res);
        setLoading(false);
    }, [monthKey]);

    useEffect(() => { load(); }, [load]);

    const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const netColor = (n: number) => n >= 0 ? "text-emerald-400" : "text-red-400";
    const netSign  = (n: number) => n >= 0 ? "+" : "";

    return (
        <Card className="border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-violet-400" />
                    <span className="font-bold text-sm text-foreground">Monthly P&L</span>
                </div>
                {/* Month Navigator */}
                <div className="flex items-center gap-2">
                    <button onClick={prev} className="p-1 rounded hover:bg-muted transition-colors">
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <span className="text-sm font-semibold text-foreground w-36 text-center">{monthLabel}</span>
                    <button onClick={next} className="p-1 rounded hover:bg-muted transition-colors">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Global totals strip */}
                {data && (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Total Income</p>
                            <p className="text-2xl font-black text-emerald-400 tabular-nums">${fmt(data.totals.income)}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Total Expenses</p>
                            <p className="text-2xl font-black text-red-400 tabular-nums">${fmt(data.totals.expenses)}</p>
                        </div>
                        <div className={`rounded-xl border p-4 text-center ${data.totals.net >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Net Income</p>
                            <p className={`text-2xl font-black tabular-nums ${netColor(data.totals.net)}`}>
                                {netSign(data.totals.net)}${fmt(Math.abs(data.totals.net))}
                            </p>
                        </div>
                    </div>
                )}

                {/* Per-property table */}
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : !data || data.rows.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No data for this month.</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border">
                                    <th className="text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Property</th>
                                    <th className="text-center px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Units</th>
                                    <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Income</th>
                                    <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Expenses</th>
                                    <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Net</th>
                                    <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Margin</th>
                                    <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">CoC ROI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((row: any) => {
                                    const margin = row.income > 0 ? Math.round((row.net / row.income) * 100) : null;
                                    return (
                                        <tr key={row.propertyId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-violet-500/10 shrink-0">
                                                        <Home className="h-3 w-3 text-violet-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-foreground truncate max-w-[180px]">
                                                            {row.address.split(",")[0]}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground capitalize">{row.propertyType}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-muted-foreground hidden sm:table-cell">{row.units}</td>
                                            <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-400 tabular-nums">
                                                {row.income > 0 ? `$${fmt(row.income)}` : <span className="text-muted-foreground/40">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs font-semibold text-red-400 tabular-nums">
                                                {row.expenses > 0 ? `$${fmt(row.expenses)}` : <span className="text-muted-foreground/40">—</span>}
                                            </td>
                                            <td className={`px-4 py-3 text-right text-xs font-black tabular-nums ${netColor(row.net)}`}>
                                                {row.income === 0 && row.expenses === 0
                                                    ? <span className="text-muted-foreground/40">—</span>
                                                    : `${netSign(row.net)}$${fmt(Math.abs(row.net))}`
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-right hidden md:table-cell">
                                                {margin !== null ? (
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${margin >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                                        {margin}%
                                                    </span>
                                                ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right hidden lg:table-cell">
                                                {row.cocROI !== null && row.cocROI !== undefined ? (
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.cocROI >= 8 ? "bg-emerald-500/10 text-emerald-400" : row.cocROI >= 0 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                                                        {row.cocROI > 0 ? "+" : ""}{row.cocROI.toFixed(1)}%
                                                    </span>
                                                ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* Totals footer */}
                            <tfoot>
                                <tr className="border-t-2 border-border bg-muted/30">
                                    <td className="px-4 py-3 text-xs font-extrabold uppercase text-muted-foreground">Total</td>
                                    <td className="hidden sm:table-cell" />
                                    <td className="px-4 py-3 text-right text-sm font-black text-emerald-400 tabular-nums">${fmt(data.totals.income)}</td>
                                    <td className="px-4 py-3 text-right text-sm font-black text-red-400 tabular-nums">${fmt(data.totals.expenses)}</td>
                                    <td className={`px-4 py-3 text-right text-sm font-black tabular-nums ${netColor(data.totals.net)}`}>
                                        {netSign(data.totals.net)}${fmt(Math.abs(data.totals.net))}
                                    </td>
                                    <td className="hidden md:table-cell" />
                                    <td className="hidden lg:table-cell" />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </Card>
    );
}

/* ── Main View ────────────────────────────────────────────────────────────── */

export default function ExpensesView({ initialExpenses, properties }: { initialExpenses: any[]; properties: any[] }) {
    const router = useRouter();
    const [expenses,     setExpenses]     = useState<any[]>(initialExpenses);
    const [isModalOpen,  setIsModalOpen]  = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);

    function openAdd()           { setEditingExpense(null); setIsModalOpen(true); }
    function openEdit(e: any)    { setEditingExpense(e);    setIsModalOpen(true); }
    function closeModal()        { setIsModalOpen(false); setEditingExpense(null); }

    function handleSaved(updated: any) {
        if (updated) {
            // Edit: replace in list
            setExpenses(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
        } else {
            // Add: refresh from server
            router.refresh();
        }
    }
    const [search,    setSearch]   = useState("");
    const [filterProp, setFilterProp] = useState("all");
    const [filterCat,  setFilterCat]  = useState("all");
    const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
    const [filterUnit, setFilterUnit] = useState("all");

    // Derived filter options
    const years = useMemo(() => {
        const ys = [...new Set(expenses.map(e => e.expense_date?.slice(0, 4)))].filter(Boolean).sort().reverse();
        if (!ys.includes(String(new Date().getFullYear()))) ys.unshift(String(new Date().getFullYear()));
        return ys;
    }, [expenses]);

    const selectedPropData = properties.find(p => p.id === filterProp);
    const isMultiSelected  = selectedPropData?.property_type === "multifamily";
    const unitOptions      = isMultiSelected
        ? Array.from({ length: selectedPropData?.units ?? 0 }, (_, i) => `Unit ${i + 1}`)
        : [];

    const filtered = useMemo(() => {
        return expenses.filter(e => {
            if (filterProp !== "all" && e.property_id !== filterProp) return false;
            if (filterCat  !== "all" && e.category     !== filterCat)  return false;
            if (filterYear !== "all" && !e.expense_date?.startsWith(filterYear)) return false;
            if (filterUnit !== "all" && e.unit_number  !== filterUnit)  return false;
            if (search) {
                const q = search.toLowerCase();
                return (
                    e.description?.toLowerCase().includes(q) ||
                    e.vendor?.toLowerCase().includes(q) ||
                    e.notes?.toLowerCase().includes(q) ||
                    catLabel(e.category).toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [expenses, filterProp, filterCat, filterYear, filterUnit, search]);

    // Summary stats
    const totalFiltered = filtered.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const byCategory = useMemo(() => {
        const map: Record<string, number> = {};
        filtered.forEach(e => {
            map[e.category] = (map[e.category] || 0) + (parseFloat(e.amount) || 0);
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [filtered]);

    const byUnit = useMemo(() => {
        const map: Record<string, number> = {};
        filtered.forEach(e => {
            const key = e.unit_number || "General / Property";
            map[key] = (map[key] || 0) + (parseFloat(e.amount) || 0);
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [filtered]);

    async function handleDelete(id: string) {
        await deleteExpense(id);
        setExpenses(prev => prev.filter(e => e.id !== id));
    }

    function handleExportCSV() {
        const rows = [
            ["Date", "Property", "Unit", "Category", "Description", "Vendor", "Amount", "Notes"],
            ...filtered.map(e => [
                e.expense_date,
                e.properties?.address || "",
                e.unit_number || "",
                catLabel(e.category),
                e.description,
                e.vendor || "",
                e.amount,
                e.notes || "",
            ]),
        ];
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = `expenses-${filterYear}.csv`; a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="space-y-6">
            {/* ── Monthly P&L ─────────────────────────────────────────────── */}
            <MonthlyPL />

            <ExpenseModal
                isOpen={isModalOpen}
                onClose={closeModal}
                properties={properties}
                onSaved={handleSaved}
                editExpense={editingExpense ?? undefined}
            />

            {/* ── Summary Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-card">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Expenses</p>
                            <p className="text-2xl font-black text-red-400 mt-1">${totalFiltered.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <TrendingDown className="h-5 w-5 text-red-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-card">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Records</p>
                            <p className="text-2xl font-black text-foreground mt-1">{filtered.length}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted">
                            <Receipt className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-card">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Top Category</p>
                            <p className="text-base font-bold text-foreground mt-1 truncate">
                                {byCategory[0] ? catLabel(byCategory[0][0]) : "—"}
                            </p>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <BarChart3 className="h-5 w-5 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-card">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Properties</p>
                            <p className="text-2xl font-black text-foreground mt-1">
                                {new Set(filtered.map(e => e.property_id).filter(Boolean)).size}
                            </p>
                        </div>
                        <div className="p-2 rounded-lg bg-violet-500/10">
                            <Building2 className="h-5 w-5 text-violet-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Category + Unit Breakdown ──────────────────────────────── */}
            {filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold">By Category</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {byCategory.slice(0, 6).map(([cat, amount]) => {
                                const pct = Math.round((amount / totalFiltered) * 100);
                                return (
                                    <div key={cat}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="font-medium">{catLabel(cat)}</span>
                                            <span className="font-bold tabular-nums text-red-400">${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div className="h-full rounded-full bg-red-400/70 transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card className="border border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold">By Unit / Property</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {byUnit.slice(0, 6).map(([unitKey, amount]) => {
                                const pct = Math.round((amount / totalFiltered) * 100);
                                return (
                                    <div key={unitKey}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="font-medium">{unitKey}</span>
                                            <span className="font-bold tabular-nums text-amber-400">${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div className="h-full rounded-full bg-amber-400/70 transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── Toolbar ───────────────────────────────────────────────── */}
            <Card className="border-none shadow-sm bg-card overflow-hidden">
                <div className="p-4 border-b flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search expenses…"
                                className="pl-9 bg-background h-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs h-9">
                                <Download className="h-3.5 w-3.5" /> Export CSV
                            </Button>
                            <Button size="sm" onClick={() => openAdd()} className="gap-1.5 text-xs h-9 bg-amber-500 hover:bg-amber-600 text-white">
                                <Plus className="h-3.5 w-3.5" /> Add Expense
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="h-8 text-xs bg-background w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All years</SelectItem>
                                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={filterProp} onValueChange={v => { setFilterProp(v); setFilterUnit("all"); }}>
                            <SelectTrigger className="h-8 text-xs bg-background w-44">
                                <SelectValue placeholder="All properties" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All properties</SelectItem>
                                {properties.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.address?.split(",")[0]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {isMultiSelected && (
                            <Select value={filterUnit} onValueChange={setFilterUnit}>
                                <SelectTrigger className="h-8 text-xs bg-background w-32">
                                    <SelectValue placeholder="All units" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All units</SelectItem>
                                    {unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent>
                            </Select>

                        )}

                        <Select value={filterCat} onValueChange={setFilterCat}>
                            <SelectTrigger className="h-8 text-xs bg-background w-44">
                                <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All categories</SelectItem>
                                {EXPENSE_CATEGORIES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(filterProp !== "all" || filterCat !== "all" || filterYear !== String(new Date().getFullYear()) || filterUnit !== "all" || search) && (
                            <Button
                                variant="ghost" size="sm"
                                className="h-8 text-xs gap-1 text-muted-foreground"
                                onClick={() => { setFilterProp("all"); setFilterCat("all"); setFilterYear(String(new Date().getFullYear())); setFilterUnit("all"); setSearch(""); }}
                            >
                                <X className="h-3 w-3" /> Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                        <Receipt className="h-10 w-10 opacity-20" />
                        <p className="text-sm">No expenses found.</p>
                        <Button size="sm" onClick={() => openAdd()} className="mt-2 bg-amber-500 hover:bg-amber-600 text-white text-xs">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add your first expense
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Date</th>
                                    <th className="text-left px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Property</th>
                                    <th className="text-left px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Unit</th>
                                    <th className="text-left px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Category</th>
                                    <th className="text-left px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Description</th>
                                    <th className="text-left px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Vendor</th>
                                    <th className="text-right px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Amount</th>
                                    <th className="px-4 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((e, i) => (
                                    <tr key={e.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                            {e.expense_date ? new Date(e.expense_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell truncate max-w-[140px]">
                                            {e.properties?.address?.split(",")[0] || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                                            {e.unit_number || <span className="text-muted-foreground/40">—</span>}
                                        </td>
                                        <td className="px-4 py-3">{catBadge(e.category)}</td>
                                        <td className="px-4 py-3 text-xs font-medium text-foreground truncate max-w-[180px]">
                                            {e.description}
                                            {e.notes && <span className="block text-[10px] text-muted-foreground">{e.notes}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{e.vendor || "—"}</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-400 tabular-nums">
                                            ${parseFloat(e.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                                                    onClick={() => openEdit(e)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                    onClick={() => handleDelete(e.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-border bg-muted/30">
                                    <td colSpan={6} className="px-4 py-3 text-xs font-extrabold uppercase text-muted-foreground text-right hidden sm:table-cell">Total</td>
                                    <td colSpan={5} className="px-4 py-3 text-xs font-extrabold uppercase text-muted-foreground text-right sm:hidden">Total</td>
                                    <td className="px-4 py-3 text-right font-black text-red-400 tabular-nums">
                                        ${totalFiltered.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}

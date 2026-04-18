"use client";

import { useState } from "react";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { estimateRehabCost, type RehabItem } from "../actions";
import { Loader2, Hammer, Sparkles, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Config ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
    { id: "kitchen",      label: "Kitchen",              icon: "🍳" },
    { id: "bathrooms",    label: "Bathrooms",             icon: "🚿" },
    { id: "flooring",     label: "Flooring",              icon: "🪵" },
    { id: "roof",         label: "Roof",                  icon: "🏠" },
    { id: "hvac",         label: "HVAC / AC",             icon: "❄️" },
    { id: "electrical",   label: "Electrical",            icon: "⚡" },
    { id: "plumbing",     label: "Plumbing",              icon: "🔧" },
    { id: "paint",        label: "Interior Paint",        icon: "🎨" },
    { id: "windows",      label: "Windows & Doors",       icon: "🪟" },
    { id: "foundation",   label: "Foundation / Structure",icon: "🏗️" },
    { id: "landscaping",  label: "Exterior / Landscaping",icon: "🌿" },
    { id: "appliances",   label: "Appliances",            icon: "🫙" },
];

const CONDITIONS = [
    { value: "cosmetic",      label: "Cosmetic",      desc: "Minor fixes, paint, cleaning" },
    { value: "moderate",      label: "Moderate",      desc: "Significant repairs / partial" },
    { value: "full_replace",  label: "Full Replace",  desc: "Complete new installation" },
] as const;

type Condition = "cosmetic" | "moderate" | "full_replace";

interface Selection {
    checked: boolean;
    condition: Condition;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onApply: (amount: number) => void;
    purchasePrice?: number;
}

export function RehabEstimatorModal({ isOpen, onClose, onApply, purchasePrice }: Props) {
    const [sqft,      setSqft]      = useState("");
    const [bedrooms,  setBedrooms]  = useState("");
    const [bathrooms, setBathrooms] = useState("");
    const [notes,     setNotes]     = useState("");
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [estimate,  setEstimate]  = useState<any | null>(null);

    // One selection state per category
    const [selections, setSelections] = useState<Record<string, Selection>>(
        Object.fromEntries(CATEGORIES.map(c => [c.id, { checked: false, condition: "moderate" }]))
    );

    const toggle = (id: string) =>
        setSelections(prev => ({ ...prev, [id]: { ...prev[id], checked: !prev[id].checked } }));

    const setCondition = (id: string, condition: Condition) =>
        setSelections(prev => ({ ...prev, [id]: { ...prev[id], condition } }));

    const selectedCount = Object.values(selections).filter(s => s.checked).length;

    const handleEstimate = async () => {
        const items: RehabItem[] = CATEGORIES
            .filter(c => selections[c.id].checked)
            .map(c => ({ category: c.label, condition: selections[c.id].condition }));

        if (items.length === 0) {
            setError("Select at least one item to estimate.");
            return;
        }

        setLoading(true);
        setError(null);
        setEstimate(null);

        const result = await estimateRehabCost({
            items,
            sqft:     sqft      ? Number(sqft)      : undefined,
            bedrooms: bedrooms  ? Number(bedrooms)  : undefined,
            bathrooms:bathrooms ? Number(bathrooms) : undefined,
            notes,
        });

        setLoading(false);

        if (result.error) { setError(result.error); return; }
        setEstimate(result.data);
    };

    const midpoint = estimate
        ? Math.round((estimate.totalLow + estimate.totalHigh) / 2)
        : 0;

    const conditionColor: Record<Condition, string> = {
        cosmetic:     "text-blue-400",
        moderate:     "text-yellow-400",
        full_replace: "text-red-400",
    };

    return (
        <SimpleDialog
            isOpen={isOpen}
            onClose={onClose}
            title={
                <span className="flex items-center gap-2">
                    <Hammer className="h-5 w-5 text-orange-400" />
                    Rehab Estimator
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-600 text-white uppercase tracking-wide">AI</span>
                </span>
            }
            description="Select what needs work and let AI estimate the cost."
        >
            <div className="p-5 space-y-5">

                {/* Property details row */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Sqft",      value: sqft,      setter: setSqft,      placeholder: "1,200" },
                        { label: "Bedrooms",  value: bedrooms,  setter: setBedrooms,  placeholder: "3" },
                        { label: "Bathrooms", value: bathrooms, setter: setBathrooms, placeholder: "2" },
                    ].map(({ label, value, setter, placeholder }) => (
                        <div key={label} className="space-y-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
                            <Input
                                type="number"
                                value={value}
                                onChange={e => setter(e.target.value)}
                                placeholder={placeholder}
                                className="h-8 text-sm"
                            />
                        </div>
                    ))}
                </div>

                {/* Category checklist */}
                <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
                        Select items that need work
                    </p>
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                        {CATEGORIES.map(cat => {
                            const sel = selections[cat.id];
                            return (
                                <div
                                    key={cat.id}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                                        sel.checked
                                            ? "border-primary/40 bg-primary/5"
                                            : "border-border bg-muted/20 hover:bg-muted/40"
                                    )}
                                >
                                    <Checkbox
                                        checked={sel.checked}
                                        onCheckedChange={() => toggle(cat.id)}
                                        id={`cat-${cat.id}`}
                                    />
                                    <label
                                        htmlFor={`cat-${cat.id}`}
                                        className="flex-1 flex items-center gap-2 cursor-pointer text-sm font-medium"
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </label>
                                    {sel.checked && (
                                        <Select
                                            value={sel.condition}
                                            onValueChange={v => setCondition(cat.id, v as Condition)}
                                        >
                                            <SelectTrigger className={cn("h-7 w-[130px] text-xs border-0 bg-transparent p-0 pr-2 focus:ring-0", conditionColor[sel.condition])}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CONDITIONS.map(c => (
                                                    <SelectItem key={c.value} value={c.value} className="text-xs">
                                                        <div>
                                                            <p className="font-medium">{c.label}</p>
                                                            <p className="text-muted-foreground text-[10px]">{c.desc}</p>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Additional notes (optional)</p>
                    <Textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="e.g. Roof is 15 years old, kitchen has original 1980s cabinets..."
                        className="text-sm resize-none h-20"
                    />
                </div>

                {/* Estimate button */}
                <Button
                    className="w-full"
                    onClick={handleEstimate}
                    disabled={loading || selectedCount === 0}
                >
                    {loading
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Estimating…</>
                        : <><Sparkles className="h-4 w-4 mr-2" /> Estimate with AI ({selectedCount} item{selectedCount !== 1 ? "s" : ""})</>
                    }
                </Button>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 text-destructive text-sm rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Results */}
                {estimate && (
                    <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Estimate Ready
                        </p>

                        {/* Summary */}
                        {estimate.summary && (
                            <p className="text-xs text-muted-foreground italic">{estimate.summary}</p>
                        )}

                        {/* Itemized */}
                        <div className="space-y-1.5">
                            {estimate.items?.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-medium">{item.category}</span>
                                        <span className="text-[10px] text-muted-foreground">{item.notes}</span>
                                    </div>
                                    <span className="tabular-nums font-semibold shrink-0">
                                        ${item.low?.toLocaleString()} – ${item.high?.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Total range */}
                        <div className="border-t border-emerald-500/20 pt-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total range</p>
                                <p className="font-semibold text-sm">
                                    ${estimate.totalLow?.toLocaleString()} – ${estimate.totalHigh?.toLocaleString()}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => { onApply(midpoint); onClose(); }}
                            >
                                Apply ${midpoint.toLocaleString()} to Deal
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </SimpleDialog>
    );
}

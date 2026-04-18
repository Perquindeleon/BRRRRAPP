"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, AlertTriangle, Upload, X } from "lucide-react";
import Image from "next/image";

const CATEGORIES = [
    { value: "plumbing",    label: "Plumbing",     emoji: "🚿" },
    { value: "electrical",  label: "Electrical",   emoji: "⚡" },
    { value: "hvac",        label: "A/C & Heat",   emoji: "❄️" },
    { value: "appliance",   label: "Appliance",    emoji: "🍳" },
    { value: "pest",        label: "Pest",         emoji: "🐛" },
    { value: "structural",  label: "Structural",   emoji: "🏗️" },
    { value: "roofing",     label: "Roofing",      emoji: "🏠" },
    { value: "landscaping", label: "Landscaping",  emoji: "🌿" },
    { value: "general",     label: "Other",        emoji: "🔧" },
];

const PRIORITIES = [
    { value: "low",       label: "Not urgent",  desc: "Can wait a few days",    color: "border-green-500/40 bg-green-500/10 text-green-500" },
    { value: "normal",    label: "Normal",       desc: "Needs attention soon",   color: "border-blue-500/40 bg-blue-500/10 text-blue-500" },
    { value: "urgent",    label: "Urgent",       desc: "Please fix this week",   color: "border-amber-500/40 bg-amber-500/10 text-amber-500" },
    { value: "emergency", label: "Emergency",    desc: "Safety hazard / flooding", color: "border-red-500/40 bg-red-500/10 text-red-500" },
];

type Tenant = { id: string; name: string; unit_number?: string };

export default function TenantRequestForm({
    propertyId,
    tenants,
}: {
    propertyId: string;
    tenants: Tenant[];
}) {
    const [submitted, setSubmitted] = React.useState(false);
    const [loading, setLoading]     = React.useState(false);
    const [error, setError]         = React.useState("");

    const [tenantId, setTenantId]       = React.useState("");
    const [tenantName, setTenantName]   = React.useState("");
    const [title, setTitle]             = React.useState("");
    const [description, setDescription] = React.useState("");
    const [category, setCategory]       = React.useState("general");
    const [priority, setPriority]       = React.useState("normal");
    const [photo, setPhoto]             = React.useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhoto(file);
        const reader = new FileReader();
        reader.onload = ev => setPhotoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    function removePhoto() {
        setPhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) { setError("Please enter a title."); return; }
        if (tenants.length > 0 && !tenantId) { setError("Please select your name."); return; }
        if (tenants.length === 0 && !tenantName.trim()) { setError("Please enter your name."); return; }

        setLoading(true);
        setError("");

        const fd = new FormData();
        fd.append("property_id", propertyId);
        fd.append("title", title);
        fd.append("description", description);
        fd.append("category", category);
        fd.append("priority", priority);
        if (tenantId)   fd.append("tenant_id",   tenantId);
        if (tenantName) fd.append("tenant_name", tenantName);
        if (photo)      fd.append("photo", photo);

        try {
            const res = await fetch("/api/maintenance/submit", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok || data.error) { setError(data.error || "Failed to submit request."); return; }
            setSubmitted(true);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (submitted) {
        return (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold">Request Submitted!</h2>
                <p className="text-muted-foreground text-sm">
                    Your maintenance request has been sent to your property manager. You'll be contacted once it's been reviewed.
                </p>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setTitle(""); setDescription(""); setPhoto(null); setPhotoPreview(null);
                        setTenantId(""); setTenantName("");
                    }}
                    className="text-sm text-violet-500 hover:underline"
                >
                    Submit another request
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-5">
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Who are you */}
            <div className="space-y-1.5">
                <Label>{tenants.length > 0 ? "Your Name" : "Your Name"} <span className="text-red-500">*</span></Label>
                {tenants.length > 0 ? (
                    <select
                        value={tenantId}
                        onChange={e => setTenantId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">Select your name…</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name}{t.unit_number ? ` — ${t.unit_number}` : ""}
                            </option>
                        ))}
                    </select>
                ) : (
                    <Input
                        placeholder="Your full name"
                        value={tenantName}
                        onChange={e => setTenantName(e.target.value)}
                    />
                )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
                <Label>What's the issue? <span className="text-red-500">*</span></Label>
                <Input
                    placeholder="e.g. Kitchen faucet is leaking"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
            </div>

            {/* Category */}
            <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(c => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setCategory(c.value)}
                            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-semibold transition-colors ${
                                category === c.value
                                    ? "border-violet-500 bg-violet-500/10 text-violet-400"
                                    : "border-border bg-background text-muted-foreground hover:border-violet-400/50"
                            }`}
                        >
                            <span className="text-lg">{c.emoji}</span>
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
                <Label>How urgent is this?</Label>
                <div className="grid grid-cols-2 gap-2">
                    {PRIORITIES.map(p => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => setPriority(p.value)}
                            className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-colors ${
                                priority === p.value
                                    ? `border-2 ${p.color}`
                                    : "border-border bg-background text-muted-foreground hover:border-border/80"
                            }`}
                        >
                            <span className="text-sm font-semibold">{p.label}</span>
                            <span className="text-xs opacity-70 mt-0.5">{p.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <Label>Description <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <textarea
                    rows={3}
                    placeholder="Describe the problem in detail. When did it start? How severe is it?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
            </div>

            {/* Photo */}
            <div className="space-y-2">
                <Label>Photo <span className="text-muted-foreground text-xs font-normal">(optional but helpful)</span></Label>
                {photoPreview ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-violet-400/50 hover:text-violet-400 transition-colors"
                    >
                        <Camera className="h-8 w-8" />
                        <span className="text-sm font-medium">Tap to add a photo</span>
                        <span className="text-xs opacity-70">JPG, PNG, HEIC — max 10 MB</span>
                    </button>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoChange}
                />
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-base font-semibold"
            >
                {loading ? "Submitting…" : "Submit Request"}
            </Button>
        </form>
    );
}

"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Loader2,
    AlertCircle,
    Building2,
    ArrowUpDown,
    SlidersHorizontal,
} from "lucide-react";
import { PropertyCard, type RentcastProperty } from "./components/PropertyCard";
import { AddressAutocomplete } from "@/components/properties/address-autocomplete";

const EXAMPLES = ["33101", "Miami, FL", "Austin, TX", "90210", "Chicago, IL"];

type SortKey = "price-asc" | "price-desc" | "year-asc" | "year-desc" | "default";

const SORT_LABELS: Record<SortKey, string> = {
    "default":    "Default",
    "price-asc":  "Price: Low → High",
    "price-desc": "Price: High → Low",
    "year-asc":   "Year Built: Oldest",
    "year-desc":  "Year Built: Newest",
};

const BED_OPTIONS  = ["Any", "1", "2", "3", "4", "5+"];
const BATH_OPTIONS = ["Any", "1", "1.5", "2", "3", "4+"];

export default function FindDealsPage() {
    const [query,   setQuery]   = useState("");
    const [results, setResults] = useState<RentcastProperty[]>([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    // Controls
    const [sortKey,   setSortKey]   = useState<SortKey>("default");
    const [filterBed,  setFilterBed]  = useState("Any");
    const [filterBath, setFilterBath] = useState("Any");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleSearch = async (q = query) => {
        const trimmed = q.trim();
        if (!trimmed) return;

        setLoading(true);
        setError(null);
        setResults([]);
        setSearched(true);
        // Reset controls on new search
        setSortKey("default");
        setFilterBed("Any");
        setFilterBath("Any");

        try {
            const res  = await fetch(`/api/find-deals?q=${encodeURIComponent(trimmed)}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Something went wrong. Please try again.");
                return;
            }
            setResults(data.results ?? []);
        setSelectedId(null);
        } catch {
            setError("Network error. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    // Derived: filter then sort — runs only when deps change
    const displayed = useMemo(() => {
        let list = [...results];

        // Filter bedrooms
        if (filterBed !== "Any") {
            const min = parseInt(filterBed);
            list = list.filter((p) =>
                filterBed === "5+"
                    ? (p.bedrooms ?? 0) >= 5
                    : p.bedrooms === min
            );
        }

        // Filter bathrooms
        if (filterBath !== "Any") {
            const target = parseFloat(filterBath);
            list = list.filter((p) =>
                filterBath === "4+"
                    ? (p.bathrooms ?? 0) >= 4
                    : p.bathrooms === target
            );
        }

        // Sort
        const price = (p: RentcastProperty) =>
            p.price ?? p.estimatedValue ?? p.lastSalePrice ?? 0;

        if (sortKey === "price-asc")  list.sort((a, b) => price(a) - price(b));
        if (sortKey === "price-desc") list.sort((a, b) => price(b) - price(a));
        if (sortKey === "year-asc")   list.sort((a, b) => (a.yearBuilt ?? 0) - (b.yearBuilt ?? 0));
        if (sortKey === "year-desc")  list.sort((a, b) => (b.yearBuilt ?? 0) - (a.yearBuilt ?? 0));

        return list;
    }, [results, sortKey, filterBed, filterBath]);

    const hasResults = !loading && results.length > 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Find Deals</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Search active listings and property records. Click "Analyze in BRRRR" to run numbers instantly.
                </p>
            </div>

            {/* Search bar */}
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <AddressAutocomplete
                        label={null}
                        placeholder="Search by address, zip code, or city  (e.g. Miami, FL)"
                        value={query}
                        onChange={setQuery}
                        onSelect={(address) => {
                            setQuery(address);
                            handleSearch(address);
                        }}
                    />
                </div>
                <Button onClick={() => handleSearch()} disabled={loading || !query.trim()}>
                    {loading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Search className="h-4 w-4" />}
                    <span className="ml-2">Search</span>
                </Button>
            </div>

            {/* Quick examples */}
            {!searched && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Try:</span>
                    {EXAMPLES.map((ex) => (
                        <Badge
                            key={ex}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors text-xs"
                            onClick={() => { setQuery(ex); handleSearch(ex); }}
                        >
                            {ex}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Sort + Filter toolbar — only shown after results load */}
            {hasResults && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3">
                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Sort by</span>
                        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                            <SelectTrigger className="h-8 w-[180px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                                    <SelectItem key={k} value={k} className="text-xs">
                                        {SORT_LABELS[k]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-px h-5 bg-border hidden sm:block" />

                    {/* Bedrooms */}
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Beds</span>
                        <div className="flex gap-1">
                            {BED_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setFilterBed(opt)}
                                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                                        filterBed === opt
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-px h-5 bg-border hidden sm:block" />

                    {/* Bathrooms */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Baths</span>
                        <div className="flex gap-1">
                            {BATH_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setFilterBath(opt)}
                                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                                        filterBath === opt
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active filter count / reset */}
                    {(filterBed !== "Any" || filterBath !== "Any" || sortKey !== "default") && (
                        <button
                            onClick={() => { setSortKey("default"); setFilterBed("Any"); setFilterBath("Any"); }}
                            className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm">Searching properties…</p>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Search failed</p>
                        <p className="text-destructive/80 mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {/* Empty after search */}
            {!loading && searched && !error && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Building2 className="h-10 w-10" />
                    <p className="font-medium">No properties found</p>
                    <p className="text-sm">Try a different address, zip code, or city.</p>
                </div>
            )}

            {/* Empty after filter */}
            {hasResults && displayed.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                    <Building2 className="h-8 w-8" />
                    <p className="text-sm font-medium">No properties match your filters</p>
                    <button
                        onClick={() => { setFilterBed("Any"); setFilterBath("Any"); }}
                        className="text-xs underline underline-offset-2 hover:text-foreground"
                    >
                        Clear filters
                    </button>
                </div>
            )}

            {/* Results grid */}
            {hasResults && displayed.length > 0 && (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        {displayed.length === results.length
                            ? `${results.length} propert${results.length === 1 ? "y" : "ies"} found`
                            : `${displayed.length} of ${results.length} properties`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {displayed.map((p, i) => {
                            const cardId = p.id ?? String(i);
                            return (
                                <PropertyCard
                                    key={cardId}
                                    property={p}
                                    selected={selectedId === cardId}
                                    onSelect={() => setSelectedId(selectedId === cardId ? null : cardId)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

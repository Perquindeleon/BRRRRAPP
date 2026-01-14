"use client";

import { useState } from "react";
import { generateRehabPlan } from "./ai-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Need to check/create this
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";

export function AiEstimator({ propertyId }: { propertyId: string }) {
    const [loading, setLoading] = useState(false);
    const [sqft, setSqft] = useState("1500");
    const [description, setDescription] = useState("");
    const [result, setResult] = useState<{ success?: boolean; error?: string; count?: number } | null>(null);

    const handleGenerate = async () => {
        if (!description) return;
        setLoading(true);
        setResult(null);

        const res = await generateRehabPlan(description, parseInt(sqft), propertyId);

        setResult(res);
        setLoading(false);

        if (res.success) {
            // Clear form on success
            setDescription("");
        }
    };

    return (
        <Card className="border-indigo-500/20 bg-indigo-50/10">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    <CardTitle>AI Estimator</CardTitle>
                </div>
                <CardDescription>Describe your renovation plan and let AI create the budget.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="sqft">Square Footage</Label>
                    <Input
                        id="sqft"
                        type="number"
                        value={sqft}
                        onChange={(e) => setSqft(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="scope">Project Scope / Condition</Label>

                    <Select onValueChange={(val: string) => {
                        const templates: Record<string, string> = {
                            "Cosmetic": "Full interior paint, luxury vinyl plank flooring throughout, replace light fixtures and outlets, minor landscaping.",
                            "Standard": "Update kitchen (cabinets/counters), renovate bathrooms, new flooring, paint, roof repairs, service HVAC.",
                            "Full Gut": "Demo to studs. New electrical, plumbing, and HVAC. New roof, windows, insulation, drywall. High-end finishings.",
                            "Turnkey": "Deep cleaning, carpet cleaning, touch-up paint, landscaping cleanup."
                        };
                        if (templates[val]) setDescription(templates[val]);
                    }}>
                        <SelectTrigger className="h-8 text-xs w-full md:w-[200px] mb-2">
                            <SelectValue placeholder="Select a Template..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cosmetic">Cosmetic Rehab</SelectItem>
                            <SelectItem value="Standard">Standard Renovation</SelectItem>
                            <SelectItem value="Full Gut">Full Gut / Rebuild</SelectItem>
                            <SelectItem value="Turnkey">Light Touch / Turnkey</SelectItem>
                        </SelectContent>
                    </Select>

                    <Textarea
                        id="scope"
                        placeholder="e.g. Full cosmetic rehab. New roof needed. Update kitchen with granite. 2 bathrooms need new tile. Floors refinish."
                        className="min-h-[120px]"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {result?.error && (
                    <p className="text-sm text-red-500">{result.error}</p>
                )}

                {result?.success && (
                    <p className="text-sm text-green-600">Successfully added {result.count} items to the budget!</p>
                )}

                <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleGenerate}
                    disabled={loading || !description}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Budget...
                        </>
                    ) : (
                        "Generate Budget"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

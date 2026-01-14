"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AnalyzerForm } from "../components/analyzer-form";
import { Loader2 } from "lucide-react";

export default function EditAnalyzePage() {
    const params = useParams();
    const id = params.id as string;
    const supabase = createClient();
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('properties')
                .select(`
                    *,
                    financials (*)
                `)
                .eq('id', id)
                .single();

            if (data) {
                // Flatten the structure slightly if needed, or pass distinct props
                // For now, passing the raw object. The component expects:
                // initialData.financials[0] -> for logic.
                // But our component reads initialData.financials.xxx directly if it's an object, or we need to map it.
                // The Supabase join returns an array for financials: financials: [{...}]
                // Let's normalize it here.
                const flatData = {
                    ...data,
                    financials: data.financials?.[0] || {}
                }
                setInitialData(flatData);
            }
            setLoading(false);
        };

        if (id) fetchData();
    }, [id]);

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    if (!initialData) {
        return <div className="p-8">Deal not found.</div>;
    }

    return <AnalyzerForm initialData={initialData} mode="edit" />;
}

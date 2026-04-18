import { createServiceClient } from "@/lib/supabase/service";
import TenantRequestForm from "./tenant-request-form";
import { notFound } from "next/navigation";

export default async function TenantSubmitPage({ params }: { params: { propertyId: string } }) {
    const supabase = createServiceClient();

    const { data: property } = await supabase
        .from("properties")
        .select("id, address, city, state")
        .eq("id", params.propertyId)
        .single();

    if (!property) notFound();

    const { data: tenants } = await supabase
        .from("tenants")
        .select("id, name, unit_number")
        .eq("property_id", params.propertyId)
        .eq("status", "active");

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
                        <svg className="h-7 w-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold">Maintenance Request</h1>
                    <p className="text-muted-foreground mt-1">
                        {property.address}, {property.city}{property.state ? `, ${property.state}` : ""}
                    </p>
                </div>

                <TenantRequestForm
                    propertyId={property.id}
                    tenants={tenants || []}
                />
            </div>
        </div>
    );
}

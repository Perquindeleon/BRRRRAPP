import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const supabase = createServiceClient();

        const propertyId = formData.get("property_id") as string;
        const tenantId   = formData.get("tenant_id")   as string;
        const tenantName = formData.get("tenant_name")  as string;
        const title      = formData.get("title")        as string;
        const description = formData.get("description") as string;
        const category   = formData.get("category")     as string || "general";
        const priority   = formData.get("priority")     as string || "normal";

        if (!propertyId || !title) {
            return NextResponse.json({ error: "Property and title are required" }, { status: 400 });
        }

        // Verify property exists
        const { data: property } = await supabase
            .from("properties")
            .select("id, user_id")
            .eq("id", propertyId)
            .single();

        if (!property) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        // Handle photo upload
        let photoUrl: string | null = null;
        const photoFile = formData.get("photo") as File;

        if (photoFile && photoFile.size > 0) {
            const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
            const filename = `${propertyId}/${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("maintenance-photos")
                .upload(filename, photoFile, { contentType: photoFile.type });

            if (uploadError) {
                console.error("Photo upload error:", uploadError);
                return NextResponse.json(
                    { error: `Photo upload failed: ${uploadError.message}. Make sure the 'maintenance-photos' storage bucket exists.` },
                    { status: 500 }
                );
            }

            const { data: { publicUrl } } = supabase.storage
                .from("maintenance-photos")
                .getPublicUrl(filename);

            photoUrl = publicUrl;
        }

        // Build insert
        const record: Record<string, any> = {
            user_id: property.user_id,
            property_id: propertyId,
            title,
            description,
            category,
            priority,
            status: "open",
        };

        if (tenantId)   record.tenant_id  = tenantId;
        if (photoUrl)   record.photo_url  = photoUrl;
        if (!tenantId && tenantName) record.description = `[From: ${tenantName}]\n\n${description || ""}`.trim();

        const { error } = await supabase.from("maintenance_requests").insert(record);

        if (error) {
            console.error("Insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Maintenance submit error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

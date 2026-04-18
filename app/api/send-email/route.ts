import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "RESEND_API_KEY no está configurada en .env.local. Sigue las instrucciones para activar el envío de emails." },
                { status: 503 }
            );
        }

        const { to, subject, body, fromName } = await req.json();

        if (!to || !subject || !body) {
            return NextResponse.json({ error: "Faltan campos: to, subject, body" }, { status: 400 });
        }

        // Import Resend only after confirming the key exists
        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);

        const fromDomain = process.env.RESEND_FROM_DOMAIN || "onboarding@resend.dev";
        const senderName = fromName || "BRRRROS Property Management";

        const { data, error } = await resend.emails.send({
            from: `${senderName} <${fromDomain}>`,
            to: [to],
            subject,
            text: body,
            html: `<div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px;">
                ${body.split("\n").map((line: string) =>
                    line.trim() === "" ? "<br/>" : `<p style="margin: 0 0 8px 0;">${line}</p>`
                ).join("")}
            </div>`,
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json({ error: (error as any).message ?? "Error al enviar el email." }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: data?.id });

    } catch (err: any) {
        console.error("Send email route error:", err);
        return NextResponse.json({ error: err?.message ?? "Error inesperado." }, { status: 500 });
    }
}

"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- MOCK AI IMPLEMENTATION (No API Key Required) ---
export async function generateRehabPlan(description: string, sqft: number, propertyId: string) {
    // Simulate AI "thinking" delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const items: any[] = [];
    const text = description.toLowerCase();

    // Basic keyword analysis logic
    if (text.includes("kitchen") || text.includes("cocina")) {
        items.push({ category: "Kitchen", description: "Full kitchen remodel (Cabinets, Counters)", estimated_cost: 15000 });
    }
    if (text.includes("bath") || text.includes("baño") || text.includes("restroom")) {
        items.push({ category: "Bathroom", description: "Bathroom update (Vanity, Toilet, Tile)", estimated_cost: 8500 });
    }
    if (text.includes("roof") || text.includes("techo")) {
        items.push({ category: "Exterior", description: "New Roof Installation", estimated_cost: 12000 });
    }
    if (text.includes("floor") || text.includes("pisos") || text.includes("carpet")) {
        items.push({ category: "Interior", description: "New Flooring (LVP throughout)", estimated_cost: sqft * 4 });
    }
    if (text.includes("paint") || text.includes("pintura")) {
        items.push({ category: "Interior", description: "Interior Paint (Full House)", estimated_cost: sqft * 2.5 });
    }
    if (text.includes("window") || text.includes("ventanas")) {
        items.push({ category: "Exterior", description: "Window Replacement", estimated_cost: 6000 });
    }
    if (text.includes("hvac") || text.includes("ac") || text.includes("air")) {
        items.push({ category: "Mechanical", description: "HVAC System Replacement", estimated_cost: 7500 });
    }

    // Default item if nothing matched
    if (items.length === 0) {
        items.push({ category: "General", description: "General Repairs / Updates", estimated_cost: 5000 });
    }

    try {
        const supabase = createClient();

        const itemsToInsert = items.map((item: any) => ({
            property_id: propertyId,
            category: item.category,
            description: item.description,
            estimated_cost: item.estimated_cost,
            status: "planned"
        }));

        const { error } = await supabase.from("rehab_items").insert(itemsToInsert);

        if (error) {
            console.error("Supabase insert error:", error);
            return { error: "Failed to save items to database." };
        }

        revalidatePath(`/dashboard/projects/${propertyId}`);
        return { success: true, count: items.length };

    } catch (err: any) {
        console.error("Error:", err);
        return { error: "Failed to generate estimate: " + err.message };
    }
}

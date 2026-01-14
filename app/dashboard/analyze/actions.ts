"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateDealAnalysis(data: any) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    console.log("Generating Deal Analysis for user:", user.id);

    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY is missing in environment variables.");
        return { error: "Configuration Error: OpenAI API Key is missing. Please check .env" };
    }

    try {
        console.log("Calling OpenAI API...");
        const prompt = `
        Act as a seasoned real estate investment expert specializing in the BRRRR strategy (Buy, Rehab, Rent, Refinance, Repeat).
        Analyze the following deal data and provide a comprehensive report in JSON format containing both English and Spanish sections.

        DEAL DATA:
        - Purchase Price: $${data.purchasePrice}
        - Rehab Budget: $${data.rehabBudget}
        - ARV (After Repair Value): $${data.arv}
        - Monthly Rent: $${data.monthlyRent}
        - Address: ${data.address || 'N/A'}
        
        CALCULATED METRICS:
        - Total Investment (Purchase + Rehab): $${data.purchasePrice + data.rehabBudget}
        - Refinance Loan Amount (75% of ARV): $${data.refiLoanAmount}
        - Cash Left in Deal: $${data.cashLeftInDeal}
        - Monthly Cash Flow: $${data.monthlyCashFlow}
        - ROI/Cash-on-Cash: ${data.cashOnCash}%

        INSTRUCTIONS:
        1. Evaluate the deal based on the numbers. Is it a "Home Run", "Solid Single", or "Pass"? default to conservative.
        2. Provide a "SWOT Analysis" (Strengths, Weaknesses, Opportunities, Threats).
        3. Give 3 actionable recommendations for success.
        4. CRITICAL: You MUST cite specific numbers from the provided data (e.g., "Cash flow of $200", "ROI of 12%") in your summary, SWOT, and recommendations to back up your claims. Do not just say "good cash flow", say "good cash flow of $X".
        4. The output MUST be a valid JSON object with this exact structure:
        {
            "english": {
                "verdict": "string",
                "summary": "string",
                "swot": {
                    "strengths": ["string"],
                    "weaknesses": ["string"],
                    "opportunities": ["string"],
                    "threats": ["string"]
                },
                "recommendations": ["string"]
            },
            "spanish": {
                "verdict": "string",
                "summary": "string",
                "swot": {
                    "strengths": ["string"],
                    "weaknesses": ["string"],
                    "opportunities": ["string"],
                    "threats": ["string"]
                },
                "recommendations": ["string"]
            }
        }
        `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful real estate AI assistant." }, { role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No response from AI");

        return { data: JSON.parse(content) };

    } catch (error: any) {
        console.error("AI Analysis Error:", error);
        return { error: error.message || "Failed to generate analysis" };
    }
}

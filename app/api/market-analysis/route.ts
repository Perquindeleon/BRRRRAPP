import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const RENTCAST_BASE = 'https://api.rentcast.io/v1';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchRentcastMarket(location: string) {
    const apiKey = process.env.RENTCAST_API_KEY;
    if (!apiKey) return null;

    const normalized = location.replace(/,?\s*(USA|United States)\s*$/i, '').trim();
    const isZip = /^\d{5}$/.test(normalized);
    const cityStateMatch = normalized.match(/^([^,]+),\s*([A-Za-z]{2})(?:\s+\d{5})?$/);

    const params = new URLSearchParams();
    if (isZip) {
        params.set('zipCode', normalized);
    } else if (cityStateMatch) {
        params.set('city', cityStateMatch[1].trim());
        params.set('state', cityStateMatch[2].toUpperCase());
    } else {
        return null; // Full addresses not supported by /markets
    }

    try {
        const res = await fetch(`${RENTCAST_BASE}/markets?${params}`, {
            headers: { 'X-Api-Key': apiKey },
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const { location } = await request.json();
    if (!location?.trim()) {
        return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    // Fetch real market data from Rentcast (optional enrichment)
    const market = await fetchRentcastMarket(location.trim());

    const rentcastContext = market
        ? `
Real Rentcast Market Data for this area:
- Average Rent: $${market.averageRent ?? market.medianRent ?? 'N/A'}/mo
- YoY Rent Change: ${market.averageRentYoY ?? market.rentYoY ?? 'N/A'}%
- Average Sale Price: $${market.averageSalePrice ?? market.medianSalePrice ?? 'N/A'}
- YoY Price Change: ${market.averageSalePriceYoY ?? market.priceYoY ?? 'N/A'}%
- Active Listings: ${market.activeListing ?? market.activeListings ?? 'N/A'}
- Avg Days on Market: ${market.averageDaysOnMarket ?? 'N/A'}
`
        : '';

    const prompt = `You are an expert real estate market analyst with deep knowledge of US neighborhoods, crime statistics, school ratings, flood zones, and gentrification patterns. Analyze the real estate investment market for: "${location.trim()}"

${rentcastContext}

Provide a comprehensive neighborhood and market analysis. Use your knowledge of this specific location to give accurate, realistic data. Return ONLY a valid JSON object with no markdown, no code blocks, just raw JSON:

{
  "neighborhoodGrade": "A" or "B" or "C" or "D" or "F",
  "gradeScore": integer 0-100,
  "gradeReason": "one sentence explaining the grade",
  "crimeLevel": "Very Low" or "Low" or "Moderate" or "High" or "Very High",
  "crimeScore": integer 1-10 (10 = safest),
  "schoolScore": integer 1-10 (10 = best),
  "schoolRating": "Excellent" or "Good" or "Average" or "Below Average" or "Poor",
  "floodZone": "Minimal" or "Moderate" or "High",
  "floodNote": "one sentence about flood risk",
  "gentrification": "Early Stage" or "Accelerating" or "Stable" or "Peaked" or "Declining",
  "gentrificationNote": "one sentence about neighborhood trajectory",
  "marketHeatScore": integer 0-100,
  "arvForecast": number like 3.5 for +3.5% or -1.2 for -1.2%,
  "rentGrowth": number like 4.0,
  "avgRent": integer monthly rent USD,
  "avgHomeValue": integer home value USD,
  "verdict": "2-3 sentences of actionable investor insight for BRRRR or rental strategy",
  "hotNeighborhoods": ["name1", "name2", "name3"],
  "priceTrend": [
    { "month": "Jan", "value": integer },
    { "month": "Feb", "value": integer },
    { "month": "Mar", "value": integer },
    { "month": "Apr", "value": integer },
    { "month": "May", "value": integer },
    { "month": "Jun", "value": integer }
  ]
}

The priceTrend values should represent thousands (e.g. 320 = $320k avg home value over last 6 months, showing realistic trend).`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a real estate market analyst. Return only valid JSON, no markdown, no code fences.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });

        const raw = completion.choices[0]?.message?.content?.trim() ?? '';

        // Strip any accidental markdown fences
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

        let analysisData;
        try {
            analysisData = JSON.parse(cleaned);
        } catch {
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        // Override with real Rentcast data where available
        if (market) {
            if (market.averageRent || market.medianRent) {
                analysisData.avgRent = market.averageRent ?? market.medianRent;
            }
            if (market.averageSalePrice || market.medianSalePrice) {
                analysisData.avgHomeValue = market.averageSalePrice ?? market.medianSalePrice;
            }
            if (market.averageRentYoY ?? market.rentYoY) {
                analysisData.rentGrowth = market.averageRentYoY ?? market.rentYoY;
            }
            if (market.averageSalePriceYoY ?? market.priceYoY) {
                analysisData.arvForecast = market.averageSalePriceYoY ?? market.priceYoY;
            }
        }

        return NextResponse.json({ location: location.trim(), ...analysisData });
    } catch (err) {
        console.error('[market-analysis]', err);
        return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
    }
}

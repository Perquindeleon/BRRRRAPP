import { NextRequest, NextResponse } from 'next/server';

const RENTCAST_BASE = 'https://api.rentcast.io/v1';

export async function GET(request: NextRequest) {
    const apiKey = process.env.RENTCAST_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Rentcast API key not configured' }, { status: 500 });
    }

    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Strip Google Places country suffix  e.g. "Reading, PA, USA" → "Reading, PA"
    const normalized = query
        .replace(/,?\s*(USA|United States)\s*$/i, '')
        .trim();

    // Detect search type
    const isZip = /^\d{5}$/.test(normalized);
    // Matches "City, ST" or "City, ST 12345"
    const cityStateMatch = normalized.match(/^([^,]+),\s*([A-Za-z]{2})(?:\s+\d{5})?$/);

    let endpoint: string;
    const params = new URLSearchParams();

    if (isZip) {
        endpoint = '/listings/sale';
        params.set('zipCode', normalized);
        params.set('status', 'Active');
        params.set('limit', '24');
    } else if (cityStateMatch) {
        endpoint = '/listings/sale';
        params.set('city', cityStateMatch[1].trim());
        params.set('state', cityStateMatch[2].toUpperCase());
        params.set('status', 'Active');
        params.set('limit', '24');
    } else {
        // Full street address — use /properties for detailed record
        endpoint = '/properties';
        params.set('address', normalized);
    }

    try {
        const url = `${RENTCAST_BASE}${endpoint}?${params.toString()}`;

        const res = await fetch(url, {
            headers: { 'X-Api-Key': apiKey },
            next: { revalidate: 300 }, // cache 5 min
        });

        if (!res.ok) {
            let message = `Error ${res.status}`;
            try {
                const body = await res.json();
                if (body?.message) message = body.message;
                else if (body?.error) message = body.error;
            } catch {
                message = await res.text() || message;
            }
            // Surface a friendly hint for subscription issues
            if (res.status === 401) {
                message = "Rentcast API key inactive. Go to app.rentcast.io/app/api and activate your free plan.";
            }
            return NextResponse.json({ error: message }, { status: res.status });
        }

        const data = await res.json();

        // Normalize: both /listings/sale and /properties return arrays
        const items: object[] = Array.isArray(data) ? data : [data];

        return NextResponse.json({ results: items, total: items.length });
    } catch (err) {
        console.error('[find-deals]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

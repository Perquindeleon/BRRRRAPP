import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const apiKey = process.env.RENTCAST_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Rentcast API key not configured' }, { status: 500 });
    }

    const address = request.nextUrl.searchParams.get('address')?.trim();
    if (!address) {
        return NextResponse.json({ error: 'address is required' }, { status: 400 });
    }

    try {
        const url = `https://api.rentcast.io/v1/avm/rent/long-term?address=${encodeURIComponent(address)}`;

        const res = await fetch(url, {
            headers: { 'X-Api-Key': apiKey },
        });

        if (!res.ok) {
            let msg = `Error ${res.status}`;
            try { const b = await res.json(); msg = b?.message ?? b?.error ?? msg; } catch {}
            return NextResponse.json({ error: msg }, { status: res.status });
        }

        const data = await res.json();

        return NextResponse.json({
            rent:          data.rent          ?? null,
            rentRangeLow:  data.rentRangeLow  ?? null,
            rentRangeHigh: data.rentRangeHigh ?? null,
            address:       data.address       ?? address,
        });
    } catch (err) {
        console.error('[rent-estimate]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

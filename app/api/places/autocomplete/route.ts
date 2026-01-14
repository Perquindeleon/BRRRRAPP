import { NextResponse } from 'next/server';

const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1/places:autocomplete';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Google Maps API key is not configured' },
                { status: 500 }
            );
        }

        const response = await fetch(GOOGLE_PLACES_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching places:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

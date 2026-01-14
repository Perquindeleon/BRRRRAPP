import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const placeId = searchParams.get('placeId');
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!placeId) {
            return NextResponse.json({ error: 'Missing placeId' }, { status: 400 });
        }

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Google Maps API key is not configured' },
                { status: 500 }
            );
        }

        // Fields needed: addressComponents to parse city, state, zip
        const fields = 'addressComponents';
        const url = `https://places.googleapis.com/v1/places/${placeId}?fields=${fields}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching place details:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocode';

/**
 * API endpoint for geocoding a single address
 * Used by the admin panel to geocode addresses on demand
 */
export async function POST(request: Request) {
  try {
    const { address, borough, zipCode } = await request.json();

    if (!address) {
      return NextResponse.json(
      { error: 'Address is required' },
      { status: 400 }
    );
    }

    const result = await geocodeAddress(address, borough, zipCode);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
}


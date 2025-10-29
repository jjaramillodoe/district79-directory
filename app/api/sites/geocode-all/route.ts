import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { geocodeAddress } from '@/lib/geocode';

/**
 * API endpoint to geocode all sites that don't have coordinates
 * Can be called manually from admin panel to geocode all addresses
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { regeocodeAll } = body;

    const client = await mongodb;
    const db = client.db('district79');
    
    // Find sites to geocode - either without coordinates or all if regeocodeAll is true
    const queryFilter: any = {
      buildingAddress: { $exists: true, $ne: '' },
    };

    if (!regeocodeAll) {
      // Only geocode sites without coordinates
      queryFilter.$or = [
        { latitude: { $exists: false } },
        { latitude: null },
        { longitude: { $exists: false } },
        { longitude: null },
      ];
    }

    const sitesToGeocode = await db
      .collection('sites')
      .find(queryFilter)
      .toArray();

    if (sitesToGeocode.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All sites already have coordinates',
        geocoded: 0,
        failed: 0,
      });
    }

    let geocoded = 0;
    let failed = 0;
    const errors: string[] = [];

    // Geocode each site (with rate limiting)
    for (let i = 0; i < sitesToGeocode.length; i++) {
      const site = sitesToGeocode[i];
      
      try {
        const result = await geocodeAddress(
          site.buildingAddress,
          site.borough,
          site.zipCode
        );

        if (result.latitude && result.longitude) {
          await db.collection('sites').updateOne(
            { _id: site._id },
            {
              $set: {
                latitude: result.latitude,
                longitude: result.longitude,
              },
            }
          );
          geocoded++;
        } else {
          failed++;
          errors.push(`${site.siteName}: ${result.error || 'No coordinates found'}`);
        }

        // Rate limiting: wait 1 second between requests (already handled in geocodeAddress, but extra safety)
        if (i < sitesToGeocode.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1100));
        }
      } catch (error) {
        failed++;
        errors.push(`${site.siteName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Geocoded ${geocoded} sites, ${failed} failed`,
      geocoded,
      failed,
      errors: errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error) {
    console.error('Batch geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode sites' },
      { status: 500 }
    );
  }
}


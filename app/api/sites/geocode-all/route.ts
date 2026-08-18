import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { geocodeAddress } from '@/lib/geocode';
import { isValidLatLng } from '@/lib/coordinates';

/**
 * Geocode sites that are missing coordinates, or all sites when regeocodeAll is true.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { regeocodeAll } = body;

    const client = await mongodb;
    const db = client.db('district79');

    const candidates = await db
      .collection('sites')
      .find({
        buildingAddress: { $exists: true, $ne: '' },
      })
      .toArray();

    const sitesToGeocode = regeocodeAll
      ? candidates
      : candidates.filter((site) => !isValidLatLng(site.latitude, site.longitude));

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

    for (const site of sitesToGeocode) {
      try {
        const result = await geocodeAddress(
          site.buildingAddress,
          site.borough,
          site.zipCode
        );

        if (isValidLatLng(result.latitude, result.longitude)) {
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
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Batch geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode sites' },
      { status: 500 }
    );
  }
}

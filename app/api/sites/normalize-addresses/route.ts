import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { normalizeNYCAddress } from '@/lib/address-normalize';

export async function POST(request: Request) {
  try {
    const { category, dryRun } = await request.json().catch(() => ({}));

    const client = await mongodb;
    const db = client.db('district79');

    // Build query - filter by category if provided
    const query: any = {};
    if (category && category !== 'all') {
      query.category = category;
    }

    // Only get sites with addresses
    query.buildingAddress = { $exists: true, $nin: [null, ''] };

    const sites = await db.collection('sites').find(query).toArray();

    const results: Array<{
      siteId: string;
      siteName: string;
      oldAddress: string;
      newAddress: string;
      changed: boolean;
    }> = [];

    let updatedCount = 0;

    for (const site of sites) {
      const oldAddress = site.buildingAddress || '';
      const newAddress = normalizeNYCAddress(oldAddress);

      const changed = oldAddress !== newAddress;

      results.push({
        siteId: site._id.toString(),
        siteName: site.siteName || 'Unknown',
        oldAddress,
        newAddress,
        changed,
      });

      // Update in database if not dry run and address changed
      if (!dryRun && changed) {
        await db.collection('sites').updateOne(
          { _id: site._id },
          { $set: { buildingAddress: newAddress } }
        );
        updatedCount++;
      }
    }

    const changedCount = results.filter(r => r.changed).length;

    return NextResponse.json({
      success: true,
      total: sites.length,
      changed: changedCount,
      updated: updatedCount,
      dryRun: dryRun || false,
      results: results.slice(0, 100), // Return first 100 results for preview
      message: dryRun
        ? `Found ${changedCount} addresses that would be normalized out of ${sites.length} total`
        : `Successfully normalized ${updatedCount} addresses out of ${sites.length} total`,
    });
  } catch (error) {
    console.error('Error normalizing addresses:', error);
    return NextResponse.json(
      { error: 'Failed to normalize addresses' },
      { status: 500 }
    );
  }
}


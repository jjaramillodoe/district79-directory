import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { buildTemplateDescription, descriptionFactsKey } from '@/lib/site-description';

export async function POST(request: Request) {
  try {
    const { count, siteIds } = await request.json();

    if (siteIds && Array.isArray(siteIds)) {
      if (siteIds.length < 1 || siteIds.length > 500) {
        return NextResponse.json(
          { error: 'Number of selected sites must be between 1 and 500' },
          { status: 400 }
        );
      }
    } else if (!count || count < 1 || count > 500) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 500' },
        { status: 400 }
      );
    }

    const client = await mongodb;
    const db = client.db('district79');

    let sites;
    if (siteIds && Array.isArray(siteIds) && siteIds.length > 0) {
      const objectIds: ObjectId[] = siteIds
        .map((id: string) => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter((id): id is ObjectId => id !== null);

      if (objectIds.length === 0) {
        return NextResponse.json({ error: 'No valid site IDs provided' }, { status: 400 });
      }

      sites = await db
        .collection('sites')
        .find({
          _id: { $in: objectIds },
          siteName: { $exists: true, $nin: [null, ''] },
          program: { $exists: true, $nin: [null, ''] },
        })
        .toArray();
    } else {
      sites = await db
        .collection('sites')
        .find({
          $or: [{ description: { $exists: false } }, { description: null }, { description: '' }],
          siteName: { $exists: true, $nin: [null, ''] },
          program: { $exists: true, $nin: [null, ''] },
        })
        .limit(count)
        .toArray();
    }

    const targets = sites.filter((site) => !(site.description || '').trim());

    if (targets.length === 0) {
      return NextResponse.json({
        message: 'No sites found without descriptions',
        generated: 0,
        total: 0,
        sites: [],
      });
    }

    const results = [];
    let successCount = 0;

    for (const site of targets) {
      const description = buildTemplateDescription(site);
      await db.collection('sites').updateOne(
        { _id: site._id },
        {
          $set: {
            description,
            descriptionSource: 'template',
            descriptionFactsKey: descriptionFactsKey(site),
          },
        }
      );
      successCount++;
      results.push({
        siteId: site._id.toString(),
        siteName: site.siteName,
        success: true,
        description: description.substring(0, 100) + '...',
        model: 'template',
      });
    }

    return NextResponse.json({
      message: `Filled ${successCount} out of ${targets.length} descriptions`,
      generated: successCount,
      total: targets.length,
      results,
    });
  } catch (error: any) {
    console.error('Error in bulk description generation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate descriptions' },
      { status: 500 }
    );
  }
}

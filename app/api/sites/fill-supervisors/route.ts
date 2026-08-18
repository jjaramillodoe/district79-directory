import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { supervisorsFromAssistantPrincipals } from '@/lib/staff';

function hasSupervisor(site: { siteSupervisor?: string | null; siteSupervisorPhone?: string | null }) {
  return Boolean((site.siteSupervisor || '').trim() || (site.siteSupervisorPhone || '').trim());
}

/**
 * Fill empty site supervisor fields from assistant principal names
 * and the site business phone.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const overwrite = body.overwrite === true;

    const client = await mongodb;
    const db = client.db('district79');
    const sites = await db.collection('sites').find({}).toArray();

    let updated = 0;
    let skippedHasSupervisor = 0;
    let skippedNoAp = 0;

    for (const site of sites) {
      const filled = supervisorsFromAssistantPrincipals(site.assistantPrincipal, site.businessPhone);
      if (!filled) {
        skippedNoAp++;
        continue;
      }
      if (!overwrite && hasSupervisor(site)) {
        skippedHasSupervisor++;
        continue;
      }

      await db.collection('sites').updateOne(
        { _id: site._id },
        {
          $set: {
            siteSupervisor: filled.names,
            siteSupervisorPhone: filled.phones,
          },
        }
      );
      updated++;
    }

    return NextResponse.json({
      success: true,
      updated,
      skippedHasSupervisor,
      skippedNoAp,
      message: `Filled supervisors on ${updated} site${updated === 1 ? '' : 's'}`,
    });
  } catch (error) {
    console.error('Error filling supervisors:', error);
    return NextResponse.json({ error: 'Failed to fill site supervisors' }, { status: 500 });
  }
}

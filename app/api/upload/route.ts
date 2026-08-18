import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { parse } from 'csv-parse/sync';
import { geocodeAddress } from '@/lib/geocode';
import { reconcileDescription } from '@/lib/site-description';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
    });

    const client = await mongodb;
    const db = client.db('district79');
    
    const category = file.name.includes('Adult Ed') ? 'adult-ed' : 'youth';

    const existingSites = await db.collection('sites').find({ category }).toArray();
    const preserved = new Map<string, any>();
    existingSites.forEach((site: any) => {
      const key = (site.siteName || '').trim().toLowerCase();
      if (key) preserved.set(key, site);
    });

    await db.collection('sites').deleteMany({ category });
    
    // Transform records (without geocoding first for speed)
    const sitesWithoutGeocode = records.map((record: any) => {
      const site: any = {
        dbn: record.DBN || '',
        program: record.Program || '',
        siteName: record['Site/School Name'] || '',
        status: record.Status || '',
        hsePrepCode: record['HSE Prep Code'] || '',
        lcgmsBuildingCode: record['LCGMS Building Code'] || record['Location Code'] || '',
        buildingCode: record['Building Code'] || record['Location Code'] || '',
        sedCode: record['SED Code'] || '',
        buildingOwnership: record['Building Ownership'] || '',
        buildingAddress: record['St Address'] || record.BuildingAddress || '',
        borough: record.Borough || '',
        zipCode: record['Zip Code'] || '',
        policePrecinct: record['Police Precinct'] || '',
        csd: record.CSD || '',
        businessPhone: record['Business Phone'] || '',
        assistantPrincipal: record['Assistant Principal'] || '',
        apEmail: record['AP Email'] || '',
        principal: record.Principal || '',
        principalEmail: record['Principal Email'] || '',
        siteSupervisor: record['Site Supervisor'] || record['Site Supervisors'] || record.Supervisor || '',
        siteSupervisorPhone: record['Site Supervisor Phone'] || record['Site Supervisors Phone'] || record['Supervisor Phone'] || '',
        newForSY: record['New for SY 25-26'] || '',
        daytimeDays: record['Daytime Days of Operation'] || record['Days of Operation'] || '',
        daytimeHours: record['Daytime Hours of Operation'] || record['Start Time'] ? `${record['Start Time']} - ${record['End Time']}` : '',
        eveningDays: record['Evening Days of Operation'] || '',
        eveningHours: record['Evening Hours of Operation'] || '',
        hasSaturdayProgram: record['Has Saturday Program'] || '',
        saturdayHours: record['Saturday Hours of Operation'] || '',
        subject: record.Subject || '',
        hostSchool: record['Host School'] || '',
        level: record.Level || '',
        hasPMProgram: record['Has PM Program'] || '',
        category,
        latitude: null,
        longitude: null,
      };

      const previous = preserved.get((site.siteName || '').trim().toLowerCase());
      if (previous?.latitude != null) site.latitude = previous.latitude;
      if (previous?.longitude != null) site.longitude = previous.longitude;
      Object.assign(site, reconcileDescription(previous, site));
      return site;
    });

    // Insert sites first (geocoding can be done later in background)
    const result = await db.collection('sites').insertMany(sitesWithoutGeocode);

    if (process.env.ENABLE_AUTO_GEOCODE === 'true') {
      void (async () => {
        const insertedIdsArray = Object.values(result.insertedIds);
        for (let index = 0; index < sitesWithoutGeocode.length; index++) {
          const site = sitesWithoutGeocode[index];
          if (!site.buildingAddress) continue;
          if (site.latitude != null && site.longitude != null) continue;
          const geoResult = await geocodeAddress(
            site.buildingAddress,
            site.borough,
            site.zipCode
          );
          if (geoResult.latitude != null && geoResult.longitude != null) {
            await db.collection('sites').updateOne(
              { _id: insertedIdsArray[index] },
              {
                $set: {
                  latitude: geoResult.latitude,
                  longitude: geoResult.longitude,
                },
              }
            );
          }
        }
      })().catch((err) => console.error('Background geocoding error:', err));
    }
    
    return NextResponse.json({ 
      success: true, 
      count: result.insertedCount,
      message: `Successfully imported ${result.insertedCount} sites`
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}


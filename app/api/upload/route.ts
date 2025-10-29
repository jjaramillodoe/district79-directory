import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { parse } from 'csv-parse/sync';
import { geocodeAddress } from '@/lib/geocode';

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
    
    // Clear existing data (or you might want to preserve and update)
    await db.collection('sites').deleteMany({ category: file.name.includes('Adult Ed') ? 'adult-ed' : 'youth' });
    
    // Transform records (without geocoding first for speed)
    const sitesWithoutGeocode = records.map((record: any) => ({
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
      category: file.name.includes('Adult Ed') ? 'adult-ed' : 'youth',
      latitude: null,
      longitude: null,
    }));

    // Insert sites first (geocoding can be done later in background)
    const result = await db.collection('sites').insertMany(sitesWithoutGeocode);

    // Optional: Geocode addresses in background (rate limited to 1 per second)
    // This is done asynchronously to not block the upload response
    // Note: For large CSV files, this could take a while
    if (process.env.ENABLE_AUTO_GEOCODE === 'true') {
      // Geocode in background without blocking response
      Promise.all(
        sitesWithoutGeocode.map(async (site, index) => {
          if (site.buildingAddress) {
            // Add delay based on index for rate limiting
            await new Promise(resolve => setTimeout(resolve, index * 1100));
            
            const geoResult = await geocodeAddress(
              site.buildingAddress,
              site.borough,
              site.zipCode
            );

            if (geoResult.latitude && geoResult.longitude) {
              await db.collection('sites').updateOne(
                { _id: result.insertedIds[Object.keys(result.insertedIds)[index]] },
                {
                  $set: {
                    latitude: geoResult.latitude,
                    longitude: geoResult.longitude,
                  },
                }
              );
            }
          }
        })
      ).catch(err => console.error('Background geocoding error:', err));
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


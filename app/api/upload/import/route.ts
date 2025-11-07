import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { parse } from 'csv-parse/sync';
import { geocodeAddress } from '@/lib/geocode';
import { normalizeNYCAddress } from '@/lib/address-normalize';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const removeMissing = formData.get('removeMissing') === 'true';
    
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
    
    // Determine category from filename
    const category = file.name.includes('Adult Ed') ? 'adult-ed' : 'youth';
    
    // Helper function to trim string values
    const trimValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      return String(value).trim();
    };

    // Transform CSV records to site format (trim all values)
    const csvSites = records.map((record: any) => ({
      dbn: trimValue(record.DBN),
      program: trimValue(record.Program),
      siteName: trimValue(record['Site/School Name']),
      status: trimValue(record.Status),
      hsePrepCode: trimValue(record['HSE Prep Code']),
      lcgmsBuildingCode: trimValue(record['LCGMS Building Code'] || record['Location Code']),
      buildingCode: trimValue(record['Building Code'] || record['Location Code']),
      sedCode: trimValue(record['SED Code']),
      buildingOwnership: trimValue(record['Building Ownership']),
      buildingAddress: normalizeNYCAddress(trimValue(record['St Address'] || record.BuildingAddress)),
      borough: trimValue(record.Borough),
      zipCode: trimValue(record['Zip Code']),
      policePrecinct: trimValue(record['Police Precinct']),
      csd: trimValue(record.CSD),
      businessPhone: trimValue(record['Business Phone']),
      assistantPrincipal: trimValue(record['Assistant Principal']),
      apEmail: trimValue(record['AP Email']),
      principal: trimValue(record.Principal),
      principalEmail: trimValue(record['Principal Email']),
      newForSY: trimValue(record['New for SY 25-26']),
      daytimeDays: trimValue(record['Daytime Days of Operation'] || record['Days of Operation']),
      daytimeHours: trimValue(record['Daytime Hours of Operation'] || (record['Start Time'] ? `${record['Start Time']} - ${record['End Time']}` : '')),
      eveningDays: trimValue(record['Evening Days of Operation']),
      eveningHours: trimValue(record['Evening Hours of Operation']),
      hasSaturdayProgram: trimValue(record['Has Saturday Program']),
      saturdayHours: trimValue(record['Saturday Hours of Operation']),
      subject: trimValue(record.Subject),
      hostSchool: trimValue(record['Host School']),
      level: trimValue(record.Level),
      hasPMProgram: trimValue(record['Has PM Program']),
      category,
    }));

    // Get existing sites for this category
    const existingSites = await db.collection('sites').find({ category }).toArray();
    
    // Create a map of existing sites by siteName
    const existingSitesMap = new Map<string, any>();
    existingSites.forEach((site: any) => {
      const siteName = (site.siteName || '').trim().toLowerCase();
      if (siteName) {
        existingSitesMap.set(siteName, site);
      }
    });

    // Perform upserts
    let insertedCount = 0;
    let updatedCount = 0;
    const insertedIds: string[] = [];

    for (const csvSite of csvSites) {
      const siteNameKey = (csvSite.siteName || '').trim().toLowerCase();
      
      if (!siteNameKey) {
        continue; // Skip sites without a name
      }

      const existingSite = existingSitesMap.get(siteNameKey);
      
      if (existingSite) {
        // Update existing site, but exclude protected fields
        // Protected fields: latitude, longitude, description (managed separately)
        const protectedFields = ['latitude', 'longitude', 'description'];
        
        // Create update data excluding protected fields
        const updateData: any = {};
        Object.keys(csvSite).forEach(key => {
          if (!protectedFields.includes(key)) {
            updateData[key] = csvSite[key];
          }
        });
        
        // Preserve protected fields from existing site
        if (existingSite.latitude != null) {
          updateData.latitude = existingSite.latitude;
        }
        if (existingSite.longitude != null) {
          updateData.longitude = existingSite.longitude;
        }
        if (existingSite.description != null) {
          updateData.description = existingSite.description;
        }
        
        await db.collection('sites').updateOne(
          { _id: existingSite._id },
          { $set: updateData }
        );
        updatedCount++;
      } else {
        // Insert new site (exclude protected fields - they'll be set separately if needed)
        const newSiteData: any = { ...csvSite };
        // Don't set protected fields for new sites
        delete newSiteData.latitude;
        delete newSiteData.longitude;
        delete newSiteData.description;
        
        const result = await db.collection('sites').insertOne(newSiteData);
        insertedCount++;
        insertedIds.push(result.insertedId.toString());
      }
    }

    // Optionally remove sites that are not in the CSV
    let removedCount = 0;
    if (removeMissing) {
      const csvSiteNames = csvSites
        .map((s: any) => (s.siteName || '').trim().toLowerCase())
        .filter((name: string) => name);
      
      // Get all existing site names for this category
      const allExistingSites = await db.collection('sites')
        .find({ category }, { projection: { siteName: 1 } })
        .toArray();
      
      // Find sites to delete (not in CSV)
      const sitesToDelete = allExistingSites
        .filter((site: any) => {
          const siteNameKey = (site.siteName || '').trim().toLowerCase();
          return siteNameKey && !csvSiteNames.includes(siteNameKey);
        })
        .map((site: any) => site._id);
      
      if (sitesToDelete.length > 0) {
        const deleteResult = await db.collection('sites').deleteMany({
          _id: { $in: sitesToDelete }
        });
        removedCount = deleteResult.deletedCount || 0;
      }
    }

    // Optional: Geocode new sites in background (rate limited)
    if (process.env.ENABLE_AUTO_GEOCODE === 'true' && insertedIds.length > 0) {
      // Create a map of new sites by their index in insertedIds
      const newSites = csvSites.filter((s: any) => {
        const siteNameKey = (s.siteName || '').trim().toLowerCase();
        return siteNameKey && !existingSitesMap.has(siteNameKey);
      });
      
      Promise.all(
        newSites.map(async (site: any, index: number) => {
          if (site.buildingAddress) {
            await new Promise(resolve => setTimeout(resolve, index * 1100));
            
            const geoResult = await geocodeAddress(
              site.buildingAddress,
              site.borough,
              site.zipCode
            );

            if (geoResult.latitude && geoResult.longitude && index < insertedIds.length) {
              const { ObjectId } = await import('mongodb');
              await db.collection('sites').updateOne(
                { _id: new ObjectId(insertedIds[index]) },
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
      inserted: insertedCount,
      updated: updatedCount,
      removed: removedCount,
      total: insertedCount + updatedCount,
      message: `Successfully imported ${insertedCount} new sites and updated ${updatedCount} existing sites${removedCount > 0 ? `, removed ${removedCount} sites` : ''}`
    });
  } catch (error) {
    console.error('Error importing file:', error);
    return NextResponse.json(
      { error: 'Failed to import file' },
      { status: 500 }
    );
  }
}


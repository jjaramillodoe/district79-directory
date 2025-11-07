import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { parse } from 'csv-parse/sync';
import { normalizeNYCAddress } from '@/lib/address-normalize';

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

    // Get existing sites from database for this category
    const existingSites = await db.collection('sites').find({ category }).toArray();
    
    // Create a map of existing sites by siteName for quick lookup
    const existingSitesMap = new Map<string, any>();
    existingSites.forEach((site: any) => {
      const siteName = (site.siteName || '').trim().toLowerCase();
      if (siteName) {
        existingSitesMap.set(siteName, site);
      }
    });

    // Compare CSV sites with existing sites
    // Fields that should NOT be updated from CSV (managed separately)
    const protectedFields = ['latitude', 'longitude', 'description'];
    
    // Fields to compare (exclude protected fields)
    const fieldsToCompare = [
      'dbn', 'program', 'status', 'buildingAddress', 'borough', 'zipCode',
      'businessPhone', 'assistantPrincipal', 'apEmail', 'principal', 'principalEmail',
      'daytimeDays', 'daytimeHours', 'eveningDays', 'eveningHours',
      'saturdayHours', 'subject', 'hostSchool', 'hsePrepCode', 'lcgmsBuildingCode',
      'buildingCode', 'sedCode', 'buildingOwnership', 'policePrecinct', 'csd',
      'newForSY', 'hasSaturdayProgram', 'level', 'hasPMProgram'
    ];

    const toUpdate: Array<{ 
      csvSite: any; 
      existingSite: any; 
      changes: Array<{ field: string; oldValue: string; newValue: string }> 
    }> = [];
    const toInsert: any[] = [];
    const unchanged: Array<{ csvSite: any; existingSite: any }> = [];

    csvSites.forEach((csvSite: any) => {
      const siteNameKey = (csvSite.siteName || '').trim().toLowerCase();
      
      if (!siteNameKey) {
        // Skip sites without a name
        return;
      }

      const existingSite = existingSitesMap.get(siteNameKey);
      
      if (existingSite) {
        // Site exists - check for changes
        const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];

        fieldsToCompare.forEach(field => {
          const csvValue = String(csvSite[field] || '').trim();
          const existingValue = String(existingSite[field] || '').trim();
          
          if (csvValue !== existingValue) {
            changes.push({
              field,
              oldValue: existingValue || '(empty)',
              newValue: csvValue || '(empty)'
            });
          }
        });

        if (changes.length > 0) {
          toUpdate.push({ csvSite, existingSite, changes });
        } else {
          unchanged.push({ csvSite, existingSite });
        }
      } else {
        // New site
        toInsert.push(csvSite);
      }
    });

    // Find sites in database that are not in CSV (might be removed)
    const csvSiteNames = new Set(
      csvSites
        .map((s: any) => (s.siteName || '').trim().toLowerCase())
        .filter((name: string) => name)
    );
    
    const toRemove = existingSites.filter((site: any) => {
      const siteNameKey = (site.siteName || '').trim().toLowerCase();
      return siteNameKey && !csvSiteNames.has(siteNameKey);
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalInCsv: csvSites.length,
        toInsert: toInsert.length,
        toUpdate: toUpdate.length,
        unchanged: unchanged.length,
        toRemove: toRemove.length,
      },
      preview: {
        toInsert: toInsert, // Show all
        toUpdate: toUpdate, // Show all
        unchanged: unchanged, // Show all
        toRemove: toRemove, // Show all
      },
      category,
      filename: file.name,
    });
  } catch (error) {
    console.error('Error previewing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file preview' },
      { status: 500 }
    );
  }
}


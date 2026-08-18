import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const { siteId, siteName, businessPhone, daytimeDays, daytimeHours, eveningDays, eveningHours, saturdayHours, siteSupervisor, siteSupervisorPhone, contactName, contactEmail, contactPhone, notes } = data;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const client = await mongodb;
    const db = client.db('district79');

    // Store the change request
    const changeRequest = {
      siteId,
      siteName,
      businessPhone: businessPhone || null,
      daytimeDays: daytimeDays || null,
      daytimeHours: daytimeHours || null,
      eveningDays: eveningDays || null,
      eveningHours: eveningHours || null,
      saturdayHours: saturdayHours || null,
      siteSupervisor: typeof siteSupervisor === 'string' ? siteSupervisor : null,
      siteSupervisorPhone: typeof siteSupervisorPhone === 'string' ? siteSupervisorPhone : null,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      notes: notes || null,
      status: 'pending',
      submittedAt: new Date(),
    };

    const result = await db.collection('changeRequests').insertOne(changeRequest);

    return NextResponse.json({ 
      success: true, 
      message: 'Change request submitted successfully',
      id: result.insertedId 
    });
  } catch (error) {
    console.error('Error submitting change request:', error);
    return NextResponse.json({ error: 'Failed to submit change request' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await mongodb;
    const db = client.db('district79');
    
    const changeRequests = await db.collection('changeRequests')
      .find({})
      .sort({ submittedAt: -1 })
      .toArray();
    
    return NextResponse.json(changeRequests);
  } catch (error) {
    console.error('Error fetching change requests:', error);
    return NextResponse.json({ error: 'Failed to fetch change requests' }, { status: 500 });
  }
}


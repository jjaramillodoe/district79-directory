import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, adminNotes } = await request.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    const client = await mongodb;
    const db = client.db('district79');

    // Get the change request
    const changeRequest = await db.collection('changeRequests').findOne({ _id: new ObjectId(id) });

    if (!changeRequest) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 });
    }

    // Update the change request status
    const updateData: any = {
      status,
      reviewedAt: new Date(),
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await db.collection('changeRequests').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // If approved, apply the changes to the site
    if (status === 'approved') {
      const siteUpdates: any = {};

      if (changeRequest.businessPhone) {
        siteUpdates.businessPhone = changeRequest.businessPhone;
      }
      if (changeRequest.daytimeDays) {
        siteUpdates.daytimeDays = changeRequest.daytimeDays;
      }
      if (changeRequest.daytimeHours) {
        siteUpdates.daytimeHours = changeRequest.daytimeHours;
      }
      if (changeRequest.eveningDays) {
        siteUpdates.eveningDays = changeRequest.eveningDays;
      }
      if (changeRequest.eveningHours) {
        siteUpdates.eveningHours = changeRequest.eveningHours;
      }
      if (changeRequest.saturdayHours) {
        siteUpdates.saturdayHours = changeRequest.saturdayHours;
      }
      if (typeof changeRequest.siteSupervisor === 'string') {
        siteUpdates.siteSupervisor = changeRequest.siteSupervisor;
      }
      if (typeof changeRequest.siteSupervisorPhone === 'string') {
        siteUpdates.siteSupervisorPhone = changeRequest.siteSupervisorPhone;
      }

      // Update the site with approved changes
      if (Object.keys(siteUpdates).length > 0) {
        await db.collection('sites').updateOne(
          { _id: new ObjectId(changeRequest.siteId) },
          { $set: siteUpdates }
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Change request ${status}`,
      applied: status === 'approved' 
    });
  } catch (error) {
    console.error('Error updating change request:', error);
    return NextResponse.json({ error: 'Failed to update change request' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await mongodb;
    const db = client.db('district79');
    
    const changeRequest = await db.collection('changeRequests').findOne({ _id: new ObjectId(id) });
    
    if (!changeRequest) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 });
    }
    
    return NextResponse.json(changeRequest);
  } catch (error) {
    console.error('Error fetching change request:', error);
    return NextResponse.json({ error: 'Failed to fetch change request' }, { status: 500 });
  }
}


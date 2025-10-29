import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await mongodb;
    const db = client.db('district79');
    
    const site = await db.collection('sites').findOne({ _id: new ObjectId(id) });
    
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }
    
    return NextResponse.json(site);
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json({ error: 'Failed to fetch site' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const updates = await request.json();
    const { id } = await params;
    const client = await mongodb;
    const db = client.db('district79');
    
    // Exclude _id from updates to prevent modifying immutable field
    const { _id, ...updateFields } = updates;
    
    await db.collection('sites').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await mongodb;
    const db = client.db('district79');
    
    await db.collection('sites').deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
  }
}


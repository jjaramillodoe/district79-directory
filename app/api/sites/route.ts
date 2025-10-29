import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await mongodb;
    const db = client.db('district79');
    const sites = await db.collection('sites').find({}).toArray();
    
    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const site = await request.json();
    const client = await mongodb;
    const db = client.db('district79');
    
    await db.collection('sites').insertOne(site);
    
    return NextResponse.json({ success: true, id: site._id });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}


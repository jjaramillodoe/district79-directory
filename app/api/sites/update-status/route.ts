import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';

/**
 * API endpoint to bulk update status for sites
 * Currently supports setting all youth programs to "Open"
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { category, status } = body;

    if (!category || !status) {
      return NextResponse.json(
        { error: 'Category and status are required' },
        { status: 400 }
      );
    }

    const client = await mongodb;
    const db = client.db('district79');
    
    // Bulk update all sites matching the category
    const result = await db.collection('sites').updateMany(
      { category },
      { $set: { status } }
    );

    return NextResponse.json({
      success: true,
      message: `Updated status to "${status}" for ${result.modifiedCount} ${category} sites`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    });
  } catch (error) {
    console.error('Error updating site status:', error);
    return NextResponse.json(
      { error: 'Failed to update site status' },
      { status: 500 }
    );
  }
}


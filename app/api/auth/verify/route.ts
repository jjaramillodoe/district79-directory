import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Verify admin authentication
 * Only accepts admin_token cookie (not user_token)
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    const jwtSecret = process.env.JWT_SECRET;

    if (!token || !jwtSecret) {
      return NextResponse.json({ authenticated: false });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Verify this is an admin token (not a public user token)
    if (!decoded.admin) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}


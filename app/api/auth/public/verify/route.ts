import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Verify public user authentication (Google OAuth)
 * Separate from admin authentication
 * Returns 200 with authenticated: false when not authenticated (this is expected, not an error)
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;
    const jwtSecret = process.env.JWT_SECRET;

    console.log('🔍 Public verify check:');
    console.log('   - user_token cookie exists:', !!token);
    console.log('   - JWT_SECRET exists:', !!jwtSecret);

    if (!token || !jwtSecret) {
      // Not authenticated - return 200 with authenticated: false (expected state)
      console.log('   - Result: Not authenticated (no token or secret)');
      return NextResponse.json({ authenticated: false });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    console.log('   - Token decoded successfully');
    console.log('   - Decoded admin flag:', decoded.admin);
    console.log('   - Decoded email:', decoded.email);
    
    // Check if this is a public user token (not admin)
    if (decoded.admin) {
      // Admin token, not public user token
      console.log('   - Result: Not authenticated (admin token, not public)');
      return NextResponse.json({ authenticated: false });
    }

    console.log('   - Result: Authenticated as public user');
    return NextResponse.json({ 
      authenticated: true,
      user: {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      }
    });
  } catch (error) {
    // Token verification failed - return 200 with authenticated: false (expected state)
    console.log('   - Result: Not authenticated (token verification failed):', error);
    return NextResponse.json({ authenticated: false });
  }
}


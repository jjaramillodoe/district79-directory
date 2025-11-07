import { NextResponse } from 'next/server';

/**
 * GET /api/auth/public/google
 * Initiates Google OAuth flow for public users (homepage)
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  // Always use the public callback route (not the admin one)
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/public/google/callback`;
  const allowedDomains = process.env.GOOGLE_ALLOWED_DOMAINS?.split(',') || ['schools.nyc.gov'];

  console.log('🔍 Public Google OAuth initiation:');
  console.log('   - Redirect URI:', redirectUri);
  console.log('   - Client ID exists:', !!clientId);

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth not configured' },
      { status: 500 }
    );
  }

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    hd: allowedDomains[0], // Hint for domain (workspace domain)
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  console.log('   - Redirecting to Google OAuth');
  return NextResponse.redirect(authUrl);
}


import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

/**
 * GET /api/auth/public/google/callback
 * Handles the OAuth callback from Google for public users
 */
export async function GET(request: Request) {
  try {
    console.log('🔍 Public OAuth callback received');
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('   - Code:', code ? 'present' : 'missing');
    console.log('   - Error param:', error);

    if (error) {
      console.error('❌ OAuth error from Google:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=no_code`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/public/google/callback`;
    const allowedDomains = process.env.GOOGLE_ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || ['schools.nyc.gov'];
    const jwtSecret = process.env.JWT_SECRET;

    console.log('   - Client ID exists:', !!clientId);
    console.log('   - Client Secret exists:', !!clientSecret);
    console.log('   - JWT Secret exists:', !!jwtSecret);
    console.log('   - Redirect URI:', redirectUri);
    console.log('   - Allowed domains:', allowedDomains);

    if (!clientId || !clientSecret || !jwtSecret) {
      console.error('❌ Missing required environment variables');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=not_configured`
      );
    }

    // Exchange code for tokens
    console.log('   - Exchanging code for tokens...');
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    
    let tokens;
    try {
      const tokenResponse = await oauth2Client.getToken(code);
      tokens = tokenResponse.tokens;
      console.log('   - Tokens received');
    } catch (tokenError) {
      console.error('❌ Error exchanging code for tokens:', tokenError);
      throw tokenError;
    }
    
    oauth2Client.setCredentials(tokens);

    // Get user info
    console.log('   - Verifying ID token...');
    let ticket;
    try {
      ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: clientId,
      });
      console.log('   - ID token verified');
    } catch (verifyError) {
      console.error('❌ Error verifying ID token:', verifyError);
      throw verifyError;
    }

    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      console.error('❌ No email in payload');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=no_email`
      );
    }

    console.log('   - User email:', payload.email);

    // Check if email domain is allowed
    const emailDomain = payload.email.split('@')[1];
    const isAllowedDomain = allowedDomains.some(domain => 
      emailDomain === domain || emailDomain.endsWith(`.${domain}`)
    );

    console.log('   - Email domain:', emailDomain);
    console.log('   - Is allowed domain:', isAllowedDomain);

    if (!isAllowedDomain) {
      console.error('❌ Email domain not allowed:', emailDomain);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=unauthorized_domain`
      );
    }

    // Generate JWT token for public user (not admin)
    const token = jwt.sign(
      { 
        admin: false, // Public user, not admin
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Redirect to /home with token in cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/home`
    );

    // Set HTTP-only cookie for public user
    // Important: Set path to '/' so it's accessible from all routes
    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/', // Explicitly set path to root
      maxAge: 86400, // 24 hours
    });

    console.log('✅ Public OAuth callback: Set user_token cookie, redirecting to /home');
    console.log('   - Token generated for:', payload.email);
    console.log('   - Admin flag:', false);

    return response;
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=auth_failed`
    );
  }
}


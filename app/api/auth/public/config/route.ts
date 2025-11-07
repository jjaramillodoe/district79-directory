import { NextResponse } from 'next/server';

/**
 * GET /api/auth/public/config
 * Returns whether Google OAuth is configured (without exposing secrets)
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const googleEnabledEnv = process.env.NEXT_PUBLIC_GOOGLE_ENABLED;
  
  const googleEnabled = googleEnabledEnv === 'true' || googleEnabledEnv === '1';
  const isConfigured = !!(clientId && googleEnabled);
  
  return NextResponse.json({
    googleEnabled: isConfigured,
    hasClientId: !!clientId,
    googleEnabledEnv: googleEnabledEnv,
    debug: {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      googleEnabledEnv: googleEnabledEnv,
      googleEnabledEnvType: typeof googleEnabledEnv,
      googleEnabled: googleEnabled,
    }
  });
}


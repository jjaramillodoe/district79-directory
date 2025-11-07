import { NextResponse } from 'next/server';

/**
 * GET /api/auth/public/config
 * Returns whether Google OAuth is configured (without exposing secrets)
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const googleEnabledEnv = process.env.NEXT_PUBLIC_GOOGLE_ENABLED;
  
  // Log the values (without exposing secrets)
  console.log('🔍 Google OAuth Config Check:');
  console.log('  - GOOGLE_CLIENT_ID exists:', !!clientId);
  console.log('  - GOOGLE_CLIENT_ID length:', clientId?.length || 0);
  console.log('  - NEXT_PUBLIC_GOOGLE_ENABLED:', googleEnabledEnv);
  console.log('  - NEXT_PUBLIC_GOOGLE_ENABLED type:', typeof googleEnabledEnv);
  console.log('  - NEXT_PUBLIC_GOOGLE_ENABLED === "true":', googleEnabledEnv === 'true');
  console.log('  - NEXT_PUBLIC_GOOGLE_ENABLED === "1":', googleEnabledEnv === '1');
  
  const googleEnabled = googleEnabledEnv === 'true' || googleEnabledEnv === '1';
  const isConfigured = !!(clientId && googleEnabled);
  
  console.log('  - Final googleEnabled:', googleEnabled);
  console.log('  - Final isConfigured:', isConfigured);
  
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


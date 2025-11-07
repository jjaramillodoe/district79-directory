import { NextResponse } from 'next/server';

/**
 * POST /api/auth/public/logout
 * Logs out public user by clearing the user_token cookie
 * Redirects to /home (login page)
 */
export async function POST() {
  // Redirect to /home (login page) after logout
  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/home`
  );
  
  // Clear the user token cookie
  response.cookies.set('user_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  return response;
}


'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import PublicGoogleLoginButton from '@/components/auth/PublicGoogleLoginButton';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string>('');
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    checkAuth();
    checkGoogleConfig();

    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setAuthError(
        errorParam === 'unauthorized_domain'
          ? 'Your email domain is not authorized. Please use your NYC DOE email address.'
          : errorParam === 'auth_failed'
          ? 'Authentication failed. Please try again.'
          : errorParam === 'not_configured'
          ? 'Google authentication is not configured.'
          : 'Authentication error occurred.'
      );
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkGoogleConfig = async () => {
    try {
      const response = await fetch('/api/auth/public/config');
      if (response.ok) {
        const data = await response.json();
        setGoogleEnabled(data.googleEnabled || false);
      } else {
        setGoogleEnabled(false);
      }
    } catch {
      setGoogleEnabled(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/public/verify');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          router.push('/home');
          return;
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-d79-blue" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,63,135,0.08),transparent_55%)]" />
      <div className="page-shell relative flex min-h-[calc(100vh-160px)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
          <div className="mb-8 text-center">
            <div className="mb-5 flex items-center justify-center gap-4">
              <img src="/images/d79logo.png" alt="District 79" className="h-14 object-contain" />
              <img src="/images/nycpublicshools.png" alt="NYC Public Schools" className="h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-d79-navy">
              District 79 Directory
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in with your NYC DOE Google account to browse Adult Education and Youth Program sites.
            </p>
          </div>

          {authError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {authError}
            </div>
          )}

          {googleEnabled ? (
            <PublicGoogleLoginButton />
          ) : (
            <div className="rounded-lg bg-slate-50 px-4 py-5 text-center text-sm text-slate-600">
              <p>Google authentication is not configured.</p>
              <p className="mt-2">Please contact your administrator.</p>
            </div>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Access is limited to District 79 staff with an{' '}
            <span className="font-medium text-slate-700">@schools.nyc.gov</span> email address.
          </p>
        </div>
      </div>
    </div>
  );
}

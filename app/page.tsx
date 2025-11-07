'use client';

import { useState, useEffect } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import PublicGoogleLoginButton from '@/components/auth/PublicGoogleLoginButton';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string>('');
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    checkAuth();
    checkGoogleConfig();
    
    // Check for OAuth error in URL
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
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkGoogleConfig = async () => {
    try {
      console.log('🔍 Checking Google OAuth config...');
      const response = await fetch('/api/auth/public/config');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Config API Response:', data);
        console.log('✅ Setting googleEnabled to:', data.googleEnabled);
        setGoogleEnabled(data.googleEnabled || false);
      } else {
        console.error('❌ Config API failed with status:', response.status);
        setGoogleEnabled(false);
      }
    } catch (error) {
      console.error('❌ Error checking Google config:', error);
      setGoogleEnabled(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/public/verify');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          // Redirect to /home if authenticated
          router.push('/home');
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">District 79 Directory</h2>
          <p className="text-gray-600 mt-2">NYC Public Schools</p>
          <p className="text-sm text-gray-500 mt-4">Sign in to access the directory</p>
        </div>

        {authError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {authError}
          </div>
        )}

        {googleEnabled ? (
          <PublicGoogleLoginButton />
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">Google authentication is not configured.</p>
            <p className="text-sm text-gray-500 mt-2">Please contact your administrator.</p>
            <p className="text-sm text-gray-500 mt-2">Only District 79 Staff with @schools.nyc.gov email addresses can access the directory.</p>
          </div>
        )}
      </div>
    </div>
  );
}

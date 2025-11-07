'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/components/admin/LoginForm';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    // Check for OAuth error in URL
    const errorParam = searchParams.get('error');
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
    }
  }, [searchParams]);

  const handleLogin = async (password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin');
      } else {
        setAuthError(data.error || 'Invalid password');
      }
    } catch (error) {
      setAuthError('Login failed. Please try again.');
      console.error('Login error:', error);
    }
  };

  return <LoginForm onLogin={handleLogin} error={authError} />;
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}


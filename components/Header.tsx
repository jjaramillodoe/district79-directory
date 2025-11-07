'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import PublicGoogleLoginButton from '@/components/auth/PublicGoogleLoginButton';
import { User, LogOut } from 'lucide-react';

interface UserInfo {
  email: string;
  name: string;
  picture?: string;
}

export default function Header() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/public/verify', {
        credentials: 'include', // Important: include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check Google config for header
  useEffect(() => {
    const checkGoogleConfig = async () => {
      try {
        const response = await fetch('/api/auth/public/config');
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Header - Config API Response:', data);
        }
      } catch (error) {
        console.error('Header - Error checking Google config:', error);
      }
    };
    checkGoogleConfig();
  }, []);

  const handleLogout = async () => {
    try {
      // Call the logout API to clear the cookie
      const response = await fetch('/api/auth/public/logout', {
        method: 'POST',
        credentials: 'include', // Important: include cookies
      });
      
      // Clear local state
      setUser(null);
      
      // Redirect to home page
      window.location.href = '/home';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear state and redirect to home on error
      setUser(null);
      window.location.href = '/home';
    }
  };

  const [googleEnabledHeader, setGoogleEnabledHeader] = useState(false);

  // Check Google config for header
  useEffect(() => {
    const checkGoogleConfig = async () => {
      try {
        console.log('🔍 Header - Checking Google OAuth config...');
        const response = await fetch('/api/auth/public/config');
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Header - Config API Response:', data);
          console.log('✅ Header - Setting googleEnabled to:', data.googleEnabled);
          setGoogleEnabledHeader(data.googleEnabled || false);
        } else {
          console.error('❌ Header - Config API failed with status:', response.status);
          setGoogleEnabledHeader(false);
        }
      } catch (error) {
        console.error('❌ Header - Error checking Google config:', error);
        setGoogleEnabledHeader(false);
      }
    };
    checkGoogleConfig();
  }, []);

  const googleEnabled = googleEnabledHeader;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/home">
              <img 
                src="/images/d79logo.png" 
                alt="District 79" 
                className="h-16 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <div>
              <Link href="/home">
                <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">District 79 Directory</h1>
              </Link>
              <p className="text-sm text-gray-600">Adult Education & Youth Programs</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4">
              <Link 
                href="/home" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Directory
              </Link>
              <Link 
                href="/map" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Map
              </Link>
              <Link 
                href="/analytics" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Analytics
              </Link>
            </nav>
            
            {/* User Authentication Section */}
            {!loading && (
              <div className="flex items-center gap-4">
                {user ? (
                  <div className="flex items-center gap-3">
                    {user.picture ? (
                      <img 
                        src={user.picture} 
                        alt={user.name || 'User'} 
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{user.name || 'User'}</div>
                      <div className="text-gray-500 text-xs">{user.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  googleEnabled && <PublicGoogleLoginButton variant="compact" />
                )}
              </div>
            )}
            
            <img 
              src="/images/nycpublicshools.png" 
              alt="NYC Public Schools" 
              className="h-16 object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
}


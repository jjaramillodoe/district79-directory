'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Menu, User, X } from 'lucide-react';
import PublicGoogleLoginButton from '@/components/auth/PublicGoogleLoginButton';

interface UserInfo {
  email: string;
  name: string;
  picture?: string;
}

const NAV = [
  { href: '/home', label: 'Directory' },
  { href: '/map', label: 'Map' },
  { href: '/analytics', label: 'Analytics' },
];

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoginPage = pathname === '/' || pathname === '/auth';

  useEffect(() => {
    const load = async () => {
      try {
        const [authRes, configRes] = await Promise.all([
          fetch('/api/auth/public/verify', { credentials: 'include' }),
          fetch('/api/auth/public/config'),
        ]);

        if (authRes.ok) {
          const data = await authRes.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }

        if (configRes.ok) {
          const data = await configRes.json();
          setGoogleEnabled(data.googleEnabled || false);
        }
      } catch (error) {
        console.error('Header auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/public/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      window.location.href = '/';
    }
  };

  const isActive = (href: string) =>
    pathname === href || (href === '/home' && pathname?.startsWith('/site/'));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="page-shell">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <Link href={user ? '/home' : '/'} className="flex min-w-0 items-center gap-3">
            <img
              src="/images/d79logo.png"
              alt="District 79"
              className="h-11 w-auto object-contain"
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight text-d79-navy">
                District 79 Directory
              </p>
              <p className="hidden truncate text-xs text-slate-500 sm:block">
                Adult Education & Youth Programs
              </p>
            </div>
          </Link>

          {!isLoginPage && (
            <nav className="hidden items-center gap-1 lg:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-d79-sky text-d79-navy'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-d79-navy'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <Link
                  href="/admin"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith('/admin')
                      ? 'bg-d79-sky text-d79-navy'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-d79-navy'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {!loading && !isLoginPage && (
              <>
                {user ? (
                  <div className="hidden items-center gap-2 sm:flex">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name || 'User'}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-d79-navy">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="hidden max-w-[160px] xl:block">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {user.name || 'User'}
                      </div>
                      <div className="truncate text-xs text-slate-500">{user.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      title="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  googleEnabled && (
                    <div className="hidden sm:block">
                      <PublicGoogleLoginButton variant="compact" />
                    </div>
                  )
                )}
              </>
            )}

            <img
              src="/images/nycpublicshools.png"
              alt="NYC Public Schools"
              className="hidden h-10 w-auto object-contain md:block"
            />

            {!isLoginPage && (
              <button
                className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {menuOpen && !isLoginPage && (
          <div className="border-t border-slate-100 py-3 lg:hidden">
            <nav className="flex flex-col gap-1 pb-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive(item.href) ? 'bg-d79-sky text-d79-navy' : 'text-slate-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <Link
                  href="/admin"
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    pathname?.startsWith('/admin') ? 'bg-d79-sky text-d79-navy' : 'text-slate-700'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>
            {user ? (
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name || 'User'}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Sign out
                </button>
              </div>
            ) : (
              googleEnabled && <PublicGoogleLoginButton variant="compact" />
            )}
          </div>
        )}
      </div>
    </header>
  );
}

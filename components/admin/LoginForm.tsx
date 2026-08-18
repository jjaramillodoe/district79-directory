'use client';

import { useState, FormEvent } from 'react';
import { Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

interface LoginFormProps {
  onLogin: (password: string) => Promise<void>;
  error?: string;
  password?: string;
  setPassword?: (password: string) => void;
}

export default function LoginForm({
  onLogin,
  error,
  password: externalPassword,
  setPassword: externalSetPassword,
}: LoginFormProps) {
  const [password, setPasswordInternal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentPassword = externalPassword !== undefined ? externalPassword : password;
  const setPassword = externalSetPassword || setPasswordInternal;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onLogin(currentPassword);
    setIsLoading(false);
  };

  return (
    <div className="relative overflow-hidden bg-slate-50">
      <div className="page-shell relative flex min-h-[calc(100vh-160px)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
          <div className="mb-8 text-center">
            <div className="mb-5 flex items-center justify-center gap-4">
              <img src="/images/d79logo.png" alt="District 79" className="h-14 object-contain" />
              <img src="/images/nycpublicshools.png" alt="NYC Public Schools" className="h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-d79-navy">Admin access</h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter the admin password to manage sites, imports, and change requests.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Admin password
              </label>
              <input
                type="password"
                id="password"
                value={currentPassword}
                onChange={(e) => setPassword(e.target.value)}
                className="select-field"
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-d79-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-d79-blue disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/home" className="hover:text-d79-blue">
              Back to directory
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

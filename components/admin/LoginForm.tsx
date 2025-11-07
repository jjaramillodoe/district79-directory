'use client';

import { useState, FormEvent } from 'react';
import { Lock, Building2 } from 'lucide-react';

interface LoginFormProps {
  onLogin: (password: string) => Promise<void>;
  error?: string;
  password?: string;
  setPassword?: (password: string) => void;
}

export default function LoginForm({ onLogin, error, password: externalPassword, setPassword: externalSetPassword }: LoginFormProps) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">District 79 Directory</h2>
          <p className="text-gray-600 mt-2">NYC Department of Education</p>
          <p className="text-sm text-gray-500 mt-4">Admin Access</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              id="password"
              value={currentPassword}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Logging in...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Login
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-blue-600">
            ← Back to Directory
          </a>
        </div>
      </div>
    </div>
  );
}


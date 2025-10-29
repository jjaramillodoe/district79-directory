'use client';

import { ArrowLeft, AlertCircle, LogOut } from 'lucide-react';
import Link from 'next/link';

interface AdminHeaderProps {
  pendingRequestsCount: number;
  onToggleChangeRequests: () => void;
  onLogout: () => void;
}

export default function AdminHeader({ pendingRequestsCount, onToggleChangeRequests, onLogout }: AdminHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">Manage District 79 sites</p>
      </div>
      <div className="flex items-center gap-4">
        <Link 
          href="/" 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>
        <button
          onClick={onToggleChangeRequests}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2 relative"
        >
          <AlertCircle className="h-5 w-5" />
          Change Requests
          {pendingRequestsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {pendingRequestsCount}
            </span>
          )}
        </button>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}


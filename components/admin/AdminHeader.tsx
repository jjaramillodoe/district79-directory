'use client';

import { AlertCircle, LogOut } from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  pendingRequestsCount?: number;
  showChangeRequests?: boolean;
  onToggleChangeRequests?: () => void;
  onLogout: () => void;
}

export default function AdminHeader({
  title = 'Admin',
  subtitle = 'Manage District 79 sites, imports, and change requests',
  pendingRequestsCount = 0,
  showChangeRequests = false,
  onToggleChangeRequests,
  onLogout,
}: AdminHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-d79-navy">{title}</h1>
        <p className="mt-1 text-slate-600">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onToggleChangeRequests && (
          <button
            onClick={onToggleChangeRequests}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              showChangeRequests
                ? 'bg-d79-navy text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            Change requests
            {pendingRequestsCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Admin sign out
        </button>
      </div>
    </div>
  );
}

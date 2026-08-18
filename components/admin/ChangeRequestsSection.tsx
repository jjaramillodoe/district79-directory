'use client';

import { CheckCircle, XCircle } from 'lucide-react';

interface Site {
  _id: string;
  [key: string]: any;
}

interface ChangeRequest {
  _id: string;
  siteId: string;
  siteName: string;
  submittedAt: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  businessPhone?: string;
  daytimeDays?: string;
  daytimeHours?: string;
  eveningDays?: string;
  eveningHours?: string;
  saturdayHours?: string;
  siteSupervisor?: string;
  siteSupervisorPhone?: string;
  notes?: string;
}

interface ChangeRequestsSectionProps {
  changeRequests: ChangeRequest[];
  sites: Site[];
  onReview: (requestId: string, status: 'approved' | 'rejected', notes?: string) => void;
}

export default function ChangeRequestsSection({ 
  changeRequests, 
  sites, 
  onReview 
}: ChangeRequestsSectionProps) {
  const pendingRequests = changeRequests.filter((r: any) => r.status === 'pending');

  if (pendingRequests.length === 0) {
    return (
      <div className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Pending change requests</h2>
        <p className="py-8 text-center text-slate-500">No pending change requests.</p>
      </div>
    );
  }

  const hasChanges = (request: ChangeRequest, field: string, currentSite: any) => {
    const requestedValue = (request as any)[field];
    if (requestedValue == null) return false;
    const currentValue = currentSite?.[field] || '';
    return String(requestedValue).trim() !== String(currentValue).trim();
  };

  return (
    <div className="surface-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Pending change requests</h2>
      
      <div className="space-y-4">
        {pendingRequests
          .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .map((request: any) => {
            const currentSite = sites.find((s: any) => s._id === request.siteId);
            
            return (
              <div key={request._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{request.siteName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted: {new Date(request.submittedAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Contact: {request.contactName} ({request.contactEmail})
                      {request.contactPhone && ` - ${request.contactPhone}`}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {request.businessPhone && request.businessPhone !== request.contactPhone && (
                    <div className={hasChanges(request, 'businessPhone', currentSite) ? 'bg-yellow-100 p-3 rounded-lg border-2 border-yellow-400' : ''}>
                      <p className="text-xs font-medium text-gray-500">Business Phone</p>
                      <p className="text-sm text-gray-900 font-semibold">{request.businessPhone}</p>
                      {currentSite?.businessPhone && (
                        <p className="text-xs text-gray-500 mt-1">Current: {currentSite.businessPhone}</p>
                      )}
                    </div>
                  )}
                  {request.daytimeDays && (
                    <div className={hasChanges(request, 'daytimeDays', currentSite) ? 'bg-yellow-100 p-3 rounded-lg border-2 border-yellow-400' : ''}>
                      <p className="text-xs font-medium text-gray-500">Daytime Days</p>
                      <p className="text-sm text-gray-900 font-semibold">{request.daytimeDays}</p>
                      {currentSite?.daytimeDays && (
                        <p className="text-xs text-gray-500 mt-1">Current: {currentSite.daytimeDays}</p>
                      )}
                    </div>
                  )}
                  {request.daytimeHours && (
                    <div className={hasChanges(request, 'daytimeHours', currentSite) ? 'bg-yellow-100 p-3 rounded-lg border-2 border-yellow-400' : ''}>
                      <p className="text-xs font-medium text-gray-500">Daytime Hours</p>
                      <p className="text-sm text-gray-900 font-semibold">{request.daytimeHours}</p>
                      {currentSite?.daytimeHours && (
                        <p className="text-xs text-gray-500 mt-1">Current: {currentSite.daytimeHours}</p>
                      )}
                    </div>
                  )}
                  {request.eveningDays && (
                    <div className={hasChanges(request, 'eveningDays', currentSite) ? 'bg-yellow-100 p-3 rounded-lg border-2 border-yellow-400' : ''}>
                      <p className="text-xs font-medium text-gray-500">Evening Days</p>
                      <p className="text-sm text-gray-900 font-semibold">{request.eveningDays}</p>
                      {currentSite?.eveningDays && (
                        <p className="text-xs text-gray-500 mt-1">Current: {currentSite.eveningDays}</p>
                      )}
                    </div>
                  )}
                  {request.eveningHours && (
                    <div className={hasChanges(request, 'eveningHours', currentSite) ? 'bg-yellow-100 p-3 rounded-lg border-2 border-yellow-400' : ''}>
                      <p className="text-xs font-medium text-gray-500">Evening Hours</p>
                      <p className="text-sm text-gray-900 font-semibold">{request.eveningHours}</p>
                      {currentSite?.eveningHours && (
                        <p className="text-xs text-gray-500 mt-1">Current: {currentSite.eveningHours}</p>
                      )}
                    </div>
                  )}
                  {request.saturdayHours && (
                    <div className={hasChanges(request, 'saturdayHours', currentSite) ? 'bg-yellow-100 p-3 rounded-lg border-2 border-yellow-400' : ''}>
                      <p className="text-xs font-medium text-gray-500">Saturday Hours</p>
                      <p className="text-sm text-gray-900 font-semibold">{request.saturdayHours}</p>
                      {currentSite?.saturdayHours && (
                        <p className="text-xs text-gray-500 mt-1">Current: {currentSite.saturdayHours}</p>
                      )}
                    </div>
                  )}
                  {typeof request.siteSupervisor === 'string' && (
                    <div className={hasChanges(request, 'siteSupervisor', currentSite) ? 'bg-yellow-100 p-3 rounded-lg border-2 border-yellow-400' : ''}>
                      <p className="text-xs font-medium text-gray-500">Site Supervisor(s)</p>
                      <p className="text-sm text-gray-900 font-semibold">{request.siteSupervisor || '—'}</p>
                      {currentSite?.siteSupervisor && (
                        <p className="text-xs text-gray-500 mt-1">Current: {currentSite.siteSupervisor}</p>
                      )}
                    </div>
                  )}
                  {typeof request.siteSupervisorPhone === 'string' && (
                    <div className={hasChanges(request, 'siteSupervisorPhone', currentSite) ? 'bg-yellow-100 p-3 rounded-lg border-2 border-yellow-400' : ''}>
                      <p className="text-xs font-medium text-gray-500">Site Supervisor Phone(s)</p>
                      <p className="text-sm text-gray-900 font-semibold">{request.siteSupervisorPhone || '—'}</p>
                      {currentSite?.siteSupervisorPhone && (
                        <p className="text-xs text-gray-500 mt-1">Current: {currentSite.siteSupervisorPhone}</p>
                      )}
                    </div>
                  )}
                </div>

                {request.notes && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500">Notes</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{request.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      const notes = prompt('Rejection reason (optional):');
                      onReview(request._id, 'rejected', notes || undefined);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Approve this change request and apply the changes to the site?')) {
                        onReview(request._id, 'approved');
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-d79-navy px-3 py-2 text-sm font-medium text-white hover:bg-d79-blue"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}


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
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Change Requests</h2>
        <p className="text-gray-500 text-center py-8">No pending change requests.</p>
      </div>
    );
  }

  const hasChanges = (request: ChangeRequest, field: string, currentSite: any) => {
    const requestedValue = (request as any)[field];
    if (!requestedValue || requestedValue === '') return false;
    const currentValue = currentSite?.[field] || '';
    return String(requestedValue).trim() !== String(currentValue).trim();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Change Requests</h2>
      
      <div className="space-y-4">
        {pendingRequests
          .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .map((request: any) => {
            const currentSite = sites.find((s: any) => s._id === request.siteId);
            
            return (
              <div key={request._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
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
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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


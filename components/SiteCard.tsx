'use client';

import React from 'react';
import Link from 'next/link';
import { Home, MapPin, Phone, AlertCircle, ExternalLink } from 'lucide-react';
import { Copy, Check } from 'lucide-react';

export interface Site {
  _id: string;
  dbn: string;
  program: string;
  siteName: string;
  status?: string;
  buildingAddress?: string;
  borough?: string;
  zipCode?: string;
  businessPhone?: string;
  assistantPrincipal?: string;
  apEmail?: string;
  principal?: string;
  principalEmail?: string;
  daytimeDays?: string;
  daytimeHours?: string;
  eveningDays?: string;
  eveningHours?: string;
  hasSaturdayProgram?: string;
  saturdayHours?: string;
  subject?: string;
  category: 'adult-ed' | 'youth';
  lcgmsBuildingCode?: string;
}

interface SiteCardProps {
  site: Site;
  onReportChanges: (site: Site) => void;
}

export default function SiteCard({ site, onReportChanges }: SiteCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:scale-105">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{site.siteName}</h3>
        {site.status && (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              site.status === 'Open'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {site.status}
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span>{site.program}</span>
        </div>

        {site.buildingAddress && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{site.buildingAddress}</span>
          </div>
        )}

        {site.borough && (
          <div className="text-gray-500">{site.borough}, NY {site.zipCode}</div>
        )}

        {site.businessPhone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <a href={`tel:${site.businessPhone}`} className="hover:text-blue-600">
              {site.businessPhone}
            </a>
          </div>
        )}

        {(site.principal || site.principalEmail || site.assistantPrincipal || site.apEmail) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {(site.principal || site.principalEmail) && (
              <div className="text-xs text-gray-700 mb-2">
                <span className="font-medium text-gray-900">Principal:</span>{' '}
                {site.principal ? <span>{site.principal}</span> : <span className="text-gray-500">N/A</span>}
                {site.principalEmail && (
                  <>
                    {' '}
                    <a
                      href={`mailto:${(site.principalEmail || '').toLowerCase()}`}
                      className="text-blue-600 hover:underline break-all"
                      title="Email principal"
                    >
                      {(site.principalEmail || '').toLowerCase()}
                    </a>
                  </>
                )}
              </div>
            )}

            {(site.assistantPrincipal || site.apEmail) && (
              <div className="text-xs text-gray-700">
                <span className="font-medium text-gray-900">
                  Assistant Principal{(site.assistantPrincipal && site.assistantPrincipal.includes('/')) || (site.apEmail && site.apEmail.includes('/')) ? 's' : ''}:
                </span>
                <div className="mt-1 space-y-1">
                  {(() => {
                    const names = site.assistantPrincipal ? site.assistantPrincipal.split('/').map(n => n.trim()).filter(Boolean) : [];
                    const emails = site.apEmail ? site.apEmail.split('/').map(e => e.trim()).filter(Boolean) : [];
                    const maxLen = Math.max(names.length, emails.length);
                    if (maxLen === 0) {
                      return <div className="text-gray-500">N/A</div>;
                    }
                    const rows = [] as JSX.Element[];
                    for (let i = 0; i < maxLen; i++) {
                      const name = names[i];
                      const email = emails[i];
                      rows.push(
                        <div key={i} className="flex items-start gap-1">
                          {name && <span>{name}</span>}
                          {email && (
                            <a href={`mailto:${(email || '').toLowerCase()}`} className="text-blue-600 hover:underline break-all">
                              {name ? `- ${(email || '').toLowerCase()}` : (email || '').toLowerCase()}
                            </a>
                          )}
                          {!name && !email && <span className="text-gray-500">N/A</span>}
                        </div>
                      );
                    }
                    return rows;
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hours Section - Only show if there are valid hours */}
      {(() => {
        const validHours: { type: string; days: string | null | undefined; hours: string | null | undefined }[] = [];
        if (site.daytimeHours && site.daytimeHours !== 'N/A' && !site.daytimeHours.includes('undefined')) {
          validHours.push({ type: 'Daytime', days: site.daytimeDays, hours: site.daytimeHours });
        }
        if (site.eveningHours && site.eveningHours !== 'N/A' && !site.eveningHours.includes('undefined')) {
          validHours.push({ type: 'Evening', days: site.eveningDays, hours: site.eveningHours });
        }
        if (site.saturdayHours && site.saturdayHours !== 'N/A' && !site.saturdayHours.includes('undefined')) {
          validHours.push({ type: 'Saturday', days: null, hours: site.saturdayHours });
        }

        if (validHours.length > 0) {
          return (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Hours:</p>
              <div className="space-y-1 text-xs text-gray-600">
                {validHours.map((hour, idx) => (
                  <div key={idx}>
                    {hour.type}: {hour.days ? `${hour.days} ` : ''}{hour.hours}
                  </div>
                ))}
              </div>
            </div>
          );
        } else {
          return (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Hours:</p>
              <div className="text-xs text-gray-400 italic">Data not available</div>
            </div>
          );
        }
      })()}

      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        <Link
          href={`/site/${site._id}`}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Site Details
        </Link>
        <button
          onClick={() => onReportChanges(site)}
          className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Report Changes
        </button>
      </div>
    </div>
  );
}



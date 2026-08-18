'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, ExternalLink, Home, MapPin, Phone } from 'lucide-react';
import { parseNamedPhones } from '@/lib/staff';

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
  siteSupervisor?: string;
  siteSupervisorPhone?: string;
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
  const validHours: { type: string; days: string | null | undefined; hours: string }[] = [];
  if (site.daytimeHours && site.daytimeHours !== 'N/A' && !site.daytimeHours.includes('undefined')) {
    validHours.push({ type: 'Daytime', days: site.daytimeDays, hours: site.daytimeHours });
  }
  if (site.eveningHours && site.eveningHours !== 'N/A' && !site.eveningHours.includes('undefined')) {
    validHours.push({ type: 'Evening', days: site.eveningDays, hours: site.eveningHours });
  }
  if (site.saturdayHours && site.saturdayHours !== 'N/A' && !site.saturdayHours.includes('undefined')) {
    validHours.push({ type: 'Saturday', days: null, hours: site.saturdayHours });
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug text-slate-900">{site.siteName}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            site.category === 'adult-ed'
              ? 'bg-d79-sky text-d79-navy'
              : 'bg-violet-100 text-violet-800'
          }`}
        >
          {site.category === 'adult-ed' ? 'Adult Ed' : 'Youth'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <Home className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>{site.program}</span>
        </div>

        {site.buildingAddress && (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>
              {site.buildingAddress}
              {site.borough && (
                <span className="block text-slate-500">
                  {site.borough}, NY {site.zipCode}
                </span>
              )}
            </span>
          </div>
        )}

        {site.businessPhone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
            <a href={`tel:${site.businessPhone}`} className="hover:text-d79-blue">
              {site.businessPhone}
            </a>
          </div>
        )}
      </div>

      {(site.principal || site.principalEmail || site.assistantPrincipal || site.apEmail || site.siteSupervisor || site.siteSupervisorPhone) && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {(site.principal || site.principalEmail) && (
            <p>
              <span className="font-medium text-slate-900">Principal:</span>{' '}
              {site.principal || 'N/A'}
              {site.principalEmail && (
                <>
                  {' '}
                  <a
                    href={`mailto:${(site.principalEmail || '').toLowerCase()}`}
                    className="text-d79-blue hover:underline"
                  >
                    {(site.principalEmail || '').toLowerCase()}
                  </a>
                </>
              )}
            </p>
          )}

          {(site.assistantPrincipal || site.apEmail) && (
            <div>
              <span className="font-medium text-slate-900">
                Assistant Principal
                {(site.assistantPrincipal && site.assistantPrincipal.includes('/')) ||
                (site.apEmail && site.apEmail.includes('/'))
                  ? 's'
                  : ''}
                :
              </span>
              <div className="mt-1 space-y-1">
                {(() => {
                  const names = site.assistantPrincipal
                    ? site.assistantPrincipal.split('/').map((n) => n.trim()).filter(Boolean)
                    : [];
                  const emails = site.apEmail
                    ? site.apEmail.split('/').map((e) => e.trim()).filter(Boolean)
                    : [];
                  const maxLen = Math.max(names.length, emails.length);
                  if (maxLen === 0) return <div className="text-slate-500">N/A</div>;
                  return Array.from({ length: maxLen }).map((_, i) => {
                    const name = names[i];
                    const email = emails[i];
                    return (
                      <div key={i}>
                        {name && <span>{name}</span>}
                        {email && (
                          <a
                            href={`mailto:${email.toLowerCase()}`}
                            className="ml-1 text-d79-blue hover:underline"
                          >
                            {email.toLowerCase()}
                          </a>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {(site.siteSupervisor || site.siteSupervisorPhone) && (
            <div>
              <span className="font-medium text-slate-900">
                Site Supervisor
                {parseNamedPhones(site.siteSupervisor, site.siteSupervisorPhone).length > 1 ? 's' : ''}
                :
              </span>
              <div className="mt-1 space-y-1">
                {parseNamedPhones(site.siteSupervisor, site.siteSupervisorPhone).map((supervisor, i) => (
                  <div key={i}>
                    {supervisor.name && <span>{supervisor.name}</span>}
                    {supervisor.phone && (
                      <a href={`tel:${supervisor.phone}`} className="ml-1 text-d79-blue hover:underline">
                        {supervisor.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          Hours
        </p>
        {validHours.length > 0 ? (
          <div className="space-y-1 text-xs text-slate-600">
            {validHours.map((hour) => (
              <div key={hour.type}>
                {hour.type}: {hour.days ? `${hour.days} ` : ''}
                {hour.hours}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs italic text-slate-400">Hours not available</p>
        )}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <Link
          href={`/site/${site._id}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-d79-navy px-3 py-2 text-sm font-medium text-white hover:bg-d79-blue"
        >
          <ExternalLink className="h-4 w-4" />
          Details
        </Link>
        <button
          onClick={() => onReportChanges(site)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <AlertCircle className="h-4 w-4" />
          Report
        </button>
      </div>
    </article>
  );
}

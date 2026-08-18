'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import StaticMap from '@/components/StaticMap';
import ChangeRequestModal from '@/components/ChangeRequestModal';
import {
  Loader2,
  ChevronLeft,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  FileText,
  Hash,
} from 'lucide-react';
import Link from 'next/link';
import { parseNamedPhones } from '@/lib/staff';

interface Site {
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
  saturdayHours?: string;
  hasSaturdayProgram?: string;
  subject?: string;
  description?: string;
  category: 'adult-ed' | 'youth';
  lcgmsBuildingCode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function SiteDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSite();
      fetchMapboxToken();
    }
  }, [id]);

  const fetchSite = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sites/${id}`);
      if (!response.ok) {
        setError(response.status === 404 ? 'Site not found' : 'Failed to load site');
        return;
      }
      setSite(await response.json());
    } catch (err) {
      console.error('Error fetching site:', err);
      setError('Failed to load site');
    } finally {
      setLoading(false);
    }
  };

  const fetchMapboxToken = async () => {
    try {
      const response = await fetch('/api/mapbox-token');
      if (response.ok) {
        const data = await response.json();
        if (data.token) setMapboxToken(data.token);
      }
    } catch (err) {
      console.error('Error fetching mapbox token:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-d79-blue" />
          <p className="text-slate-600">Loading site details...</p>
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center py-12">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h2 className="text-lg font-semibold text-red-900">{error || 'Site not found'}</h2>
          <p className="mt-2 text-sm text-red-700">The site you are looking for does not exist.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/home"
              className="inline-flex items-center rounded-lg bg-d79-navy px-4 py-2 text-sm font-medium text-white hover:bg-d79-blue"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to directory
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasCoordinates =
    !!site.latitude &&
    !!site.longitude &&
    !isNaN(site.latitude) &&
    !isNaN(site.longitude) &&
    isFinite(site.latitude) &&
    isFinite(site.longitude);

  const validHours: Array<{ type: string; days: string | null | undefined; hours: string }> = [];
  if (site.daytimeHours && site.daytimeHours !== 'N/A' && !site.daytimeHours.includes('undefined')) {
    validHours.push({ type: 'Daytime', days: site.daytimeDays, hours: site.daytimeHours });
  }
  if (site.eveningHours && site.eveningHours !== 'N/A' && !site.eveningHours.includes('undefined')) {
    validHours.push({ type: 'Evening', days: site.eveningDays, hours: site.eveningHours });
  }
  if (site.saturdayHours && site.saturdayHours !== 'N/A' && !site.saturdayHours.includes('undefined')) {
    validHours.push({ type: 'Saturday', days: null, hours: site.saturdayHours });
  }

  const apNames = site.assistantPrincipal
    ? site.assistantPrincipal.split('/').map((n) => n.trim()).filter(Boolean)
    : [];
  const apEmails = site.apEmail ? site.apEmail.split('/').map((e) => e.trim()).filter(Boolean) : [];
  const supervisors = parseNamedPhones(site.siteSupervisor, site.siteSupervisorPhone);
  const address = [site.buildingAddress, site.borough, site.zipCode && `NY ${site.zipCode}`]
    .filter(Boolean)
    .join(', ');
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null;
  const markerColor = site.category === 'youth' ? '#7C3AED' : '#003F87';

  return (
    <div className="bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="page-shell py-6">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <Link href="/home" className="inline-flex items-center font-medium text-d79-blue hover:text-d79-navy">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Directory
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/map" className="font-medium text-slate-500 hover:text-d79-navy">
              Map
            </Link>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {site.status && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      site.status === 'Open' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {site.status}
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    site.category === 'adult-ed' ? 'bg-d79-sky text-d79-navy' : 'bg-violet-100 text-violet-800'
                  }`}
                >
                  {site.category === 'adult-ed' ? 'Adult Education' : 'Youth Programs'}
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-d79-navy">{site.siteName}</h1>
              <p className="mt-1 text-lg text-slate-600">{site.program}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {site.dbn && (
                  <span className="inline-flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    DBN {site.dbn}
                  </span>
                )}
                {site.lcgmsBuildingCode && <span>LCGMS {site.lcgmsBuildingCode}</span>}
                {site.borough && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {site.borough}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <AlertCircle className="h-4 w-4" />
              Report changes
            </button>
          </div>
        </div>
      </div>

      <div className="page-shell grid grid-cols-1 gap-6 py-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {site.description && (
            <section className="surface-card p-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <FileText className="h-4 w-4 text-d79-blue" />
                About this program
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-slate-700">{site.description}</p>
            </section>
          )}

          <section className="surface-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Contact</h2>
            <dl className="grid gap-5 sm:grid-cols-2">
              {address && (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</dt>
                    <dd className="mt-1 text-slate-900">{address}</dd>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-d79-blue hover:text-d79-navy"
                      >
                        Open in Google Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
              {site.businessPhone && (
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</dt>
                    <dd className="mt-1">
                      <a href={`tel:${site.businessPhone}`} className="text-d79-blue hover:text-d79-navy">
                        {site.businessPhone}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </section>

          {(site.principal || site.principalEmail || apNames.length > 0 || apEmails.length > 0 || supervisors.length > 0) && (
            <section className="surface-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Mail className="h-4 w-4 text-d79-blue" />
                Staff
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(site.principal || site.principalEmail) && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Principal</p>
                    <p className="mt-1 font-medium text-slate-900">{site.principal || '—'}</p>
                    {site.principalEmail && (
                      <a
                        href={`mailto:${site.principalEmail.toLowerCase()}`}
                        className="mt-1 block break-all text-sm text-d79-blue hover:text-d79-navy"
                      >
                        {site.principalEmail.toLowerCase()}
                      </a>
                    )}
                  </div>
                )}
                {Array.from({ length: Math.max(apNames.length, apEmails.length) }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Assistant principal{Math.max(apNames.length, apEmails.length) > 1 ? ` ${i + 1}` : ''}
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{apNames[i] || '—'}</p>
                    {apEmails[i] && (
                      <a
                        href={`mailto:${apEmails[i].toLowerCase()}`}
                        className="mt-1 block break-all text-sm text-d79-blue hover:text-d79-navy"
                      >
                        {apEmails[i].toLowerCase()}
                      </a>
                    )}
                  </div>
                ))}
                {supervisors.map((supervisor, i) => (
                  <div key={`supervisor-${i}`} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Site supervisor{supervisors.length > 1 ? ` ${i + 1}` : ''}
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{supervisor.name || '—'}</p>
                    {supervisor.phone && (
                      <a
                        href={`tel:${supervisor.phone}`}
                        className="mt-1 block text-sm text-d79-blue hover:text-d79-navy"
                      >
                        {supervisor.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {validHours.length > 0 && (
            <section className="surface-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Clock className="h-4 w-4 text-d79-blue" />
                Hours
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {validHours.map((hour) => (
                  <div key={hour.type} className="rounded-xl border border-slate-200 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{hour.type}</p>
                    {hour.days && <p className="mt-1 text-sm text-slate-600">{hour.days}</p>}
                    <p className="mt-0.5 font-medium text-slate-900">{hour.hours}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {site.subject && (
            <section className="surface-card p-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Additional information
              </h2>
              <p className="text-slate-700">
                <span className="font-medium">Subject:</span> {site.subject}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-[88px] lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            {hasCoordinates && mapboxToken ? (
              <div className="h-64 w-full">
                <StaticMap
                  latitude={site.latitude!}
                  longitude={site.longitude!}
                  mapboxToken={mapboxToken}
                  zoom={15}
                  siteName={site.siteName}
                  markerColor={markerColor}
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center bg-slate-50 text-center text-sm text-slate-500">
                <div>
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  Location coordinates not available
                </div>
              </div>
            )}
            {address && <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">{address}</p>}
          </div>

          <div className="surface-card space-y-2 p-4">
            {site.businessPhone && (
              <a
                href={`tel:${site.businessPhone}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-d79-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-d79-blue"
              >
                <Phone className="h-4 w-4" />
                Call site
              </a>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                Google Maps
              </a>
            )}
            <Link
              href="/map"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4" />
              District map
            </Link>
          </div>
        </aside>
      </div>

      <ChangeRequestModal site={site} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

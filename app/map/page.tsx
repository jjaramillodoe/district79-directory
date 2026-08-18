'use client';

import { useState, useEffect, useMemo } from 'react';
import SiteMap, { Site } from '@/components/SiteMap';
import { Loader2, AlertCircle, MapPin, Search, X } from 'lucide-react';
import Link from 'next/link';
import { isValidLatLng } from '@/lib/coordinates';

export default function MapPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBorough, setSelectedBorough] = useState('all');
  const [selectedSite, setSelectedSite] = useState<string | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/public/verify', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchData();
        } else {
          window.location.href = '/';
        }
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Auth check error:', err);
      window.location.href = '/';
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tokenResponse, sitesResponse] = await Promise.all([
        fetch('/api/mapbox-token'),
        fetch('/api/sites'),
      ]);

      if (!tokenResponse.ok) throw new Error('Failed to fetch Mapbox token');
      const tokenData = await tokenResponse.json();
      if (!tokenData.token) throw new Error('Token not found in response');
      setMapboxToken(tokenData.token);

      if (!sitesResponse.ok) throw new Error('Failed to fetch sites');
      const sitesData = await sitesResponse.json();
      setSites((sitesData || []).filter((site: Site) => site.status === 'Open'));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load map data. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const sitesWithCoordinates = useMemo(
    () => sites.filter((site) => isValidLatLng(site.latitude, site.longitude)),
    [sites]
  );

  const programs = useMemo(
    () => Array.from(new Set(sitesWithCoordinates.map((s) => s.program).filter(Boolean))).sort(),
    [sitesWithCoordinates]
  );

  const boroughs = useMemo(
    () => Array.from(new Set(sitesWithCoordinates.map((s) => s.borough).filter(Boolean))).sort() as string[],
    [sitesWithCoordinates]
  );

  const filteredSites = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sitesWithCoordinates.filter((site) => {
      const matchesProgram = selectedProgram === 'all' || site.program === selectedProgram;
      const matchesCategory = selectedCategory === 'all' || site.category === selectedCategory;
      const matchesBorough = selectedBorough === 'all' || site.borough === selectedBorough;
      const matchesSearch =
        !q ||
        site.siteName.toLowerCase().includes(q) ||
        site.program.toLowerCase().includes(q) ||
        site.buildingAddress?.toLowerCase().includes(q) ||
        site.borough?.toLowerCase().includes(q);
      return matchesProgram && matchesCategory && matchesBorough && matchesSearch;
    });
  }, [sitesWithCoordinates, selectedProgram, selectedCategory, selectedBorough, searchTerm]);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedProgram !== 'all' ||
    selectedCategory !== 'all' ||
    selectedBorough !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProgram('all');
    setSelectedCategory('all');
    setSelectedBorough('all');
    setSelectedSite(undefined);
  };

  const unmappedCount = sites.length - sitesWithCoordinates.length;

  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-d79-blue" />
          <p className="text-slate-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error || !mapboxToken) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center py-12">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h2 className="text-lg font-semibold text-red-900">Map unavailable</h2>
          <p className="mt-2 text-sm text-red-700">
            {error || 'Mapbox access token is missing. Please check your environment variables.'}
          </p>
          <Link
            href="/home"
            className="mt-4 inline-flex items-center rounded-lg bg-d79-navy px-4 py-2 text-sm font-medium text-white hover:bg-d79-blue"
          >
            Back to directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="page-shell space-y-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-d79-navy">Site map</h1>
            <p className="mt-1 text-slate-600">
              {filteredSites.length} mapped sites
              {unmappedCount > 0 && (
                <span className="text-slate-500"> · {unmappedCount} without coordinates</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-d79-navy" />
              Adult Education
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
              Youth Programs
            </span>
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative md:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sites..."
                className="select-field pl-9"
              />
            </div>
            <select
              value={selectedBorough}
              onChange={(e) => setSelectedBorough(e.target.value)}
              className="select-field"
            >
              <option value="all">All boroughs</option>
              {boroughs.map((borough) => (
                <option key={borough} value={borough}>{borough}</option>
              ))}
            </select>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="select-field"
            >
              <option value="all">All programs</option>
              {programs.map((program) => (
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select-field"
            >
              <option value="all">All categories</option>
              <option value="adult-ed">Adult Education</option>
              <option value="youth">Youth Programs</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-d79-navy"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="surface-card flex max-h-[70vh] flex-col overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
              {filteredSites.length} {filteredSites.length === 1 ? 'site' : 'sites'}
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredSites.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  No mapped sites match these filters.
                </div>
              ) : (
                filteredSites
                  .slice()
                  .sort((a, b) => a.siteName.localeCompare(b.siteName))
                  .map((site) => (
                    <button
                      key={site._id}
                      type="button"
                      onClick={() => setSelectedSite(site._id)}
                      className={`w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${
                        selectedSite === site._id ? 'bg-d79-sky' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-900">{site.siteName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{site.program}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {[site.borough, site.buildingAddress].filter(Boolean).join(' · ')}
                      </p>
                    </button>
                  ))
              )}
            </div>
          </aside>

          <div className="h-[70vh] min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 shadow-card">
            <SiteMap
              sites={filteredSites}
              selectedSite={selectedSite}
              onSiteSelect={setSelectedSite}
              mapboxToken={mapboxToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Footer from '@/components/Footer';
import SiteMap, { Site } from '@/components/SiteMap';
import { Loader2, ChevronLeft, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MapPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSite, setSelectedSite] = useState<string | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Map page - Checking authentication...');
      const response = await fetch('/api/auth/public/verify', {
        credentials: 'include', // Important: include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('   - Map page auth response:', data);
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchData(); // Fetch data only if authenticated
        } else {
          window.location.href = '/';
        }
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Auth check error:', error);
      window.location.href = '/';
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch both token and sites in parallel
  const fetchData = async () => {
      try {
        setLoading(true);
        
        const [tokenResponse, sitesResponse] = await Promise.all([
          fetch('/api/mapbox-token'),
          fetch('/api/sites'),
        ]);

        // Handle token
        if (!tokenResponse.ok) {
          throw new Error('Failed to fetch Mapbox token');
        }
        const tokenData = await tokenResponse.json();
        if (tokenData.token) {
          setMapboxToken(tokenData.token);
        } else {
          throw new Error('Token not found in response');
        }

        // Handle sites
        if (!sitesResponse.ok) {
          throw new Error('Failed to fetch sites');
        }
        const sitesData = await sitesResponse.json();
        // Filter to show only open sites
        const openSites = (sitesData || []).filter((site: Site) => 
          site.status === 'Open'
        );
        setSites(openSites);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load map data. Please check your configuration.');
      } finally {
        setLoading(false);
      }
  };

  // Filter sites with valid coordinates
  const sitesWithCoordinates = useMemo(
    () =>
      sites.filter(
        (site) =>
          site.latitude != null &&
          site.longitude != null &&
          !isNaN(site.latitude) &&
          !isNaN(site.longitude) &&
          isFinite(site.latitude) &&
          isFinite(site.longitude)
      ),
    [sites]
  );

  // Get unique programs for filter
  const programs = useMemo(
    () =>
      Array.from(
        new Set(sitesWithCoordinates.map((s) => s.program).filter(Boolean))
      ).sort(),
    [sitesWithCoordinates]
  );

  // Filter sites by program and category
  const filteredSites = useMemo(
    () =>
      sitesWithCoordinates.filter((site) => {
        const matchesProgram =
          selectedProgram === 'all' || site.program === selectedProgram;
        const matchesCategory =
          selectedCategory === 'all' || site.category === selectedCategory;
        return matchesProgram && matchesCategory;
      }),
    [sitesWithCoordinates, selectedProgram, selectedCategory]
  );

  // Loading state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Map
          </h2>
          <p className="text-gray-600">Loading map data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !mapboxToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Map Error
            </h2>
            <p className="text-red-700 mb-4">
              {error ||
                'Mapbox access token is missing. Please check your environment variables.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Directory
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Site Map</h1>
              <p className="text-gray-600 mt-1">
                View all District 79 sites on a map
              </p>
            </div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Directory
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Programs</option>
                  {programs.map((program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="adult-ed">Adult Education</option>
                  <option value="youth">Youth Programs</option>
                </select>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredSites.length} of {sitesWithCoordinates.length} sites
              {sites.length !== sitesWithCoordinates.length && (
                <span className="text-gray-500">
                  {' '}
                  ({sites.length - sitesWithCoordinates.length} without coordinates)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
          {mapboxToken && (
            <SiteMap
              sites={filteredSites}
              selectedSite={selectedSite}
              onSiteSelect={setSelectedSite}
              mapboxToken={mapboxToken}
            />
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">About the Map</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click on markers to view site details</li>
            <li>• Filter by program or category to narrow down results</li>
            <li>• Only sites with geocoded coordinates are displayed</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
}

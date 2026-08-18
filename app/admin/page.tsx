'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, MapPin, Loader2 } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import LoginForm from '@/components/admin/LoginForm';
import UploadSection from '@/components/admin/UploadSection';
import SearchAndFilters from '@/components/admin/SearchAndFilters';
import SitesTable from '@/components/admin/SitesTable';
import ChangeRequestsSection from '@/components/admin/ChangeRequestsSection';
import { isValidLatLng } from '@/lib/coordinates';
import { downloadDirectoryPdf } from '@/lib/pdf-export';

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
  category: 'adult-ed' | 'youth';
  lcgmsBuildingCode?: string;
  csd?: string;
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
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function AdminPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBorough, setSelectedBorough] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('siteName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editedSite, setEditedSite] = useState<Site | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [geocodingAll, setGeocodingAll] = useState(false);
  const [generatingDescriptions, setGeneratingDescriptions] = useState(false);
  const [fillingSupervisors, setFillingSupervisors] = useState(false);
  const [descriptionCount, setDescriptionCount] = useState(10);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [showChangeRequests, setShowChangeRequests] = useState(false);
  const [normalizingAddresses, setNormalizingAddresses] = useState(false);
  const [normalizeStatus, setNormalizeStatus] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check admin authentication only
      // Public users with Google OAuth can still access this page to see the login form
      // They just need to use password authentication to access admin features
      const response = await fetch('/api/auth/verify', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.authenticated) {
        // User is authenticated as admin (has admin_token cookie)
        setIsAuthenticated(true);
        fetchSites();
        fetchChangeRequests();
      } else {
        // Not authenticated as admin - show login form
        // This could be:
        // 1. No authentication at all
        // 2. Public user with user_token (can still see login form and use password)
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false);
    }
  };

  const handleLogin = async (pwd?: string) => {
    const passwordToUse = pwd || password;
    setAuthError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordToUse }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setPassword('');
        fetchSites();
      } else {
        setAuthError(data.error || 'Invalid password');
      }
    } catch (error) {
      setAuthError('Login failed. Please try again.');
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setPassword('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      setSites(data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      const response = await fetch('/api/change-requests');
      const data = await response.json();
      setChangeRequests(data);
    } catch (error) {
      console.error('Error fetching change requests:', error);
    }
  };

  const handleReviewChangeRequest = async (requestId: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    try {
      const response = await fetch(`/api/change-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Change request ${status}!${data.applied ? ' Changes have been applied to the site.' : ''}`);
        fetchChangeRequests();
        fetchSites(); // Refresh sites in case changes were applied
      } else {
        alert(`Error: ${data.error || 'Failed to update change request'}`);
      }
    } catch (error) {
      console.error('Error reviewing change request:', error);
      alert('Failed to review change request. Please try again.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        setUploadStatus(`✅ Successfully imported ${result.count} sites from ${file.name}`);
        fetchSites();
      } else {
        setUploadStatus(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('❌ Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      const response = await fetch(`/api/sites/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSites();
      }
    } catch (error) {
      console.error('Error deleting site:', error);
    }
  };

  const handleEdit = (site: Site) => {
    setEditMode(site._id);
    setEditedSite({ ...site });
  };

  const handleSave = async () => {
    if (!editedSite || !editMode) return;

    try {
      const response = await fetch(`/api/sites/${editMode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedSite),
      });

      if (response.ok) {
        setEditMode(null);
        setEditedSite(null);
        fetchSites();
      }
    } catch (error) {
      console.error('Error updating site:', error);
    }
  };

  const handleCancel = () => {
    setEditMode(null);
    setEditedSite(null);
  };

  const handleNormalizeAddresses = async () => {
    if (!confirm('This will normalize and fix all addresses in the database (including fixing incorrectly normalized addresses). Continue?')) {
      return;
    }

    setNormalizingAddresses(true);
    setNormalizeStatus('Normalizing addresses...');

    try {
      const response = await fetch('/api/sites/normalize-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory === 'all' ? 'all' : selectedCategory,
          dryRun: false,
          force: true, // Force update to fix previously incorrect normalizations
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNormalizeStatus(
          data.message || `✅ Successfully normalized ${data.updated} addresses out of ${data.total} total`
        );
        fetchSites(); // Refresh sites
      } else {
        setNormalizeStatus(`❌ Error: ${data.error || 'Failed to normalize addresses'}`);
      }
    } catch (error) {
      console.error('Normalize addresses error:', error);
      setNormalizeStatus('❌ Failed to normalize addresses');
    } finally {
      setNormalizingAddresses(false);
      setTimeout(() => setNormalizeStatus(''), 5000);
    }
  };

  const handleGeocodeAll = async () => {
    const sitesWithoutCoords = sites.filter((s) => !isValidLatLng(s.latitude, s.longitude)).length;

    if (sitesWithoutCoords === 0) {
      const shouldRegeocode = confirm(
        'All sites already have coordinates.\n\nRe-geocode every site with NYC GeoSearch / Mapbox?'
      );
      if (!shouldRegeocode) return;
    } else if (
      !confirm(
        `This will geocode ${sitesWithoutCoords} site(s) that are missing valid coordinates.\n\nContinue?`
      )
    ) {
      return;
    }

    setGeocodingAll(true);
    setUploadStatus('Geocoding sites...');

    try {
      const response = await fetch('/api/sites/geocode-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          regeocodeAll: sitesWithoutCoords === 0 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus(`✅ Geocoding complete! Geocoded: ${data.geocoded}, Failed: ${data.failed}`);
        if (data.errors && data.errors.length > 0) {
          console.warn('Geocoding errors:', data.errors);
        }
        fetchSites();
        
        // Clear the status message after 5 seconds
        setTimeout(() => setUploadStatus(''), 5000);
      } else {
        setUploadStatus(`❌ Error: ${data.error || 'Failed to geocode sites'}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setUploadStatus('❌ Failed to geocode sites. Please try again.');
    } finally {
      setGeocodingAll(false);
    }
  };

  const handleGenerateDescriptionsBulk = async () => {
    const selectedSiteIds = Array.from(selectedSites);
    const count = selectedSiteIds.length > 0 ? selectedSiteIds.length : descriptionCount;
    
    if (selectedSiteIds.length > 0) {
      if (!confirm(`Fill free template descriptions for ${selectedSiteIds.length} selected site(s)? Existing text is not replaced.`)) {
        return;
      }
    } else {
      if (!confirm(`Fill free template descriptions for ${descriptionCount} site(s) that don't have descriptions yet?`)) {
        return;
      }
    }

    setGeneratingDescriptions(true);
    setUploadStatus(`Filling ${count} descriptions...`);

    try {
      const response = await fetch('/api/generate-descriptions-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          count: selectedSiteIds.length > 0 ? selectedSiteIds.length : descriptionCount,
          siteIds: selectedSiteIds.length > 0 ? selectedSiteIds : undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus(`✅ Generated ${data.generated} out of ${data.total} descriptions successfully!`);
        if (data.results) {
          const failed = data.results.filter((r: any) => !r.success).length;
          if (failed > 0) {
            setUploadStatus(`✅ Generated ${data.generated} descriptions. ${failed} failed.`);
          }
        }
        setSelectedSites(new Set()); // Clear selection after generation
        fetchSites();
        
        // Clear the status message after 10 seconds
        setTimeout(() => setUploadStatus(''), 10000);
      } else {
        setUploadStatus(`❌ Error: ${data.error || 'Failed to generate descriptions'}`);
      }
    } catch (error) {
      console.error('Description generation error:', error);
      setUploadStatus('❌ Failed to generate descriptions. Please try again.');
    } finally {
      setGeneratingDescriptions(false);
    }
  };

  const handleFillSupervisors = async () => {
    if (
      !confirm(
        'Copy assistant principal names to Site Supervisor for sites that do not already have one?\n\nEach supervisor will use that site\'s business phone. Existing supervisors will not be changed.'
      )
    ) {
      return;
    }

    setFillingSupervisors(true);
    setUploadStatus('Filling site supervisors...');

    try {
      const response = await fetch('/api/sites/fill-supervisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwrite: false }),
      });
      const data = await response.json();
      if (response.ok) {
        setUploadStatus(
          `✅ Filled supervisors on ${data.updated} site(s). Skipped ${data.skippedHasSupervisor} that already had one.`
        );
        fetchSites();
        setTimeout(() => setUploadStatus(''), 8000);
      } else {
        setUploadStatus(`❌ Error: ${data.error || 'Failed to fill supervisors'}`);
      }
    } catch (error) {
      console.error('Fill supervisors error:', error);
      setUploadStatus('❌ Failed to fill supervisors. Please try again.');
    } finally {
      setFillingSupervisors(false);
    }
  };

  const handleSelectSite = (siteId: string) => {
    const newSelected = new Set(selectedSites);
    if (newSelected.has(siteId)) {
      newSelected.delete(siteId);
    } else {
      newSelected.add(siteId);
    }
    setSelectedSites(newSelected);
  };

  const handleSelectAll = () => {
    const sitesWithoutDescriptions = sortedSites.filter(s => !s.description || s.description.trim() === '');
    if (selectedSites.size === sitesWithoutDescriptions.length) {
      setSelectedSites(new Set());
    } else {
      setSelectedSites(new Set(sitesWithoutDescriptions.map(s => s._id)));
    }
  };

  const handleUpdateYouthStatus = async () => {
    const youthSites = sites.filter(s => s.category === 'youth').length;
    
    if (youthSites === 0) {
      alert('No youth programs found in the database.');
      return;
    }

    if (!confirm(`This will set the status to "Open" for all ${youthSites} youth program site(s).\n\nContinue?`)) {
      return;
    }

    setGeocodingAll(true); // Reuse this state for loading indicator
    setUploadStatus('Updating youth program statuses...');

    try {
      const response = await fetch('/api/sites/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category: 'youth',
          status: 'Open'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus(`✅ Successfully updated ${data.modifiedCount} youth program site(s) to "Open" status`);
        fetchSites();
        
        // Clear the status message after 5 seconds
        setTimeout(() => setUploadStatus(''), 5000);
      } else {
        setUploadStatus(`❌ Error: ${data.error || 'Failed to update status'}`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      setUploadStatus('❌ Failed to update status. Please try again.');
    } finally {
      setGeocodingAll(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      await downloadDirectoryPdf({
        sites: filteredSites,
        groupBy: 'program',
        selectedBorough,
        selectedProgram,
        selectedCategory,
        searchTerm,
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Could not export PDF. Please try again.');
    }
  };

  // Get unique values for filters
  const boroughs = Array.from(new Set(sites.map(s => s.borough).filter(Boolean))).sort() as (string | undefined)[];
  const programs = Array.from(new Set(sites.map(s => s.program).filter(Boolean))).sort();

  // Search suggestions for autocomplete
  const searchSuggestions = searchTerm
    ? sites
        .filter(site =>
          site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.buildingAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.borough?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5)
        .map(site => site.siteName)
    : [];

  const filteredSites = sites.filter(site => {
    const matchesCategory = selectedCategory === 'all' || site.category === selectedCategory;
    const matchesBorough = selectedBorough === 'all' || site.borough === selectedBorough;
    const matchesProgram = selectedProgram === 'all' || site.program === selectedProgram;
    const matchesSearch = !searchTerm ||
      site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.buildingAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.borough?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.principal?.toLowerCase().includes(searchTerm.toLowerCase());

    
    return matchesCategory && matchesBorough && matchesProgram && matchesSearch;
  });

  // Sort sites
  const sortedSites = [...filteredSites].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'siteName':
        comparison = (a.siteName || '').localeCompare(b.siteName || '');
        break;
      case 'program':
        comparison = (a.program || '').localeCompare(b.program || '');
        break;
      case 'borough':
        comparison = (a.borough || '').localeCompare(b.borough || '');
        break;
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '');
        break;
      case 'latitude':
        // Handle null/undefined values - put them at the end
        const latA = a.latitude ?? null;
        const latB = b.latitude ?? null;
        if (latA === null && latB === null) comparison = 0;
        else if (latA === null) comparison = 1; // null values go to end
        else if (latB === null) comparison = -1;
        else comparison = latA - latB;
        break;
      case 'longitude':
        // Handle null/undefined values - put them at the end
        const lngA = a.longitude ?? null;
        const lngB = b.longitude ?? null;
        if (lngA === null && lngB === null) comparison = 0;
        else if (lngA === null) comparison = 1; // null values go to end
        else if (lngB === null) comparison = -1;
        else comparison = lngA - lngB;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const sitesWithoutCoords = sites.filter((s) => !isValidLatLng(s.latitude, s.longitude)).length;
  const hasActiveFilters = selectedCategory !== 'all' || selectedBorough !== 'all' || selectedProgram !== 'all' || searchTerm !== '';

  // Pagination
  const itemsPerPage = 25;
  const totalPages = Math.ceil(sortedSites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSites = sortedSites.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBorough, selectedProgram, searchTerm, sortBy, sortOrder]);

  const pendingCount = changeRequests.filter((r: any) => r.status === 'pending').length;
  const adultEdCount = sites.filter((s) => s.category === 'adult-ed').length;
  const youthCount = sites.filter((s) => s.category === 'youth').length;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-d79-blue" />
          <p className="text-slate-600">Loading admin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginForm 
        onLogin={handleLogin}
        error={authError}
        password={password}
        setPassword={setPassword}
      />
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="page-shell space-y-6 py-8">
        <AdminHeader
          pendingRequestsCount={pendingCount}
          showChangeRequests={showChangeRequests}
          onToggleChangeRequests={() => {
            setShowChangeRequests(!showChangeRequests);
            if (!showChangeRequests) {
              fetchChangeRequests();
            }
          }}
          onLogout={handleLogout}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total sites</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{sites.length}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Adult / Youth</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {adultEdCount} <span className="text-base font-normal text-slate-400">/</span> {youthCount}
            </p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Missing coordinates</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{sitesWithoutCoords}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending requests</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{pendingCount}</p>
          </div>
        </div>

        {showChangeRequests && (
          <ChangeRequestsSection
            changeRequests={changeRequests}
            sites={sites}
            onReview={handleReviewChangeRequest}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/import"
            className="inline-flex items-center gap-2 rounded-lg bg-d79-navy px-3 py-2 text-sm font-medium text-white hover:bg-d79-blue"
          >
            <Upload className="h-4 w-4" />
            Import CSV with preview
          </Link>
          <button
            onClick={handleNormalizeAddresses}
            disabled={normalizingAddresses}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {normalizingAddresses ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {normalizingAddresses ? 'Normalizing...' : 'Normalize addresses'}
          </button>
        </div>

        {normalizeStatus && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              normalizeStatus.startsWith('✅') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {normalizeStatus}
          </div>
        )}

        <UploadSection
          onFileUpload={handleFileUpload}
          uploading={uploading}
          uploadStatus={uploadStatus}
        />

        <SearchAndFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showAutocomplete={showAutocomplete}
          onFocusAutocomplete={() => setShowAutocomplete(true)}
          onBlurAutocomplete={() => setTimeout(() => setShowAutocomplete(false), 200)}
          searchSuggestions={searchSuggestions}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedBorough={selectedBorough}
          onBoroughChange={setSelectedBorough}
          selectedProgram={selectedProgram}
          onProgramChange={setSelectedProgram}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderToggle={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          boroughs={boroughs}
          programs={programs}
          sitesWithoutCoords={sitesWithoutCoords}
          onClearFilters={() => {
            setSelectedCategory('all');
            setSelectedBorough('all');
            setSelectedProgram('all');
            setSearchTerm('');
          }}
          hasActiveFilters={hasActiveFilters}
          onGeocodeAll={handleGeocodeAll}
          geocodingAll={geocodingAll}
          onFillSupervisors={handleFillSupervisors}
          fillingSupervisors={fillingSupervisors}
          sitesMissingSupervisors={
            sites.filter(
              (s) =>
                Boolean((s.assistantPrincipal || '').trim()) &&
                !(s.siteSupervisor || '').trim() &&
                !(s.siteSupervisorPhone || '').trim()
            ).length
          }
          onExportPdf={handleExportPdf}
          onUpdateYouthStatus={handleUpdateYouthStatus}
          onGenerateDescriptionsBulk={handleGenerateDescriptionsBulk}
          generatingDescriptions={generatingDescriptions}
          descriptionCount={descriptionCount}
          onDescriptionCountChange={setDescriptionCount}
          sitesWithoutDescriptions={sites.filter(s => !s.description || s.description.trim() === '').length}
          selectedSitesCount={selectedSites.size}
          totalShown={sortedSites.length}
          totalSites={sites.length}
        />

        <SitesTable
          sites={paginatedSites}
          onDelete={handleDelete}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(column) => {
            if (sortBy === column) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(column);
              setSortOrder('asc');
            }
          }}
          selectedSites={selectedSites}
          onSelectSite={handleSelectSite}
          onSelectAll={handleSelectAll}
          allSitesWithoutDescriptions={sortedSites.filter(s => !s.description || s.description.trim() === '').map(s => s._id)}
        />

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Showing <span className="font-medium text-slate-900">{startIndex + 1}</span> to{' '}
              <span className="font-medium text-slate-900">{Math.min(endIndex, sortedSites.length)}</span> of{' '}
              <span className="font-medium text-slate-900">{sortedSites.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      currentPage === pageNum
                        ? 'bg-d79-navy text-white'
                        : 'border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {sortedSites.length === 0 && sites.length > 0 && (
          <div className="surface-card px-6 py-12 text-center">
            <p className="text-slate-500">No sites match these filters.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedBorough('all');
                setSelectedProgram('all');
                setSearchTerm('');
              }}
              className="mt-3 text-sm font-medium text-d79-blue hover:text-d79-navy"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

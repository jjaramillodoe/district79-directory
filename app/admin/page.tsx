'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, MapPin, Loader2 } from 'lucide-react';
import Footer from '@/components/Footer';
import AdminHeader from '@/components/admin/AdminHeader';
import LoginForm from '@/components/admin/LoginForm';
import UploadSection from '@/components/admin/UploadSection';
import SearchAndFilters from '@/components/admin/SearchAndFilters';
import SitesTable from '@/components/admin/SitesTable';
import ChangeRequestsSection from '@/components/admin/ChangeRequestsSection';

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
    if (!confirm('This will normalize all addresses in the database. Continue?')) {
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
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNormalizeStatus(
          `✅ Successfully normalized ${data.updated} addresses out of ${data.total} total`
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
    const sitesWithoutCoords = sites.filter(s => !s.latitude || !s.longitude).length;
    const totalSites = sites.length;
    
    if (sitesWithoutCoords === 0) {
      const shouldRegeocode = confirm(
        'All sites already have coordinates.\n\nWould you like to re-geocode all sites to update coordinates?\n\nThis will take several minutes due to rate limiting (1 per second).'
      );
      if (!shouldRegeocode) return;
    } else {
      if (!confirm(`This will geocode ${sitesWithoutCoords} site(s) without coordinates.\n\nThis may take several minutes due to rate limiting (1 per second).\n\nContinue?`)) {
        return;
      }
    }

    setGeocodingAll(true);
    setUploadStatus('Geocoding sites... This may take a few minutes.');

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
      if (!confirm(`This will generate descriptions for ${selectedSiteIds.length} selected site(s).\n\nThis may take several minutes due to API rate limiting.\n\nContinue?`)) {
        return;
      }
    } else {
      if (!confirm(`This will generate descriptions for ${descriptionCount} site(s) that don't have descriptions yet.\n\nThis may take several minutes due to API rate limiting.\n\nContinue?`)) {
        return;
      }
    }

    setGeneratingDescriptions(true);
    setUploadStatus(`Generating ${count} descriptions... This may take a few minutes.`);

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
    const { jsPDF } = require('jspdf');
    require('jspdf-autotable');
    
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let startY = 15;
    
    // Add logos and title on first page
    try {
      // Get page width once
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Fetch and add logos from public folder
      const [d79Logo, nycLogo] = await Promise.all([
        fetch('/images/d79logo.png').then(r => r.blob()).then(blob => URL.createObjectURL(blob)),
        fetch('/images/nycpublicshools.png').then(r => r.blob()).then(blob => URL.createObjectURL(blob))
      ]);
      
      // Add District 79 logo on the left
      doc.addImage(d79Logo, 'PNG', 20, startY, 40, 20);
      
      // Add NYC Public Schools logo on the right
      doc.addImage(nycLogo, 'PNG', pageWidth - 60, startY, 40, 20);
      
      startY += 25;
      
      // Executive Team Section - Centered and Enhanced
      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Team', pageWidth / 2, startY, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      startY += 10;
      
      // Center the team members
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const teamMembers = [
        { title: 'Superintendent', name: 'Glenda Esperance' },
        { title: 'Deputy Superintendent', name: 'Jerry Brito' },
        { title: 'Executive Director', name: 'Veronica Pichardo' },
        { title: 'Executive Director', name: 'Annette Knox' }
      ];
      
      teamMembers.forEach((member) => {
        const fullText = `${member.title}: ${member.name}`;
        doc.text(fullText, pageWidth / 2, startY, { align: 'center' });
        startY += 7;
      });
      
      startY += 12;
      
      // Divider line - centered and wider
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(30, startY, pageWidth - 30, startY);
      startY += 12;
      
    } catch (error) {
      console.error('Error adding header:', error);
    }
    
    // Group sites by program
    const groupedByProgram: Record<string, Site[]> = {};
    filteredSites.forEach(site => {
      if (!groupedByProgram[site.program]) {
        groupedByProgram[site.program] = [];
      }
      groupedByProgram[site.program].push(site);
    });
    
    // Sort program names alphabetically
    const sortedPrograms = Object.keys(groupedByProgram).sort();
    
    // Define table headers
    const headers = ['DBN', 'LCGMS', 'Site Name', 'Address', 'Hours', 'Assistant Principal'];
    
    // Process each program group
    sortedPrograms.forEach((program, programIndex) => {
      const programSites = groupedByProgram[program];
      const firstSite = programSites[0];
      
      // Add new page if needed (check if we have enough space)
      if (startY > 180) {
        doc.addPage();
        startY = 15;
      }
      
      // Program Title - Centered and styled
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      // Draw background rectangle for program title
      const titleHeight = 8;
      doc.setFillColor(37, 99, 235);
      doc.rect(20, startY - 5, pageWidth - 40, titleHeight, 'F');
      doc.text(program, pageWidth / 2, startY, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      startY += 8;
      
      // Principal and Email - Centered
      if (firstSite.principal || firstSite.principalEmail) {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const principalInfo = `Principal: ${firstSite.principal || 'N/A'}`;
        doc.setFont('helvetica', 'bold');
        doc.text(principalInfo, pageWidth / 2, startY, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        startY += 6;
        
        if (firstSite.principalEmail) {
          doc.setFontSize(10);
          doc.setTextColor(70, 130, 180);
          doc.text(`Email: ${firstSite.principalEmail}`, pageWidth / 2, startY, { align: 'center' });
          startY += 6;
        }
      }
      
      // Main Address - Centered
      if (firstSite.buildingAddress && firstSite.borough) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const addressText = `Main Address: ${firstSite.buildingAddress}, ${firstSite.borough} ${firstSite.zipCode || ''}`;
        doc.text(addressText, pageWidth / 2, startY, { align: 'center' });
        startY += 6;
      }
      
      startY += 4;
      
      // Create rows for this program
      const rows = programSites.map(site => {
        // Format hours - only show valid hours
        const hours = [];
        if (site.daytimeHours && site.daytimeHours !== 'N/A' && !site.daytimeHours.includes('undefined')) {
          hours.push(`Day: ${site.daytimeHours}`);
        }
        if (site.eveningHours && site.eveningHours !== 'N/A' && !site.eveningHours.includes('undefined')) {
          hours.push(`Eve: ${site.eveningHours}`);
        }
        if (site.saturdayHours && site.saturdayHours !== 'N/A' && !site.saturdayHours.includes('undefined')) {
          hours.push(`Sat: ${site.saturdayHours}`);
        }
        const hoursStr = hours.length > 0 ? hours.join(', ') : '';
        
        // Format assistant principal - handle multiple separated by /
        // Parse names and emails separately, then pair them
        let apDisplay = '';
        if (site.assistantPrincipal || site.apEmail) {
          const names = site.assistantPrincipal 
            ? site.assistantPrincipal.split('/').map(n => n.trim()).filter(Boolean)
            : [];
          const emails = site.apEmail
            ? site.apEmail.split('/').map(e => e.trim()).filter(Boolean)
            : [];
          
          if (names.length > 0 || emails.length > 0) {
            const maxLength = Math.max(names.length, emails.length);
            const apEntries = [];
            
            for (let i = 0; i < maxLength; i++) {
              const name = names[i] || '';
              const email = emails[i] || '';
              
              if (name && email) {
                apEntries.push(`${name}\n${email}`);
              } else if (name) {
                apEntries.push(name);
              } else if (email) {
                apEntries.push(email);
              }
            }
            
            apDisplay = apEntries.join('\n\n');
          } else {
            apDisplay = 'N/A';
          }
        } else {
          apDisplay = 'N/A';
        }
        
        return [
          site.dbn || 'N/A',
          site.lcgmsBuildingCode || 'N/A',
          site.siteName,
          `${site.buildingAddress || 'N/A'}, ${site.borough || ''} ${site.zipCode || ''}`.trim(),
          hoursStr || 'N/A',
          apDisplay
        ];
      });
      
      // Add table for this program
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: startY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        margin: { top: 5 },
        columnStyles: {
          5: { cellWidth: 'auto', overflow: 'linebreak' } // Assistant Principal column - allow multiline
        }
      });
      
      startY = (doc as any).lastAutoTable.finalY + 10;
    });
    
    // Save PDF
    doc.save('district79-sites.pdf');
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

  const sitesWithoutCoords = sites.filter(s => !s.latitude || !s.longitude).length;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
    <div>
      <div className="max-w-8xl mx-auto px-4 py-8">
        <AdminHeader
          pendingRequestsCount={changeRequests.filter((r: any) => r.status === 'pending').length}
          onToggleChangeRequests={() => {
            setShowChangeRequests(!showChangeRequests);
            if (!showChangeRequests) {
              fetchChangeRequests();
            }
          }}
          onLogout={handleLogout}
        />
        
        {/* Change Requests Section */}
        {showChangeRequests && (
          <ChangeRequestsSection
            changeRequests={changeRequests}
            sites={sites}
            onReview={handleReviewChangeRequest}
          />
        )}
        
        <div className="mb-6 flex gap-4 flex-wrap">
          <Link
            href="/admin/import"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-5 w-5 mr-2" />
            Import CSV with Preview
          </Link>
          
          <button
            onClick={handleNormalizeAddresses}
            disabled={normalizingAddresses}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {normalizingAddresses ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Normalizing...
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5 mr-2" />
                Normalize All Addresses
              </>
            )}
          </button>
        </div>

        {normalizeStatus && (
          <div className={`mb-4 p-4 rounded-lg ${
            normalizeStatus.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
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
          onExportPdf={handleExportPdf}
          onUpdateYouthStatus={handleUpdateYouthStatus}
          onGenerateDescriptionsBulk={handleGenerateDescriptionsBulk}
          generatingDescriptions={generatingDescriptions}
          descriptionCount={descriptionCount}
          onDescriptionCountChange={setDescriptionCount}
          sitesWithoutDescriptions={sites.filter(s => !s.description || s.description.trim() === '').length}
          selectedSitesCount={selectedSites.size}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, sortedSites.length)}</span> of{' '}
              <span className="font-medium">{sortedSites.length}</span> sites
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
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
                      className={`px-3 py-2 border rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {sortedSites.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {sites.length === 0 
                ? 'No sites found. Upload a CSV file to get started.'
                : 'No sites match your filters. Try adjusting your search criteria.'}
            </p>
          </div>
        )}

      </div>
      
      <Footer />
    </div>
  );
}


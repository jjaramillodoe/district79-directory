'use client';

import { useState, useEffect } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import SiteCard from '@/components/SiteCard';
import SitesTable from '@/components/SitesTable';
import ChangeRequestModal from '@/components/ChangeRequestModal';
import HeroSection from '@/components/HeroSection';
import FeaturesAccordion from '@/components/FeaturesAccordion';
import CopyEmailsButton from '@/components/CopyEmailsButton';
import SearchFilters from '@/components/SearchFilters';
import PdfExporter from '@/components/PdfExporter';
import ExcelExporter from '@/components/ExcelExporter';

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
  hasSaturdayProgram?: string;
  saturdayHours?: string;
  subject?: string;
  category: 'adult-ed' | 'youth';
  lcgmsBuildingCode?: string;
}

export default function Home() {
  const [sites, setSites] = useState<Site[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBorough, setSelectedBorough] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('siteName');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [pdfGroupBy, setPdfGroupBy] = useState<'none' | 'program'>('program');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [emailsCopied, setEmailsCopied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const boroughs = Array.from(new Set(sites.map(s => s.borough).filter(Boolean))).sort();
  const programs = Array.from(new Set(sites.map(s => s.program).filter(Boolean))).sort();
  
  // Search suggestions for autocomplete
  const searchSuggestions = searchTerm
    ? sites
        .filter(site =>
          site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.buildingAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.borough?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.dbn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.lcgmsBuildingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.siteSupervisor?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5)
        .map(site => ({
          label: site.siteName,
          subLabel: `${site.dbn || ''} ${site.lcgmsBuildingCode || ''}`.trim(),
          site
        }))
    : [];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/public/verify', {
        credentials: 'include', // Important: include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchSites(); // Only fetch sites if authenticated
        } else {
          // Not authenticated, redirect to login page
          window.location.href = '/';
        }
      } else {
        // Not authenticated, redirect to login page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('❌ Home page - Auth check error:', error);
      window.location.href = '/';
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      // Filter to show only open sites
      const openSites = data.filter((site: Site) => 
        site.status === 'Open'
      );
      setSites(openSites);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmails = async () => {
    // Collect all emails from filtered sites
    const emailSet = new Set<string>();
    
    sortedSites.forEach(site => {
      // Add principal email if it exists
      if (site.principalEmail) {
        const principalEmails = site.principalEmail.split('/').map(e => e.trim()).filter(Boolean);
        principalEmails.forEach(email => {
          if (email && email.includes('@')) {
            emailSet.add(email);
          }
        });
      }
      
      // Add assistant principal emails if they exist
      if (site.apEmail) {
        const apEmails = site.apEmail.split('/').map(e => e.trim()).filter(Boolean);
        apEmails.forEach(email => {
          if (email && email.includes('@')) {
            emailSet.add(email);
          }
        });
      }
    });
    
    // Convert to sorted array and join with semicolons for easy pasting into email clients
    const emailsArray = Array.from(emailSet).sort();
    const emailsString = emailsArray.join('; ');
    
    if (emailsArray.length === 0) {
      alert('No emails found in the filtered results.');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(emailsString);
      setEmailsCopied(true);
      setTimeout(() => setEmailsCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy emails:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = emailsString;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setEmailsCopied(true);
        setTimeout(() => setEmailsCopied(false), 3000);
      } catch (err) {
        alert('Failed to copy emails. Please try again.');
      }
      document.body.removeChild(textArea);
    }
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = !searchTerm || 
      site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.buildingAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.dbn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.lcgmsBuildingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.siteSupervisor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBorough = selectedBorough === 'all' || site.borough === selectedBorough;
    const matchesProgram = selectedProgram === 'all' || site.program === selectedProgram;
    const matchesCategory = selectedCategory === 'all' || site.category === selectedCategory;
    
    return matchesSearch && matchesBorough && matchesProgram && matchesCategory;
  });

  const sortedSites = [...filteredSites].sort((a, b) => {
    switch (sortBy) {
      case 'siteName':
        return a.siteName.localeCompare(b.siteName);
      case 'borough':
        return (a.borough || '').localeCompare(b.borough || '');
      case 'program':
        return a.program.localeCompare(b.program);
      default:
        return 0;
    }
  });

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedBorough !== 'all' ||
    selectedProgram !== 'all' ||
    selectedCategory !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBorough('all');
    setSelectedProgram('all');
    setSelectedCategory('all');
    setShowAutocomplete(false);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-d79-blue" />
          <p className="text-slate-600">Loading directory...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-d79-blue" />
          <p className="text-slate-600">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <HeroSection
        siteCount={sites.length}
        boroughCount={boroughs.length}
        programCount={programs.length}
      />

      <div className="page-shell space-y-6 py-6 sm:py-8">
        <div className="sticky top-[72px] z-30 bg-slate-50/95 pb-1 backdrop-blur">
          <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showAutocomplete={showAutocomplete}
          setShowAutocomplete={setShowAutocomplete}
          searchSuggestions={searchSuggestions as any}
          boroughs={boroughs as any}
          programs={programs as any}
          selectedBorough={selectedBorough}
          setSelectedBorough={setSelectedBorough}
          selectedProgram={selectedProgram}
          setSelectedProgram={setSelectedProgram}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          pdfGroupBy={pdfGroupBy}
          setPdfGroupBy={(v) => setPdfGroupBy(v)}
          totalShown={sortedSites.length}
          totalSites={sites.length}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          rightActions={
            <>
              <CopyEmailsButton copied={emailsCopied} onClick={handleCopyEmails} />
              <PdfExporter
                sites={sortedSites as any}
                pdfGroupBy={pdfGroupBy}
                selectedBorough={selectedBorough}
                selectedProgram={selectedProgram}
                selectedCategory={selectedCategory}
                searchTerm={searchTerm}
              />
              <ExcelExporter sites={sortedSites as any} />
            </>
          }
        />
        </div>

        <FeaturesAccordion open={accordionOpen} onToggle={() => setAccordionOpen(!accordionOpen)} />

        {sortedSites.length === 0 ? (
          <div className="surface-card px-6 py-16 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-lg font-medium text-slate-900">No sites match these filters</p>
            <p className="mt-1 text-sm text-slate-500">Try a different search term or clear the current filters.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-d79-navy px-4 py-2 text-sm font-medium text-white hover:bg-d79-blue"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sortedSites.map(site => (
              <SiteCard
                key={site._id}
                site={site as any}
                onReportChanges={(s) => {
                  setSelectedSite(s);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="surface-card overflow-hidden">
            <SitesTable sites={sortedSites as any} />
          </div>
        )}
      </div>

      {/* Change Request Modal */}
      {selectedSite && (
        <ChangeRequestModal
          site={selectedSite}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSite(null);
          }}
        />
      )}
    </div>
  );
}


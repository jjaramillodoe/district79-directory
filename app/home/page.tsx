'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';
import SiteCard from '@/components/SiteCard';
import SitesTable from '@/components/SitesTable';
import Footer from '@/components/Footer';
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
          site.lcgmsBuildingCode?.toLowerCase().includes(searchTerm.toLowerCase())
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
      console.log('🔍 Home page - Checking authentication...');
      const response = await fetch('/api/auth/public/verify', {
        credentials: 'include', // Important: include cookies
      });
      
      console.log('   - Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   - Response data:', data);
        
        if (data.authenticated) {
          console.log('✅ Home page - Authenticated, fetching sites');
          setIsAuthenticated(true);
          fetchSites(); // Only fetch sites if authenticated
        } else {
          console.log('❌ Home page - Not authenticated, redirecting to login');
          // Not authenticated, redirect to login page
          window.location.href = '/';
        }
      } else {
        console.log('❌ Home page - Response not OK, redirecting to login');
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
      site.lcgmsBuildingCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const handleExportPdf = async () => {
    const { jsPDF } = require('jspdf');
    require('jspdf-autotable');
    
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let startY = 15;
    
    // Add header with logos
    try {
      const pageWidth = doc.internal.pageSize.getWidth();
      
      const [d79Logo, nycLogo] = await Promise.all([
        fetch('/images/d79logo.png').then(r => r.blob()).then(blob => URL.createObjectURL(blob)),
        fetch('/images/nycpublicshools.png').then(r => r.blob()).then(blob => URL.createObjectURL(blob))
      ]);
      
      doc.addImage(d79Logo, 'PNG', 20, startY, 40, 20);
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
      
      // Add filter info if any filters are active
      const filters = [];
      if (selectedBorough !== 'all') filters.push(`Borough: ${selectedBorough}`);
      if (selectedProgram !== 'all') filters.push(`Program: ${selectedProgram}`);
      if (selectedCategory !== 'all') filters.push(`Category: ${selectedCategory === 'adult-ed' ? 'Adult Education' : 'Youth Programs'}`);
      if (searchTerm) filters.push(`Search: ${searchTerm}`);
      
      if (filters.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Filters: ${filters.join(' | ')}`, pageWidth / 2, startY, { align: 'center' });
        startY += 10;
      }
      
      startY += 5;
      
    } catch (error) {
      console.error('Error adding header:', error);
    }
    
    // Define table headers (same as admin)
    const headers = ['DBN', 'LCGMS', 'Site Name', 'Address', 'Hours', 'Assistant Principal'];
    
    if (pdfGroupBy === 'program') {
      // Group by program
      const groupedByProgram: Record<string, Site[]> = {};
      sortedSites.forEach(site => {
        if (!groupedByProgram[site.program]) {
          groupedByProgram[site.program] = [];
        }
        groupedByProgram[site.program].push(site);
      });
      
      const sortedPrograms = Object.keys(groupedByProgram).sort();
      
      sortedPrograms.forEach((program, programIndex) => {
        const programSites = groupedByProgram[program];
        const firstSite = programSites[0];
        
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
        
        // Create rows
        const rows = programSites.map(site => {
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
        
        (doc as any).autoTable({
          head: [headers],
          body: rows,
          startY: startY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235], textColor: 255 },
          margin: { top: 5 },
          columnStyles: {
            5: { cellWidth: 'auto', overflow: 'linebreak' } // Assistant Principal column (index 5) - allow multiline
          }
        });
        
        startY = (doc as any).lastAutoTable.finalY + 10;
      });
    } else {
      // Single list - no grouping
      if (startY > 180) {
        doc.addPage();
        startY = 15;
      }
      
      const rows = sortedSites.map(site => {
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
      
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: startY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        margin: { top: 5 },
        columnStyles: {
          5: { cellWidth: 'auto', overflow: 'linebreak' } // Assistant Principal column (index 5) - allow multiline
        }
      });
    }
    
    doc.save('district79-directory.pdf');
  };

  // Show loading state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching sites
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="mt-4 text-gray-600">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Hero Section */}
      <HeroSection />

      <main className="max-w-7xl mx-auto px-4 py-8 -mt-4">
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

        {/* Features and How to Use Section - Accordion */}
        <FeaturesAccordion open={accordionOpen} onToggle={() => setAccordionOpen(!accordionOpen)} />

        {/* Results */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <SitesTable sites={sortedSites as any} />
        )}

        {sortedSites.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No sites found matching your criteria.</p>
          </div>
        )}

        {/* Admin Link - Floating Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <a href="/admin" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 transform hover:scale-110 transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
            Admin
          </a>
        </div>
      </main>
      
      <Footer />

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


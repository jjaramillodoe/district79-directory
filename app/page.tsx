'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import Footer from '@/components/Footer';
import ChangeRequestModal from '@/components/ChangeRequestModal';

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
    fetchSites();
  }, []);

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
      
      //doc.setFontSize(20);
      //doc.setTextColor(37, 99, 235);
      //doc.text('DISTRICT 79', pageWidth / 2 - 20, startY, { align: 'center' });
      //startY += 8;
      
      //doc.setFontSize(14);
      //doc.setTextColor(0, 0, 0);
      //doc.text('Adult Education & Youth Programs Directory', pageWidth / 2, startY, { align: 'center' });
      //startY += 8;
      
      //doc.setFontSize(10);
      //doc.setTextColor(100, 100, 100);
      //doc.text('New York City Department of Education', pageWidth / 2, startY, { align: 'center' });
      //startY += 20;
      
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight">District 79 Directory</h1>
            <p className="text-blue-100 text-xl mb-2">Adult Education & Youth Programs</p>
            <div className="inline-block mt-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm">
              Serving students across New York City
            </div>
          </div>
          
          {/* Executive Team Section - Modern Cards */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Executive Leadership</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <p className="font-bold text-lg mb-1">Superintendent</p>
                  <p className="text-blue-100 text-sm">Glenda Esperance</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <p className="font-bold text-lg mb-1">Deputy Superintendent</p>
                  <p className="text-blue-100 text-sm">Jerry Brito</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <p className="font-bold text-lg mb-1">Executive Director</p>
                  <p className="text-blue-100 text-sm">Veronica Pichardo</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <p className="font-bold text-lg mb-1">Executive Director</p>
                  <p className="text-blue-100 text-sm">Annette Knox</p>
                </div>
              </div>
          </div>
        </div>
        {/* Wave Divider */}
        <div className="absolute bottom-0 w-full">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L60 10C120 20 240 40 360 53.3C480 67 600 73 720 70C840 67 960 53 1080 48C1200 43 1320 47 1380 49.3L1440 51.3V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white"/>
          </svg>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8 -mt-4">
        {/* Search and Filters - Modern Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="space-y-4">
            {/* Search Bar with Autocomplete */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search sites, addresses, programs, DBN, or LCGMS code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && searchSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSearchTerm(suggestion.site.siteName);
                        setShowAutocomplete(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{suggestion.label}</div>
                      {suggestion.subLabel && (
                        <div className="text-xs text-gray-500 mt-1">
                          {suggestion.site.dbn && <span>DBN: {suggestion.site.dbn}</span>}
                          {suggestion.site.dbn && suggestion.site.lcgmsBuildingCode && <span> • </span>}
                          {suggestion.site.lcgmsBuildingCode && <span>LCGMS: {suggestion.site.lcgmsBuildingCode}</span>}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Borough</label>
                <select
                  value={selectedBorough}
                  onChange={(e) => setSelectedBorough(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Boroughs</option>
                  {boroughs.map(borough => (
                    <option key={borough} value={borough}>{borough}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Programs</option>
                  {programs.slice(0, 20).map(program => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="siteName">Name</option>
                  <option value="borough">Borough</option>
                  <option value="program">Program</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Showing {sortedSites.length} of {sites.length} sites
            </div>

            {/* View Toggle and PDF Export */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  title="Grid View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  title="List View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">PDF Group By:</label>
                  <select
                    value={pdfGroupBy}
                    onChange={(e) => setPdfGroupBy(e.target.value as 'none' | 'program')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="program">By Program</option>
                    <option value="none">Single List</option>
                  </select>
                </div>
                <button
                  onClick={handleCopyEmails}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors relative"
                  title="Copy principal and assistant principal emails from filtered results"
                >
                  {emailsCopied ? (
                    <>
                      <Check className="h-5 w-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      Copy Emails
                    </>
                  )}
                </button>
                <button
                  onClick={handleExportPdf}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features and How to Use Section - Accordion */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <button
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-semibold text-gray-900">Features & How to Use</h2>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 text-gray-500 transform transition-transform ${accordionOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {accordionOpen && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                  Search & Filter Features
                </h3>
                <ul className="space-y-2 text-gray-600 ml-7">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>Search:</strong> Search by site name, address, program, borough, DBN, or LCGMS code. Use the autocomplete dropdown for quick suggestions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>Filters:</strong> Narrow results by borough, program, or category (Adult Education/Youth Programs).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>Sort:</strong> Sort results by site name, borough, or program in ascending or descending order.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>View Toggle:</strong> Switch between grid view (cards) and list view (table) for different ways to browse sites.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export to PDF
                </h3>
                <ul className="space-y-2 text-gray-600 ml-7">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">•</span>
                    <span><strong>Group by Program:</strong> </span> Export sites grouped by program with program details (principal, email, main address) at the top of each group.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">•</span>
                    <span><strong>Single List:</strong> Export all filtered results as a single list without grouping.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">•</span>
                    <span><strong>Current Filters:</strong> The PDF will include your current search filters and only export sites matching your criteria.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Report Changes
                </h3>
                <ul className="space-y-2 text-gray-600 ml-7">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold mt-1">•</span>
                    <span><strong>Submit Updates:</strong> Found incorrect information? Click "Report Changes" on any site card to submit updates for phone numbers, hours, and times.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold mt-1">•</span>
                    <span><strong>Review Process:</strong> All change requests are reviewed by administrators before being applied to ensure data accuracy.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold mt-1">•</span>
                    <span><strong>Contact Info:</strong> Include your name and email when submitting changes so administrators can contact you if needed.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Quick Tips
                </h3>
                <ul className="space-y-2 text-gray-600 ml-7">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-1">•</span>
                    <span>Use the search bar to quickly find sites by name, DBN, or LCGMS code.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-1">•</span>
                    <span>Combine filters to narrow down results (e.g., search for a specific program in a particular borough).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-1">•</span>
                    <span>Export your filtered results as a PDF for offline access or printing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-1">•</span>
                    <span>Click on phone numbers to call directly from your device.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSites.map(site => (
            <div key={site._id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:scale-105">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{site.siteName}</h3>
                {site.status && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    site.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {site.status}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <span>{site.program}</span>
                </div>

                {site.buildingAddress && (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{site.buildingAddress}</span>
                  </div>
                )}

                {site.borough && (
                  <div className="text-gray-500">
                    {site.borough}, NY {site.zipCode}
                  </div>
                )}

                {site.businessPhone && (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <a href={`tel:${site.businessPhone}`} className="hover:text-blue-600">
                      {site.businessPhone}
                    </a>
                  </div>
                )}
              </div>

              {/* Hours Section - Only show if there are valid hours */}
              {(() => {
                const validHours = [];
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
                      <div className="text-xs text-gray-400 italic">No hours available</div>
                    </div>
                  );
                }
              })()}

              {/* Report Changes Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedSite(site);
                    setIsModalOpen(true);
                  }}
                  className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Report Changes
                </button>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borough</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedSites.map(site => (
                    <tr key={site._id} className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{site.siteName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{site.program}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {site.buildingAddress && (
                          <div>
                            <div>{site.buildingAddress}</div>
                            <div className="text-gray-400">{site.borough}, NY {site.zipCode}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{site.borough}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {site.businessPhone && (
                          <a href={`tel:${site.businessPhone}`} className="text-blue-600 hover:text-blue-800">
                            {site.businessPhone}
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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


import React from 'react';

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
  category: 'adult-ed' | 'youth';
  lcgmsBuildingCode?: string;
}

interface Props {
  sites: Site[];
  pdfGroupBy: 'none' | 'program';
  selectedBorough: string;
  selectedProgram: string;
  selectedCategory: string;
  searchTerm: string;
}

export default function PdfExporter({ sites, pdfGroupBy, selectedBorough, selectedProgram, selectedCategory, searchTerm }: Props) {
  const handleExport = async () => {
    const { jsPDF } = require('jspdf');
    require('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let startY = 15;

    try {
      const pageWidth = doc.internal.pageSize.getWidth();
      const [d79Logo, nycLogo] = await Promise.all([
        fetch('/images/d79logo.png').then((r: any) => r.blob()).then((blob: any) => URL.createObjectURL(blob)),
        fetch('/images/nycpublicshools.png').then((r: any) => r.blob()).then((blob: any) => URL.createObjectURL(blob)),
      ]);

      doc.addImage(d79Logo, 'PNG', 20, startY, 40, 20);
      doc.addImage(nycLogo, 'PNG', pageWidth - 60, startY, 40, 20);
      startY += 25;

      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Team', pageWidth / 2, startY, { align: 'center' } as any);
      doc.setFont('helvetica', 'normal');
      startY += 10;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const teamMembers = [
        { title: 'Superintendent', name: 'Glenda Esperance' },
        { title: 'Deputy Superintendent', name: 'Jerry Brito' },
        { title: 'Executive Director', name: 'Veronica Pichardo' },
        { title: 'Executive Director', name: 'Annette Knox' },
        { title: 'Director of Student Services', name: 'Ben Maeda' }
      ];
      teamMembers.forEach((m) => {
        const fullText = `${m.title}: ${m.name}`;
        doc.text(fullText, pageWidth / 2, startY, { align: 'center' } as any);
        startY += 7;
      });
      startY += 12;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(30, startY, pageWidth - 30, startY);
      startY += 12;

      const filters: string[] = [];
      if (selectedBorough !== 'all') filters.push(`Borough: ${selectedBorough}`);
      if (selectedProgram !== 'all') filters.push(`Program: ${selectedProgram}`);
      if (selectedCategory !== 'all') filters.push(`Category: ${selectedCategory === 'adult-ed' ? 'Adult Education' : 'Youth Programs'}`);
      if (searchTerm) filters.push(`Search: ${searchTerm}`);
      if (filters.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Filters: ${filters.join(' | ')}`, pageWidth / 2, startY, { align: 'center' } as any);
        startY += 10;
      }
      startY += 5;
    } catch {}

    const headers = ['DBN', 'LCGMS', 'Site Name', 'Address', 'Hours', 'Assistant Principal'];

    const addRows = (rows: any[]) => {
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: startY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        margin: { top: 5 },
        columnStyles: { 5: { cellWidth: 'auto', overflow: 'linebreak' } },
      });
      startY = (doc as any).lastAutoTable.finalY + 10;
    };

    const buildRow = (site: Site) => {
      const hours: string[] = [];
      if (site.daytimeHours && site.daytimeHours !== 'N/A' && !site.daytimeHours.includes('undefined')) hours.push(`Day: ${site.daytimeHours}`);
      if (site.eveningHours && site.eveningHours !== 'N/A' && !site.eveningHours.includes('undefined')) hours.push(`Eve: ${site.eveningHours}`);
      if (site.saturdayHours && site.saturdayHours !== 'N/A' && !site.saturdayHours.includes('undefined')) hours.push(`Sat: ${site.saturdayHours}`);
      const hoursStr = hours.length > 0 ? hours.join(', ') : '';

      let apDisplay = 'N/A';
      if (site.assistantPrincipal || site.apEmail) {
        const names = site.assistantPrincipal ? site.assistantPrincipal.split('/').map((n) => n.trim()).filter(Boolean) : [];
        const emails = site.apEmail ? site.apEmail.split('/').map((e) => e.trim()).filter(Boolean) : [];
        const maxLength = Math.max(names.length, emails.length);
        if (maxLength > 0) {
          const apEntries: string[] = [];
          for (let i = 0; i < maxLength; i++) {
            const name = names[i] || '';
            const email = emails[i] || '';
            if (name && email) apEntries.push(`${name}\n${email}`);
            else if (name) apEntries.push(name);
            else if (email) apEntries.push(email);
          }
          apDisplay = apEntries.join('\n\n');
        }
      }

      return [
        site.dbn || 'N/A',
        site.lcgmsBuildingCode || 'N/A',
        site.siteName,
        `${site.buildingAddress || 'N/A'}, ${site.borough || ''} ${site.zipCode || ''}`.trim(),
        hoursStr || 'N/A',
        apDisplay,
      ];
    };

    const addSectionHeader = (programName: string, principalName?: string, principalEmail?: string, phoneNumber?: string) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      if (startY > 180) { doc.addPage(); startY = 15; }
      
      // Main title with program name
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      const titleHeight = 8;
      doc.setFillColor(37, 99, 235);
      doc.rect(20, startY - 5, pageWidth - 40, titleHeight, 'F');
      doc.text(programName, pageWidth / 2, startY, { align: 'center' } as any);
      doc.setFont('helvetica', 'normal');
      startY += 8;

      // Principal info below the title
      const infoLines: string[] = [];
      if (principalName && principalName !== 'No Principal') {
        infoLines.push(`Principal: ${principalName}`);
      }
      if (principalEmail) {
        infoLines.push(`Email: ${principalEmail}`);
      }
      if (phoneNumber) {
        infoLines.push(`Phone: ${phoneNumber}`);
      }

      if (infoLines.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        infoLines.forEach((line, index) => {
          doc.text(line, pageWidth / 2, startY + (index * 5), { align: 'center' } as any);
        });
        startY += (infoLines.length * 5) + 5;
      } else {
        startY += 3;
      }
    };

    // Helper function to group sites by principal and add sections
    const groupByPrincipalAndAddSections = (programName: string, programSites: Site[]) => {
      const principalGroups: Record<string, Site[]> = {};
      programSites.forEach((site) => {
        const principalKey = site.principal || 'No Principal';
        principalGroups[principalKey] = principalGroups[principalKey] || [];
        principalGroups[principalKey].push(site);
      });
      
      const sortedPrincipals = Object.keys(principalGroups).sort();
      sortedPrincipals.forEach((principal) => {
        const principalSites = principalGroups[principal];
        const firstSite = principalSites[0];
        
        // Get principal email (handle multiple emails separated by /)
        let principalEmail = firstSite.principalEmail;
        if (principalEmail && principalEmail.includes('/')) {
          principalEmail = principalEmail.split('/')[0].trim();
        }
        
        // Get phone number from first site
        const phoneNumber = firstSite.businessPhone;
        
        const sectionTitle = principal === 'No Principal' 
          ? programName 
          : `${programName} - ${principal}`;
        
        addSectionHeader(sectionTitle, principal === 'No Principal' ? undefined : principal, principalEmail, phoneNumber);
        addRows(principalSites.map(buildRow));
      });
    };

    if (pdfGroupBy === 'program') {
      const grouped: Record<string, Site[]> = {};
      sites.forEach((s) => {
        grouped[s.program] = grouped[s.program] || [];
        grouped[s.program].push(s);
      });
      const sortedPrograms = Object.keys(grouped).sort();
      sortedPrograms.forEach((program) => {
        const programSites = grouped[program];
        
        // Special handling for programs that should be split by principal name
        // Passages Academy, Pathways to Graduation, Path to Graduation, Alternative Learning Centers
        if (program === 'Passages Academy' || program === 'Pathways to Graduation' || program === 'Path to Graduation' || program === 'Alternate Learning Centers') {
          groupByPrincipalAndAddSections(program, programSites);
        } else {
          // Regular program grouping
          const firstSite = programSites[0];
          
          // Get principal email (handle multiple emails separated by /)
          let principalEmail = firstSite.principalEmail;
          if (principalEmail && principalEmail.includes('/')) {
            principalEmail = principalEmail.split('/')[0].trim();
          }
          
          // Get phone number from first site
          const phoneNumber = firstSite.businessPhone;
          const principalName = firstSite.principal;
          
          addSectionHeader(program, principalName, principalEmail, phoneNumber);
          addRows(programSites.map(buildRow));
        }
      });
    } else {
      if (startY > 180) { doc.addPage(); startY = 15; }
      addRows(sites.map(buildRow));
    }

    doc.save('district79-directory.pdf');
  };

  return (
    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Export PDF
    </button>
  );
}



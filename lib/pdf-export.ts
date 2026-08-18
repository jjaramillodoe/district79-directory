import { parseNamedPhones } from '@/lib/staff';

export type PdfSite = {
  _id: string;
  dbn: string;
  program: string;
  siteName: string;
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
  lcgmsBuildingCode?: string;
};

export type PdfExportOptions = {
  sites: PdfSite[];
  groupBy?: 'none' | 'program';
  selectedBorough?: string;
  selectedProgram?: string;
  selectedCategory?: string;
  searchTerm?: string;
};

const NAVY: [number, number, number] = [0, 63, 135];
const SLATE: [number, number, number] = [248, 250, 252];
const LINE: [number, number, number] = [226, 232, 240];

async function toDataUrl(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function hoursLabel(site: PdfSite): string {
  const hours: string[] = [];
  if (site.daytimeHours && site.daytimeHours !== 'N/A' && !site.daytimeHours.includes('undefined')) {
    hours.push(`Day: ${site.daytimeHours}`);
  }
  if (site.eveningHours && site.eveningHours !== 'N/A' && !site.eveningHours.includes('undefined')) {
    hours.push(`Eve: ${site.eveningHours}`);
  }
  if (site.saturdayHours && site.saturdayHours !== 'N/A' && !site.saturdayHours.includes('undefined')) {
    hours.push(`Sat: ${site.saturdayHours}`);
  }
  return hours.join('\n') || '—';
}

function apLabel(site: PdfSite): string {
  const names = site.assistantPrincipal
    ? site.assistantPrincipal.split('/').map((n) => n.trim()).filter(Boolean)
    : [];
  const emails = site.apEmail ? site.apEmail.split('/').map((e) => e.trim()).filter(Boolean) : [];
  const max = Math.max(names.length, emails.length);
  if (max === 0) return '—';
  return Array.from({ length: max }, (_, i) => {
    const name = names[i] || '';
    const email = emails[i] || '';
    if (name && email) return `${name}\n${email}`;
    return name || email;
  }).join('\n');
}

function supervisorLabel(site: PdfSite): string {
  const supervisors = parseNamedPhones(site.siteSupervisor, site.siteSupervisorPhone);
  if (supervisors.length === 0) return '—';
  return supervisors.map((s) => [s.name, s.phone].filter(Boolean).join('\n')).join('\n');
}

function addressLabel(site: PdfSite): string {
  const street = (site.buildingAddress || '').trim();
  const cityLine = [site.borough, site.zipCode].filter(Boolean).join(' ');
  if (street && cityLine) return `${street}\n${cityLine}`;
  return street || cityLine || '—';
}

function firstEmail(value?: string) {
  if (!value) return undefined;
  return value.includes('/') ? value.split('/')[0].trim() : value;
}

export async function downloadDirectoryPdf({
  sites,
  groupBy = 'program',
  selectedBorough = 'all',
  selectedProgram = 'all',
  selectedCategory = 'all',
  searchTerm = '',
}: PdfExportOptions) {
  const { jsPDF } = require('jspdf');
  require('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  let startY = 12;

  try {
    const [d79Logo, nycLogo] = await Promise.all([
      toDataUrl('/images/d79logo.png'),
      toDataUrl('/images/nycpublicshools.png'),
    ]);
    doc.addImage(d79Logo, 'PNG', marginX, startY, 36, 16);
    doc.addImage(nycLogo, 'PNG', pageWidth - marginX - 36, startY, 36, 16);
  } catch (error) {
    console.error('Error adding PDF logos:', error);
  }
  startY += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text('District 79 Directory', pageWidth / 2, startY, { align: 'center' });
  startY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text('Executive Team', pageWidth / 2, startY, { align: 'center' });
  startY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const team = [
    'Superintendent: Glenda Esperance',
    'Deputy Superintendent: Jerry Brito',
    'Executive Directors: Veronica Pichardo, Annette Knox',
    'Director of Student Services: Ben Meade',
  ];
  team.forEach((line) => {
    doc.text(line, pageWidth / 2, startY, { align: 'center' });
    startY += 4;
  });

  const filters: string[] = [];
  if (selectedBorough !== 'all') filters.push(`Borough: ${selectedBorough}`);
  if (selectedProgram !== 'all') filters.push(`Program: ${selectedProgram}`);
  if (selectedCategory !== 'all') {
    filters.push(`Category: ${selectedCategory === 'adult-ed' ? 'Adult Education' : 'Youth Programs'}`);
  }
  if (searchTerm) filters.push(`Search: ${searchTerm}`);
  if (filters.length > 0) {
    startY += 2;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(filters.join('  ·  '), pageWidth / 2, startY, { align: 'center' });
    startY += 4;
  }

  startY += 4;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.4);
  doc.line(marginX, startY, pageWidth - marginX, startY);
  startY += 6;

  const headers = ['DBN', 'LCGMS', 'Site Name', 'Address', 'Hours', 'Assistant Principal', 'Site Supervisor'];

  const usableWidth = pageWidth - marginX * 2;
  const columnStyles = {
    0: { cellWidth: 18 },
    1: { cellWidth: 16 },
    2: { cellWidth: 46 },
    3: { cellWidth: 48 },
    4: { cellWidth: 30 },
    5: { cellWidth: 58 },
    6: { cellWidth: usableWidth - 216 },
  };

  const buildRow = (site: PdfSite) => [
    site.dbn || '—',
    site.lcgmsBuildingCode || '—',
    site.siteName,
    addressLabel(site),
    hoursLabel(site),
    apLabel(site),
    supervisorLabel(site),
  ];

  const addTable = (rows: string[][]) => {
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY,
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        valign: 'top',
        overflow: 'linebreak',
        lineColor: LINE,
        lineWidth: 0.15,
        textColor: [15, 23, 42],
      },
      headStyles: {
        fillColor: NAVY,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        valign: 'middle',
      },
      alternateRowStyles: { fillColor: SLATE },
      columnStyles,
      margin: { top: 14, left: marginX, right: marginX, bottom: 14 },
      didDrawPage: (data: { pageNumber: number }) => {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `District 79 Directory  ·  Page ${data.pageNumber}`,
          pageWidth / 2,
          pageHeight - 7,
          { align: 'center' }
        );
      },
    });
    startY = (doc as any).lastAutoTable.finalY + 8;
  };

  const addSectionHeader = (title: string, principal?: string, email?: string, phone?: string) => {
    if (startY > pageHeight - 42) {
      doc.addPage();
      startY = 14;
    }

    doc.setFillColor(...NAVY);
    doc.roundedRect(marginX, startY, pageWidth - marginX * 2, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(title, pageWidth / 2, startY + 5.4, { align: 'center' });
    startY += 11;

    const details = [
      principal && principal !== 'No Principal' ? `Principal: ${principal}` : '',
      email ? `Email: ${email}` : '',
      phone ? `Phone: ${phone}` : '',
    ].filter(Boolean);

    if (details.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(details.join('   ·   '), pageWidth / 2, startY, { align: 'center' });
      startY += 5;
    }
  };

  const splitByPrincipal = new Set([
    'Passages Academy',
    'Pathways to Graduation',
    'Path to Graduation',
    'Alternate Learning Centers',
  ]);

  const addProgram = (programName: string, programSites: PdfSite[], splitPrincipal: boolean) => {
    if (!splitPrincipal) {
      const first = programSites[0];
      addSectionHeader(programName, first?.principal, firstEmail(first?.principalEmail), first?.businessPhone);
      addTable(programSites.map(buildRow));
      return;
    }

    const groups: Record<string, PdfSite[]> = {};
    programSites.forEach((site) => {
      const key = site.principal || 'No Principal';
      groups[key] = groups[key] || [];
      groups[key].push(site);
    });

    Object.keys(groups)
      .sort()
      .forEach((principal) => {
        const group = groups[principal];
        const first = group[0];
        const title = principal === 'No Principal' ? programName : `${programName} — ${principal}`;
        addSectionHeader(title, principal === 'No Principal' ? undefined : principal, firstEmail(first.principalEmail), first.businessPhone);
        addTable(group.map(buildRow));
      });
  };

  if (groupBy === 'program') {
    const grouped: Record<string, PdfSite[]> = {};
    sites.forEach((site) => {
      grouped[site.program] = grouped[site.program] || [];
      grouped[site.program].push(site);
    });
    Object.keys(grouped)
      .sort()
      .forEach((program) => addProgram(program, grouped[program], splitByPrincipal.has(program)));
  } else {
    addTable(sites.map(buildRow));
  }

  doc.save('district79-directory.pdf');
}

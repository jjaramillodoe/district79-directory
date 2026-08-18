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
  hasSaturdayProgram?: string;
  saturdayHours?: string;
  category: 'adult-ed' | 'youth';
  lcgmsBuildingCode?: string;
}

interface Props {
  sites: Site[];
}

export default function ExcelExporter({ sites }: Props) {
  const handleExport = async () => {
    const XLSX = await import('xlsx');

    // Headers match PDF
    const headers = ['DBN', 'LCGMS', 'Site Name', 'Address', 'Hours', 'Assistant Principal', 'Site Supervisor'];

    const rows = sites.map((site) => {
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
            const email = (emails[i] || '').toLowerCase();
            if (name && email) apEntries.push(`${name} - ${email}`);
            else if (name) apEntries.push(name);
            else if (email) apEntries.push(email);
          }
          apDisplay = apEntries.join('\n');
        }
      }

      const address = `${site.buildingAddress || 'N/A'}, ${site.borough || ''} ${site.zipCode || ''}`.trim();

      const supervisors = parseNamedPhones(site.siteSupervisor, site.siteSupervisorPhone);
      const supervisorDisplay =
        supervisors.length > 0
          ? supervisors.map((s) => [s.name, s.phone].filter(Boolean).join(' - ')).join('\n')
          : 'N/A';

      return [
        site.dbn || 'N/A',
        site.lcgmsBuildingCode || 'N/A',
        site.siteName,
        address,
        hoursStr || 'N/A',
        apDisplay,
        supervisorDisplay,
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites');
    XLSX.writeFile(workbook, 'district79-directory.xlsx');
  };

  return (
    <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Export Excel
    </button>
  );
}



'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { downloadDirectoryPdf, type PdfSite } from '@/lib/pdf-export';

interface Props {
  sites: PdfSite[];
  pdfGroupBy: 'none' | 'program';
  selectedBorough: string;
  selectedProgram: string;
  selectedCategory: string;
  searchTerm: string;
}

export default function PdfExporter({
  sites,
  pdfGroupBy,
  selectedBorough,
  selectedProgram,
  selectedCategory,
  searchTerm,
}: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadDirectoryPdf({
        sites,
        groupBy: pdfGroupBy,
        selectedBorough,
        selectedProgram,
        selectedCategory,
        searchTerm,
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Could not export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting || sites.length === 0}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
      {exporting ? 'Exporting...' : 'Export PDF'}
    </button>
  );
}

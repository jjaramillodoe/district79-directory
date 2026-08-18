import { type ReactNode } from 'react';
import { LayoutGrid, List, Search, X } from 'lucide-react';

interface SiteMinimal {
  siteName: string;
  dbn?: string;
  lcgmsBuildingCode?: string;
}

interface SearchSuggestion {
  label: string;
  subLabel?: string;
  site: SiteMinimal;
}

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  showAutocomplete: boolean;
  setShowAutocomplete: (v: boolean) => void;
  searchSuggestions: SearchSuggestion[];

  boroughs: string[];
  programs: string[];
  selectedBorough: string;
  setSelectedBorough: (v: string) => void;
  selectedProgram: string;
  setSelectedProgram: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  pdfGroupBy: 'none' | 'program';
  setPdfGroupBy: (v: 'none' | 'program') => void;
  totalShown: number;
  totalSites: number;
  rightActions?: ReactNode;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export default function SearchFilters(props: Props) {
  const {
    searchTerm,
    setSearchTerm,
    showAutocomplete,
    setShowAutocomplete,
    searchSuggestions,
    boroughs,
    programs,
    selectedBorough,
    setSelectedBorough,
    selectedProgram,
    setSelectedProgram,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    pdfGroupBy,
    setPdfGroupBy,
    totalShown,
    totalSites,
    rightActions,
    hasActiveFilters,
    onClearFilters,
  } = props;

  return (
    <div id="directory" className="surface-card p-5 sm:p-6">
      <div className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by site, address, program, DBN, or LCGMS code"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowAutocomplete(true);
            }}
            onFocus={() => setShowAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-d79-blue focus:outline-none focus:ring-2 focus:ring-d79-blue/20"
          />

          {showAutocomplete && searchSuggestions.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.label}-${index}`}
                  type="button"
                  onClick={() => {
                    setSearchTerm(suggestion.site.siteName);
                    setShowAutocomplete(false);
                  }}
                  className="w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-d79-sky"
                >
                  <div className="font-medium text-slate-900">{suggestion.label}</div>
                  {suggestion.subLabel && (
                    <div className="mt-1 text-xs text-slate-500">
                      {suggestion.site.dbn && <span>DBN: {suggestion.site.dbn}</span>}
                      {suggestion.site.dbn && suggestion.site.lcgmsBuildingCode && <span> · </span>}
                      {suggestion.site.lcgmsBuildingCode && (
                        <span>LCGMS: {suggestion.site.lcgmsBuildingCode}</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Borough
            </label>
            <select value={selectedBorough} onChange={(e) => setSelectedBorough(e.target.value)} className="select-field">
              <option value="all">All boroughs</option>
              {boroughs.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Program
            </label>
            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="select-field">
              <option value="all">All programs</option>
              {programs.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Category
            </label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="select-field">
              <option value="all">All categories</option>
              <option value="adult-ed">Adult Education</option>
              <option value="youth">Youth Programs</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Sort by
            </label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-field">
              <option value="siteName">Name</option>
              <option value="borough">Borough</option>
              <option value="program">Program</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{totalShown}</span> of {totalSites} sites
            </p>
            {hasActiveFilters && onClearFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-2 ${viewMode === 'grid' ? 'bg-d79-navy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-md p-2 ${viewMode === 'list' ? 'bg-d79-navy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              PDF group
              <select
                value={pdfGroupBy}
                onChange={(e) => setPdfGroupBy(e.target.value as 'none' | 'program')}
                className="select-field w-auto py-1.5"
              >
                <option value="program">By program</option>
                <option value="none">Single list</option>
              </select>
            </label>
            {rightActions}
          </div>
        </div>
      </div>
    </div>
  );
}

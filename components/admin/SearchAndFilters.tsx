'use client';

import { ArrowUpDown, Download, Loader2, MapPin, Search, Sparkles, Users, X } from 'lucide-react';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showAutocomplete: boolean;
  onFocusAutocomplete: () => void;
  onBlurAutocomplete: () => void;
  searchSuggestions: string[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedBorough: string;
  onBoroughChange: (value: string) => void;
  selectedProgram: string;
  onProgramChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderToggle: () => void;
  boroughs: (string | undefined)[];
  programs: string[];
  sitesWithoutCoords: number;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onGeocodeAll: () => void;
  geocodingAll: boolean;
  onExportPdf: () => void;
  onUpdateYouthStatus?: () => void;
  onFillSupervisors?: () => void;
  fillingSupervisors?: boolean;
  sitesMissingSupervisors?: number;
  onGenerateDescriptionsBulk?: () => void;
  generatingDescriptions?: boolean;
  descriptionCount?: number;
  onDescriptionCountChange?: (count: number) => void;
  sitesWithoutDescriptions?: number;
  selectedSitesCount?: number;
  totalShown?: number;
  totalSites?: number;
}

const toolButton =
  'inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

export default function SearchAndFilters({
  searchTerm,
  onSearchChange,
  showAutocomplete,
  onFocusAutocomplete,
  onBlurAutocomplete,
  searchSuggestions,
  selectedCategory,
  onCategoryChange,
  selectedBorough,
  onBoroughChange,
  selectedProgram,
  onProgramChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
  boroughs,
  programs,
  sitesWithoutCoords,
  onClearFilters,
  hasActiveFilters,
  onGeocodeAll,
  geocodingAll,
  onExportPdf,
  onUpdateYouthStatus,
  onFillSupervisors,
  fillingSupervisors = false,
  sitesMissingSupervisors = 0,
  onGenerateDescriptionsBulk,
  generatingDescriptions,
  descriptionCount = 10,
  onDescriptionCountChange,
  sitesWithoutDescriptions = 0,
  selectedSitesCount = 0,
  totalShown,
  totalSites,
}: SearchAndFiltersProps) {
  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onFocusAutocomplete();
            }}
            onFocus={onFocusAutocomplete}
            onBlur={onBlurAutocomplete}
            placeholder="Search by site, program, address, borough, or principal"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-d79-blue focus:outline-none focus:ring-2 focus:ring-d79-blue/20"
          />

          {showAutocomplete && searchSuggestions.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion}-${index}`}
                  type="button"
                  onClick={() => {
                    onSearchChange(suggestion);
                    onBlurAutocomplete();
                  }}
                  className="w-full border-b border-slate-100 px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-d79-sky"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Category
            </label>
            <select value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)} className="select-field">
              <option value="all">All categories</option>
              <option value="adult-ed">Adult Education</option>
              <option value="youth">Youth Programs</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Borough
            </label>
            <select value={selectedBorough} onChange={(e) => onBoroughChange(e.target.value)} className="select-field">
              <option value="all">All boroughs</option>
              {boroughs.map((borough) => (
                <option key={borough} value={borough}>{borough}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Program
            </label>
            <select value={selectedProgram} onChange={(e) => onProgramChange(e.target.value)} className="select-field">
              <option value="all">All programs</option>
              {programs.map((program) => (
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Sort by
            </label>
            <div className="flex gap-2">
              <select value={sortBy} onChange={(e) => onSortByChange(e.target.value)} className="select-field">
                <option value="siteName">Site name</option>
                <option value="program">Program</option>
                <option value="borough">Borough</option>
                <option value="category">Category</option>
                <option value="latitude">Latitude</option>
                <option value="longitude">Longitude</option>
              </select>
              <button
                type="button"
                onClick={onSortOrderToggle}
                className="rounded-lg border border-slate-300 px-3 text-slate-600 hover:bg-slate-50"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            {totalShown !== undefined && totalSites !== undefined && (
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{totalShown}</span> of {totalSites} sites
              </p>
            )}
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {onUpdateYouthStatus && (
              <button onClick={onUpdateYouthStatus} disabled={geocodingAll} className={toolButton}>
                Set youth to open
              </button>
            )}
            <button onClick={onGeocodeAll} disabled={geocodingAll} className={toolButton}>
              {geocodingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Bulk geocode
              {sitesWithoutCoords > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                  {sitesWithoutCoords}
                </span>
              )}
            </button>
            {onFillSupervisors && (
              <button
                onClick={onFillSupervisors}
                disabled={fillingSupervisors || sitesMissingSupervisors === 0}
                className={toolButton}
                title="Copy assistant principal names to site supervisor and use the site phone number"
              >
                {fillingSupervisors ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                Fill supervisors
                {sitesMissingSupervisors > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                    {sitesMissingSupervisors}
                  </span>
                )}
              </button>
            )}
            {onGenerateDescriptionsBulk && (
              <>
                {selectedSitesCount === 0 ? (
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={descriptionCount}
                    onChange={(e) => onDescriptionCountChange?.(parseInt(e.target.value) || 10)}
                    disabled={generatingDescriptions}
                    className="w-16 rounded-lg border border-slate-300 px-2 py-2 text-center text-sm disabled:bg-slate-100"
                    title="Number of descriptions to generate"
                  />
                ) : (
                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                    {selectedSitesCount} selected
                  </span>
                )}
                <button
                  onClick={onGenerateDescriptionsBulk}
                  disabled={generatingDescriptions || (selectedSitesCount === 0 && sitesWithoutDescriptions === 0)}
                  className={toolButton}
                >
                  {generatingDescriptions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Fill missing descriptions
                  {(selectedSitesCount > 0 || sitesWithoutDescriptions > 0) && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                      {selectedSitesCount > 0 ? selectedSitesCount : sitesWithoutDescriptions}
                    </span>
                  )}
                </button>
              </>
            )}
            <button onClick={onExportPdf} className={toolButton}>
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

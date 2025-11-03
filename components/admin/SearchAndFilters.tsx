'use client';

import { Search, ArrowUpDown, X, MapPin, Download, Loader2, CheckCircle } from 'lucide-react';

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
}

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
}: SearchAndFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Search & Filters</h2>
      
      {/* Search with Autocomplete */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onFocusAutocomplete();
            }}
            onFocus={onFocusAutocomplete}
            onBlur={onBlurAutocomplete}
            placeholder="Search by site name, program, address, borough, or principal..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Autocomplete Dropdown */}
          {showAutocomplete && searchSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onSearchChange(suggestion);
                    onBlurAutocomplete();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="adult-ed">Adult Education</option>
            <option value="youth">Youth Programs</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Borough</label>
          <select
            value={selectedBorough}
            onChange={(e) => onBoroughChange(e.target.value)}
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
            onChange={(e) => onProgramChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Programs</option>
            {programs.slice(0, 50).map(program => (
              <option key={program} value={program}>{program}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="siteName">Site Name</option>
              <option value="program">Program</option>
              <option value="borough">Borough</option>
              <option value="category">Category</option>
              <option value="latitude">Latitude</option>
              <option value="longitude">Longitude</option>
            </select>
            <button
              type="button"
              onClick={onSortOrderToggle}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
            >
              <ArrowUpDown className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary and Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {onUpdateYouthStatus && (
            <button
              onClick={onUpdateYouthStatus}
              disabled={geocodingAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              title="Set all youth programs to Open status"
            >
              {geocodingAll ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Set Youth to Open
                </>
              )}
            </button>
          )}
          <button
            onClick={onGeocodeAll}
            disabled={geocodingAll}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {geocodingAll ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Geocoding...
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5" />
                Bulk Geocode Sites
                {sitesWithoutCoords > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-purple-700 rounded-full text-xs">
                    {sitesWithoutCoords}
                  </span>
                )}
              </>
            )}
          </button>
          <button
            onClick={onExportPdf}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="h-5 w-5" />
            Export to PDF
          </button>
        </div>
      </div>
    </div>
  );
}


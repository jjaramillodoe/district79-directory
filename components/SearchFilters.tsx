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
  rightActions?: React.ReactNode;
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
  } = props;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
      <div className="space-y-4">
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Borough</label>
            <select value={selectedBorough} onChange={(e) => setSelectedBorough(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Boroughs</option>
              {boroughs.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Programs</option>
              {programs.slice(0, 20).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Categories</option>
              <option value="adult-ed">Adult Education</option>
              <option value="youth">Youth Programs</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="siteName">Name</option>
              <option value="borough">Borough</option>
              <option value="program">Program</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">Showing {totalShown} of {totalSites} sites</div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} title="Grid View">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} title="List View">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">PDF Group By:</label>
              <select value={pdfGroupBy} onChange={(e) => setPdfGroupBy(e.target.value as 'none' | 'program')} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="program">By Program</option>
                <option value="none">Single List</option>
              </select>
            </div>
            {rightActions}
          </div>
        </div>
      </div>
    </div>
  );
}



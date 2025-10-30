import { AlertCircle, ChevronDown, ChevronUp, Download, Lightbulb, Search } from 'lucide-react';
interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function FeaturesAccordion({ open, onToggle }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
      <button onClick={onToggle} className="w-full flex items-center justify-between text-left">
        <h2 className="text-xl font-semibold text-gray-900">Features & How to Use</h2>
        {open ? <ChevronUp className="h-6 w-6 text-gray-500" /> : <ChevronDown className="h-6 w-6 text-gray-500" />}
      </button>

      {open && (
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
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
              <Download className="h-5 w-5 text-green-600" />
              Export to PDF
            </h3>
            <ul className="space-y-2 text-gray-600 ml-7">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">•</span>
                <span><strong>Group by Program:</strong> Export sites grouped by program with program details at the top of each group.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">•</span>
                <span><strong>Single List:</strong> Export all filtered results as a single list without grouping.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">•</span>
                <span><strong>Current Filters:</strong> The PDF includes your current search filters and only exports matching sites.</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Report Changes
            </h3>
            <ul className="space-y-2 text-gray-600 ml-7">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold mt-1">•</span>
                <span><strong>Submit Updates:</strong> Click "Report Changes" on any site card to submit updates.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold mt-1">•</span>
                <span><strong>Review Process:</strong> Change requests are reviewed by administrators before being applied.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold mt-1">•</span>
                <span><strong>Contact Info:</strong> Include your name and email so admins can follow up if needed.</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-gray-600 ml-7">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-1">•</span>
                <span>Use the search bar to quickly find sites by name, DBN, or LCGMS code.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-1">•</span>
                <span>Combine filters to narrow down results.</span>
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
  );
}



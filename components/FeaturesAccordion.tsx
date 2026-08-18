import { ChevronDown, Download, HelpCircle, Search } from 'lucide-react';

interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function FeaturesAccordion({ open, onToggle }: Props) {
  return (
    <div className="surface-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <HelpCircle className="h-4 w-4 text-d79-blue" />
          How to search, export, and report changes
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="grid gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-3">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Search className="h-4 w-4 text-d79-blue" />
              Search
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Filter by borough, program, or category. Combine search with filters to narrow the list before exporting.
            </p>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Download className="h-4 w-4 text-d79-blue" />
              Export
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              PDF and Excel use the current filters. Group PDFs by program or export a single list.
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Report changes</h3>
            <p className="text-sm leading-6 text-slate-600">
              Use Report on a site card to send updates. Admins review requests before they go live.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

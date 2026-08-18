'use client';

import { ArrowDown, ArrowUp, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Site {
  _id: string;
  dbn: string;
  program: string;
  siteName: string;
  buildingAddress?: string;
  zipCode?: string;
  borough?: string;
  category: 'adult-ed' | 'youth';
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface SitesTableProps {
  sites: Site[];
  onDelete: (id: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  selectedSites?: Set<string>;
  onSelectSite?: (siteId: string) => void;
  onSelectAll?: () => void;
  allSitesWithoutDescriptions?: string[];
}

export default function SitesTable({
  sites,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
  selectedSites = new Set(),
  onSelectSite,
  onSelectAll,
}: SitesTableProps) {
  const sitesWithoutDescriptions = sites.filter((s) => !s.description || s.description.trim() === '');
  const allSelected =
    sitesWithoutDescriptions.length > 0 &&
    sitesWithoutDescriptions.every((s) => selectedSites.has(s._id));
  const someSelected = sitesWithoutDescriptions.some((s) => selectedSites.has(s._id));

  if (sites.length === 0) {
    return (
      <div className="surface-card px-6 py-16 text-center">
        <p className="text-slate-500">No sites found. Upload a CSV file to get started.</p>
      </div>
    );
  }

  const th = 'px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {onSelectSite && (
                <th className={`${th} w-12`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={onSelectAll}
                    className="rounded border-slate-300 text-d79-navy focus:ring-d79-blue"
                    title="Select all sites without descriptions"
                  />
                </th>
              )}
              <th className={th}>Site / address</th>
              <th className={th}>Program</th>
              <th className={th}>Borough</th>
              <th className={th}>Category</th>
              <th className={`${th} cursor-pointer select-none hover:bg-slate-100`} onClick={() => onSort?.('latitude')}>
                <div className="flex items-center gap-1">
                  Lat
                  {sortBy === 'latitude' &&
                    (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
              </th>
              <th className={`${th} cursor-pointer select-none hover:bg-slate-100`} onClick={() => onSort?.('longitude')}>
                <div className="flex items-center gap-1">
                  Lng
                  {sortBy === 'longitude' &&
                    (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
              </th>
              <th className={th}>Description</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sites.map((site) => {
              const hasDescription = !!(site.description && site.description.trim());
              const isSelectable = !hasDescription;
              const isSelected = selectedSites.has(site._id);

              return (
                <tr key={site._id} className={isSelected ? 'bg-d79-sky/60' : 'hover:bg-slate-50'}>
                  {onSelectSite && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectSite(site._id)}
                        disabled={!isSelectable}
                        className="rounded border-slate-300 text-d79-navy focus:ring-d79-blue disabled:opacity-40"
                        title={isSelectable ? 'Select to generate description' : 'Site already has a description'}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{site.siteName}</p>
                    <p className="text-xs text-slate-500">
                      {[site.buildingAddress, site.borough, site.zipCode && `NY ${site.zipCode}`]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{site.program}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{site.borough}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        site.category === 'adult-ed'
                          ? 'bg-d79-sky text-d79-navy'
                          : 'bg-violet-100 text-violet-800'
                      }`}
                    >
                      {site.category === 'adult-ed' ? 'Adult Ed' : 'Youth'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {site.latitude != null ? site.latitude.toFixed(4) : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {site.longitude != null ? site.longitude.toFixed(4) : '—'}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-slate-500">
                    {site.description ? (
                      <span title={site.description}>
                        {site.description.length > 90
                          ? `${site.description.substring(0, 90)}…`
                          : site.description}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/edit/${site._id}`}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-d79-navy"
                        title="Edit site"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this site?')) {
                            onDelete(site._id);
                          }
                        }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete site"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

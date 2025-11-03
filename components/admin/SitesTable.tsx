'use client';

import { Edit, Trash2, Check, X as XIcon, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';

interface Site {
  _id: string;
  dbn: string;
  program: string;
  siteName: string;
  borough?: string;
  category: 'adult-ed' | 'youth';
  latitude?: number | null;
  longitude?: number | null;
}

interface SitesTableProps {
  sites: Site[];
  onDelete: (id: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export default function SitesTable({ sites, onDelete, sortBy, sortOrder, onSort }: SitesTableProps) {
  if (sites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No sites found. Upload a CSV file to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Borough
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => onSort?.('latitude')}
              >
                <div className="flex items-center gap-1">
                  Latitude
                  {sortBy === 'latitude' && (
                    sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => onSort?.('longitude')}
              >
                <div className="flex items-center gap-1">
                  Longitude
                  {sortBy === 'longitude' && (
                    sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sites.map((site) => (
              <tr key={site._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {site.siteName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {site.program}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {site.borough}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    site.category === 'adult-ed' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {site.category === 'adult-ed' ? 'Adult Ed' : 'Youth'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {site.latitude !== null && site.latitude !== undefined ? site.latitude.toFixed(6) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {site.longitude !== null && site.longitude !== undefined ? site.longitude.toFixed(6) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/edit/${site._id}`}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Site"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this site?')) {
                          onDelete(site._id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Site"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


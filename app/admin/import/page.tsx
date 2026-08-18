'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import LoginForm from '@/components/admin/LoginForm';

interface PreviewData {
  summary: {
    totalInCsv: number;
    toInsert: number;
    toUpdate: number;
    unchanged: number;
    toRemove: number;
  };
  preview: {
    toInsert: any[];
    toUpdate: Array<{
      csvSite: any;
      existingSite: any;
      changes: Array<{ field: string; oldValue: string; newValue: string }>;
    }>;
    unchanged: Array<{ csvSite: any; existingSite: any }>;
    toRemove: any[];
  };
  category: string;
  filename: string;
}

type PreviewTab = 'insert' | 'update' | 'unchanged' | 'remove';

const FIELD_LABELS: Record<string, string> = {
  dbn: 'DBN',
  program: 'Program',
  status: 'Status',
  buildingAddress: 'Address',
  borough: 'Borough',
  zipCode: 'ZIP code',
  businessPhone: 'Business phone',
  assistantPrincipal: 'Assistant principal',
  apEmail: 'AP email',
  principal: 'Principal',
  principalEmail: 'Principal email',
  siteSupervisor: 'Site supervisor',
  siteSupervisorPhone: 'Supervisor phone',
  daytimeDays: 'Daytime days',
  daytimeHours: 'Daytime hours',
  eveningDays: 'Evening days',
  eveningHours: 'Evening hours',
  saturdayHours: 'Saturday hours',
  subject: 'Subject',
  hostSchool: 'Host school',
  hsePrepCode: 'HSE Prep code',
  lcgmsBuildingCode: 'LCGMS code',
  buildingCode: 'Building code',
  sedCode: 'SED code',
  buildingOwnership: 'Building ownership',
  policePrecinct: 'Police precinct',
  csd: 'CSD',
  newForSY: 'New for school year',
  hasSaturdayProgram: 'Saturday program',
  level: 'Level',
  hasPMProgram: 'PM program',
};

function fieldLabel(field: string) {
  return FIELD_LABELS[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function categoryLabel(category: string) {
  return category === 'adult-ed' ? 'Adult Education' : 'Youth Programs';
}

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [removeMissing, setRemoveMissing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<PreviewTab>('update');
  const [listQuery, setListQuery] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();
      setIsAuthenticated(data.authenticated || false);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (password?: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsAuthenticated(true);
        setError(null);
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      router.push('/admin');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const previewFile = async (file: File) => {
    setSelectedFile(file);
    setPreviewData(null);
    setError(null);
    setImportResult(null);
    setRemoveMissing(false);
    setExpandedItems(new Set());
    setListQuery('');
    setPreviewLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload/preview', { method: 'POST', body: formData });
      const data = await response.json();

      if (response.ok) {
        setPreviewData(data);
        const nextTab: PreviewTab =
          data.summary.toUpdate > 0
            ? 'update'
            : data.summary.toInsert > 0
              ? 'insert'
              : data.summary.toRemove > 0
                ? 'remove'
                : 'unchanged';
        setActiveTab(nextTab);
      } else {
        setError(data.error || 'Failed to preview file');
      }
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to preview file. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await previewFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please drop a .csv file.');
      return;
    }
    await previewFile(file);
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setError(null);
    setImportResult(null);
    setRemoveMissing(false);
    setExpandedItems(new Set());
    setListQuery('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!selectedFile || !previewData) return;

    const deleteCount = removeMissing ? previewData.summary.toRemove : 0;
    const applyCount = previewData.summary.toInsert + previewData.summary.toUpdate;
    const confirmMessage =
      deleteCount > 0
        ? `Import ${applyCount} site change${applyCount === 1 ? '' : 's'} and permanently delete ${deleteCount} site${deleteCount === 1 ? '' : 's'} not in this CSV?`
        : `Import ${applyCount} site change${applyCount === 1 ? '' : 's'} from ${previewData.filename}?`;

    if (!confirm(confirmMessage)) return;

    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('removeMissing', removeMissing.toString());
      const response = await fetch('/api/upload/import', { method: 'POST', body: formData });
      const data = await response.json();

      if (response.ok) {
        setImportResult(data.message || 'Import completed successfully');
        setTimeout(() => router.push('/admin'), 2000);
      } else {
        setError(data.error || 'Failed to import file');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import file. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const toggleExpand = (idx: number) => {
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const filteredUpdates = useMemo(() => {
    if (!previewData) return [];
    const q = listQuery.trim().toLowerCase();
    if (!q) return previewData.preview.toUpdate;
    return previewData.preview.toUpdate.filter((item) =>
      [item.csvSite.siteName, item.csvSite.program, ...item.changes.map((c) => c.field)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [previewData, listQuery]);

  const filteredInserts = useMemo(() => {
    if (!previewData) return [];
    const q = listQuery.trim().toLowerCase();
    if (!q) return previewData.preview.toInsert;
    return previewData.preview.toInsert.filter((site) =>
      [site.siteName, site.program, site.buildingAddress].join(' ').toLowerCase().includes(q)
    );
  }, [previewData, listQuery]);

  const filteredUnchanged = useMemo(() => {
    if (!previewData) return [];
    const q = listQuery.trim().toLowerCase();
    if (!q) return previewData.preview.unchanged;
    return previewData.preview.unchanged.filter((item) =>
      [item.csvSite.siteName, item.csvSite.program].join(' ').toLowerCase().includes(q)
    );
  }, [previewData, listQuery]);

  const filteredRemove = useMemo(() => {
    if (!previewData) return [];
    const q = listQuery.trim().toLowerCase();
    if (!q) return previewData.preview.toRemove;
    return previewData.preview.toRemove.filter((site) =>
      [site.siteName, site.program].join(' ').toLowerCase().includes(q)
    );
  }, [previewData, listQuery]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-d79-blue" />
          <p className="text-slate-600">Loading import...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} error={error || undefined} />;
  }

  const applyCount = previewData ? previewData.summary.toInsert + previewData.summary.toUpdate : 0;

  return (
    <div className="bg-slate-50">
      <div className={`page-shell space-y-6 py-8 ${previewData ? 'pb-28' : ''}`}>
        <AdminHeader
          title="CSV import"
          subtitle="Preview additions, updates, and removals before they go live"
          onLogout={handleLogout}
        />

        <Link
          href="/admin"
          className="inline-flex items-center text-sm font-medium text-d79-blue hover:text-d79-navy"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to admin
        </Link>

        <div className="surface-card p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">1. Select a CSV file</h2>
              <p className="mt-1 text-sm text-slate-500">
                Include <span className="font-medium text-slate-700">Adult Ed</span> or{' '}
                <span className="font-medium text-slate-700">Youth</span> in the filename so the category is detected.
              </p>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={resetImport}
                disabled={previewLoading || importing}
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-d79-navy disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Clear file
              </button>
            )}
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragging
                ? 'border-d79-blue bg-d79-sky'
                : selectedFile
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-slate-300 bg-white hover:border-d79-blue hover:bg-d79-sky/40'
            }`}
          >
            <FileSpreadsheet className={`mb-3 h-10 w-10 ${isDragging ? 'text-d79-blue' : 'text-slate-400'}`} />
            {selectedFile ? (
              <>
                <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                <p className="mt-1 text-xs text-slate-500">{formatBytes(selectedFile.size)} · Click or drop to replace</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-900">Drop a CSV here, or click to browse</p>
                <p className="mt-1 text-xs text-slate-500">Sites are matched by site name, case-insensitive</p>
              </>
            )}
            <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-d79-navy px-4 py-2 text-sm font-medium text-white hover:bg-d79-blue">
              <Upload className="h-4 w-4" />
              {selectedFile ? 'Change file' : 'Choose file'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={previewLoading || importing}
              className="hidden"
            />
          </label>

          {previewLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-d79-blue" />
              Analyzing file...
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {importResult && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {importResult} Redirecting to admin...
          </div>
        )}

        {previewData && (
          <>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-900">2. Review changes</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {[
                  { label: 'In CSV', value: previewData.summary.totalInCsv, tone: 'text-slate-900' },
                  { label: 'New', value: previewData.summary.toInsert, tone: 'text-emerald-700' },
                  { label: 'Updates', value: previewData.summary.toUpdate, tone: 'text-amber-700' },
                  { label: 'Unchanged', value: previewData.summary.unchanged, tone: 'text-slate-900' },
                  { label: 'Not in CSV', value: previewData.summary.toRemove, tone: 'text-red-700' },
                ].map((stat) => (
                  <div key={stat.label} className="surface-card p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                    <p className={`mt-1 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="rounded-full bg-d79-sky px-2.5 py-1 text-xs font-medium text-d79-navy">
                  {categoryLabel(previewData.category)}
                </span>
                <span className="text-slate-400">·</span>
                <span className="truncate">{previewData.filename}</span>
              </div>
            </div>

            <div className="surface-card overflow-hidden">
              <div className="flex flex-wrap gap-1 border-b border-slate-200 px-2 pt-2">
                {(
                  [
                    { id: 'insert', label: 'New', count: previewData.summary.toInsert },
                    { id: 'update', label: 'Updates', count: previewData.summary.toUpdate },
                    { id: 'unchanged', label: 'Unchanged', count: previewData.summary.unchanged },
                    { id: 'remove', label: 'Not in CSV', count: previewData.summary.toRemove },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setListQuery('');
                    }}
                    className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-white text-d79-navy shadow-[inset_0_-2px_0_0_#003F87]'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={listQuery}
                    onChange={(e) => setListQuery(e.target.value)}
                    placeholder="Filter this list..."
                    className="select-field pl-9"
                  />
                </div>
                {activeTab === 'update' && previewData.preview.toUpdate.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (expandedItems.size === filteredUpdates.length) {
                        setExpandedItems(new Set());
                      } else {
                        setExpandedItems(new Set(filteredUpdates.map((_, i) => i)));
                      }
                    }}
                    className="text-sm font-medium text-d79-blue hover:text-d79-navy"
                  >
                    {expandedItems.size === filteredUpdates.length ? 'Collapse all' : 'Expand all'}
                  </button>
                )}
              </div>

              {activeTab === 'insert' && (
                <PreviewTable
                  empty="No new sites in this file."
                  headers={['Site name', 'Program', 'Address']}
                  rows={filteredInserts.map((site, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{site.siteName}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{site.program}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{site.buildingAddress}</td>
                    </tr>
                  ))}
                />
              )}

              {activeTab === 'update' && (
                <div className="max-h-[28rem] space-y-3 overflow-y-auto p-4">
                  {filteredUpdates.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      {listQuery ? 'No updates match this filter.' : 'No field changes detected.'}
                    </p>
                  ) : (
                    filteredUpdates.map((item, idx) => {
                      const isExpanded = expandedItems.has(idx);
                      return (
                        <div key={idx} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-medium text-slate-900">{item.csvSite.siteName}</h4>
                              <p className="text-sm text-slate-500">{item.csvSite.program}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleExpand(idx)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-d79-blue hover:bg-d79-sky"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {item.changes.length} field{item.changes.length === 1 ? '' : 's'}
                            </button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {item.changes.map((change, changeIdx) => (
                              <span
                                key={changeIdx}
                                className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
                              >
                                {fieldLabel(change.field)}
                              </span>
                            ))}
                          </div>
                          {isExpanded && (
                            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                              <p className="text-xs text-slate-500">
                                Latitude, longitude, and description are protected and will not change.
                              </p>
                              {item.changes.map((change, changeIdx) => (
                                <div key={changeIdx} className="rounded-lg bg-slate-50 p-3">
                                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                                    {fieldLabel(change.field)}
                                  </p>
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                      <p className="mb-1 text-xs text-slate-400">Current</p>
                                      <div className="rounded-md border border-red-100 bg-red-50 px-2 py-1.5 text-sm text-red-900">
                                        {change.oldValue || <span className="italic text-slate-400">(empty)</span>}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="mb-1 text-xs text-slate-400">From CSV</p>
                                      <div className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-sm text-emerald-900">
                                        {change.newValue || <span className="italic text-slate-400">(empty)</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'unchanged' && (
                <PreviewTable
                  empty="Every site in this CSV already matches the directory."
                  headers={['Site name', 'Program']}
                  rows={filteredUnchanged.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.csvSite.siteName}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.csvSite.program}</td>
                    </tr>
                  ))}
                />
              )}

              {activeTab === 'remove' && (
                <div>
                  {previewData.summary.toRemove > 0 && (
                    <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      These sites are in the directory but not in this CSV. They are only deleted if you turn that option
                      on before importing.
                    </div>
                  )}
                  <PreviewTable
                    empty="Every existing site in this category is in the CSV."
                    headers={['Site name', 'Program']}
                    rows={filteredRemove.map((site, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{site.siteName}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{site.program}</td>
                      </tr>
                    ))}
                  />
                </div>
              )}
            </div>

            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold text-slate-900">3. Import options</h2>
              <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={removeMissing}
                  onChange={(e) => setRemoveMissing(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-d79-navy focus:ring-d79-blue"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Trash2 className="h-4 w-4 text-red-600" />
                    Remove sites not in this CSV
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    {previewData.summary.toRemove} site{previewData.summary.toRemove === 1 ? '' : 's'} will be deleted
                    from {categoryLabel(previewData.category)}. Leave this unchecked to keep them.
                  </span>
                </span>
              </label>
            </div>
          </>
        )}

        {!previewData && !previewLoading && (
          <div className="surface-card p-5">
            <h3 className="text-sm font-semibold text-slate-900">How import works</h3>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
              <li>Upload a CSV. Category comes from the filename (Adult Ed or Youth).</li>
              <li>Review new sites, field updates, and sites missing from the file.</li>
              <li>Import applies additions and updates. Deleting missing sites is optional.</li>
              <li>Matching is by site/school name, ignoring case. Coordinates stay as they are. Existing descriptions are kept; new sites get a free template from the site details.</li>
            </ol>
          </div>
        )}
      </div>

      {previewData && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="page-shell flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                {previewData.summary.toInsert} new
              </span>
              <span className="mx-2 text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                <Minus className="h-3.5 w-3.5 text-amber-600" />
                {previewData.summary.toUpdate} updated
              </span>
              {removeMissing && previewData.summary.toRemove > 0 && (
                <>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1 font-medium text-red-700">
                    <Trash2 className="h-3.5 w-3.5" />
                    {previewData.summary.toRemove} deleted
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetImport}
                disabled={importing}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || applyCount + (removeMissing ? previewData.summary.toRemove : 0) === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-d79-navy px-4 py-2 text-sm font-medium text-white hover:bg-d79-blue disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? 'Importing...' : `Import ${applyCount} site${applyCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: ReactNode[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-slate-500">{empty}</p>;
  }

  return (
    <div className="max-h-[28rem] overflow-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="sticky top-0 bg-slate-50">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{rows}</tbody>
      </table>
    </div>
  );
}

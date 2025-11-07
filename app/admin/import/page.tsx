'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, ArrowLeft, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
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
      changes: Array<{ field: string; oldValue: string; newValue: string }> 
    }>;
    unchanged: Array<{ csvSite: any; existingSite: any }>;
    toRemove: any[];
  };
  category: string;
  filename: string;
}

export default function ImportPage() {
  const router = useRouter();
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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();
      setIsAuthenticated(data.authenticated || false);
    } catch (error) {
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
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      router.push('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewData(null);
    setError(null);
    setImportResult(null);
    setPreviewLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/preview', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setPreviewData(data);
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

  const handleImport = async () => {
    if (!selectedFile || !previewData) return;

    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('removeMissing', removeMissing.toString());

      const response = await fetch('/api/upload/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data.message || 'Import completed successfully');
        // Redirect to admin page after a short delay
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader 
          pendingRequestsCount={0}
          onToggleChangeRequests={() => {}}
          onLogout={handleLogout}
        />
        <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoginForm onLogin={handleLogin} error={error || undefined} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        pendingRequestsCount={0}
        onToggleChangeRequests={() => {}}
        onLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">CSV Import</h1>
          <p className="text-gray-600 mt-2">
            Upload a CSV file to preview changes before importing
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select CSV File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              {selectedFile ? selectedFile.name : 'Choose a CSV file to upload'}
            </p>
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed">
              <Upload className="mr-2 h-5 w-5" />
              {selectedFile ? 'Change File' : 'Choose File'}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={previewLoading}
                className="hidden"
              />
            </label>
          </div>

          {previewLoading && (
            <div className="mt-4 text-center">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm text-gray-600 mt-2">Analyzing file...</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {importResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">{importResult}</p>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {previewData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-900">{previewData.summary.totalInCsv}</div>
                <div className="text-sm text-blue-700">Total in CSV</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-900">{previewData.summary.toInsert}</div>
                <div className="text-sm text-green-700">New Sites</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-900">{previewData.summary.toUpdate}</div>
                <div className="text-sm text-yellow-700">To Update</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{previewData.summary.unchanged}</div>
                <div className="text-sm text-gray-700">Unchanged</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-900">{previewData.summary.toRemove}</div>
                <div className="text-sm text-red-700">To Remove*</div>
              </div>
            </div>

            {/* Category Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Category:</strong> {previewData.category === 'adult-ed' ? 'Adult Education' : 'Youth Programs'}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>File:</strong> {previewData.filename}
              </p>
            </div>

            {/* New Sites Preview */}
            {previewData.preview.toInsert.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  New Sites ({previewData.summary.toInsert})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.preview.toInsert.map((site, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{site.siteName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{site.program}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{site.buildingAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sites to Update Preview */}
            {previewData.preview.toUpdate.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  Sites to Update ({previewData.summary.toUpdate})
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Fields like latitude, longitude, and description are protected and will not be updated from the CSV.
                  </p>
                </div>
                <div className="space-y-4">
                  {previewData.preview.toUpdate.map((item, idx) => {
                    const isExpanded = expandedItems.has(idx);
                    const toggleExpand = () => {
                      const newExpanded = new Set(expandedItems);
                      if (isExpanded) {
                        newExpanded.delete(idx);
                      } else {
                        newExpanded.add(idx);
                      }
                      setExpandedItems(newExpanded);
                    };
                    
                    return (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{item.csvSite.siteName}</h4>
                            <p className="text-sm text-gray-600">{item.csvSite.program}</p>
                          </div>
                          <button
                            onClick={toggleExpand}
                            className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          >
                            {isExpanded ? 'Hide Details' : 'Show Details'}
                          </button>
                        </div>
                        
                        {/* Summary of fields to update */}
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-2">Fields to be updated ({item.changes.length}):</div>
                          <div className="flex flex-wrap gap-2">
                            {item.changes.map((change, changeIdx) => (
                              <span
                                key={changeIdx}
                                className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium"
                                title={`${change.field}: "${change.oldValue}" → "${change.newValue}"`}
                              >
                                {change.field}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Detailed view (expandable) */}
                        {isExpanded && (
                          <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                            {item.changes.map((change, changeIdx) => (
                              <div key={changeIdx} className="bg-gray-50 rounded p-3">
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                  Field: <span className="font-semibold">{change.field}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Current Value (in database):</div>
                                    <div className="bg-red-50 border border-red-200 rounded p-2 text-red-900 break-words max-h-32 overflow-y-auto">
                                      {change.oldValue || <span className="text-gray-400 italic">(empty)</span>}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">New Value (from CSV):</div>
                                    <div className="bg-green-50 border border-green-200 rounded p-2 text-green-900 break-words max-h-32 overflow-y-auto">
                                      {change.newValue || <span className="text-gray-400 italic">(empty)</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sites to Remove Preview */}
            {previewData.summary.toRemove > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  Sites Not in CSV ({previewData.summary.toRemove})
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    These sites exist in the database but are not in the CSV file. They will only be removed if you check the option below.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.preview.toRemove.map((site, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{site.siteName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{site.program}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Options</h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={removeMissing}
                    onChange={(e) => setRemoveMissing(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Remove sites not in CSV ({previewData.summary.toRemove} sites will be deleted)
                  </span>
                </label>

                <div className="flex gap-4">
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        Import {previewData.summary.toInsert + previewData.summary.toUpdate} Sites
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewData(null);
                      setError(null);
                      setImportResult(null);
                    }}
                    disabled={importing}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-blue-900 mb-2">How to Import CSV Files:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Select a CSV file using the "Choose File" button</li>
            <li>Review the preview to see what will be added, updated, or removed</li>
            <li>Optionally check "Remove sites not in CSV" to delete sites not in the file</li>
            <li>Click "Import" to apply the changes</li>
            <li>Sites are matched by Site/School Name (case-insensitive)</li>
          </ol>
        </div>
      </main>

      <Footer />
    </div>
  );
}


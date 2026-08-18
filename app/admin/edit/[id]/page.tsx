'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Footer from '@/components/Footer';
import { joinNamedPhones, parseNamedPhones } from '@/lib/staff';

interface Site {
  _id: string;
  dbn: string;
  program: string;
  siteName: string;
  status?: string;
  buildingAddress?: string;
  borough?: string;
  zipCode?: string;
  businessPhone?: string;
  category: 'adult-ed' | 'youth';
  lcgmsBuildingCode?: string;
  csd?: string;
  assistantPrincipal?: string;
  apEmail?: string;
  principal?: string;
  principalEmail?: string;
  siteSupervisor?: string;
  siteSupervisorPhone?: string;
  daytimeDays?: string;
  daytimeHours?: string;
  eveningDays?: string;
  eveningHours?: string;
  hasSaturdayProgram?: string;
  saturdayHours?: string;
  subject?: string;
  description?: string;
  descriptionSource?: 'template' | 'ai' | 'manual';
  descriptionFactsKey?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function EditSitePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [supervisorRows, setSupervisorRows] = useState<{ name: string; phone: string }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [showBoroughSuggestions, setShowBoroughSuggestions] = useState(false);
  
  const boroughSuggestions = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Dobbs Ferry', 'Yonkers', 'Buffalo', 'Rochester', 'Albany'];

  useEffect(() => {
    if (id) {
      fetchSite();
    }
  }, [id]);

  const fetchSite = async () => {
    try {
      const response = await fetch(`/api/sites/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSite(data);
      } else {
        setError('Site not found');
      }
    } catch (error) {
      console.error('Error fetching site:', error);
      setError('Failed to load site');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/sites/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(site),
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update site');
      }
    } catch (error) {
      console.error('Error updating site:', error);
      setError('Failed to update site');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  const handleChange = (field: keyof Site, value: string | number | null) => {
    if (site) {
      if (field === 'latitude' || field === 'longitude') {
        setSite({ ...site, [field]: value === '' ? null : (typeof value === 'string' ? parseFloat(value) : value) });
      } else if (field === 'description') {
        setSite({ ...site, description: value as string, descriptionSource: 'manual' });
      } else {
        setSite({ ...site, [field]: value as string });
      }
    }
  };

  // Helper functions for managing assistant principals
  const getAssistantPrincipals = () => {
    if (!site?.assistantPrincipal && !site?.apEmail) return [];
    
    const names = site.assistantPrincipal ? site.assistantPrincipal.split('/').map(n => n.trim()).filter(Boolean) : [];
    const emails = site.apEmail ? site.apEmail.split('/').map(e => e.trim()).filter(Boolean) : [];
    
    // Match up names and emails
    const maxLength = Math.max(names.length, emails.length);
    return Array.from({ length: maxLength }, (_, i) => ({
      name: names[i] || '',
      email: emails[i] || ''
    }));
  };

  const updateAssistantPrincipals = (index: number, field: 'name' | 'email', value: string) => {
    if (!site) return;
    
    const currentAPs = getAssistantPrincipals();
    currentAPs[index] = { ...currentAPs[index], [field]: value };
    
    // Remove empty entries at the end
    while (currentAPs.length > 0 && !currentAPs[currentAPs.length - 1].name && !currentAPs[currentAPs.length - 1].email) {
      currentAPs.pop();
    }
    
    const names = currentAPs.map(ap => ap.name).filter(Boolean);
    const emails = currentAPs.map(ap => ap.email).filter(Boolean);
    
    setSite({
      ...site,
      assistantPrincipal: names.length > 0 ? names.join(' / ') : '',
      apEmail: emails.length > 0 ? emails.join(' / ') : ''
    });
  };

  const addAssistantPrincipal = () => {
    if (!site) return;
    const currentAPs = getAssistantPrincipals();
    updateAssistantPrincipals(currentAPs.length, 'name', '');
  };

  const removeAssistantPrincipal = (index: number) => {
    if (!site) return;
    const currentAPs = getAssistantPrincipals();
    currentAPs.splice(index, 1);
    
    // Update the site with remaining APs
    const names = currentAPs.map(ap => ap.name).filter(Boolean);
    const emails = currentAPs.map(ap => ap.email).filter(Boolean);
    
    setSite({
      ...site,
      assistantPrincipal: names.length > 0 ? names.join(' / ') : '',
      apEmail: emails.length > 0 ? emails.join(' / ') : ''
    });
  };

  const getSiteSupervisors = () => {
    if (supervisorRows) return supervisorRows;
    return parseNamedPhones(site?.siteSupervisor, site?.siteSupervisorPhone);
  };

  const persistSupervisors = (rows: { name: string; phone: string }[]) => {
    setSupervisorRows(rows);
    const { names, phones } = joinNamedPhones(rows);
    setSite((current) =>
      current
        ? { ...current, siteSupervisor: names, siteSupervisorPhone: phones }
        : current
    );
  };

  const updateSiteSupervisor = (index: number, field: 'name' | 'phone', value: string) => {
    const current = getSiteSupervisors();
    const next = current.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    persistSupervisors(next);
  };

  const addSiteSupervisor = () => {
    persistSupervisors([...getSiteSupervisors(), { name: '', phone: '' }]);
  };

  const removeSiteSupervisor = (index: number) => {
    persistSupervisors(getSiteSupervisors().filter((_, i) => i !== index));
  };

  const handleGeocode = async () => {
    if (!site?.buildingAddress) {
      setError('Please enter a building address first');
      return;
    }

    setGeocoding(true);
    setError('');

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: site.buildingAddress,
          borough: site.borough,
          zipCode: site.zipCode,
        }),
      });

      const data = await response.json();

      if (data.latitude && data.longitude) {
        setSite({
          ...site,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } else {
        setError(data.error || 'Could not geocode address');
      }
    } catch (error) {
      setError('Failed to geocode address. Please try again.');
      console.error('Geocoding error:', error);
    } finally {
      setGeocoding(false);
    }
  };

  const handleGenerateDescription = async (mode: 'template' | 'ai' = 'template') => {
    if (!site?.siteName || !site?.program) {
      setError('Site name and program are required to generate description');
      return;
    }

    setGeneratingDescription(true);
    setError('');

    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: site.siteName,
          program: site.program,
          address: site.buildingAddress,
          borough: site.borough,
          category: site.category,
          daytimeDays: site.daytimeDays,
          daytimeHours: site.daytimeHours,
          eveningDays: site.eveningDays,
          eveningHours: site.eveningHours,
          saturdayHours: site.saturdayHours,
          mode,
        }),
      });

      const data = await response.json();

      if (data.description) {
        setSite({
          ...site,
          description: data.description,
          descriptionSource: data.descriptionSource || mode,
          descriptionFactsKey: data.descriptionFactsKey,
        });
      } else {
        setError(data.error || 'Could not generate description');
      }
    } catch (error) {
      setError('Failed to generate description. Please try again.');
      console.error('Description generation error:', error);
    } finally {
      setGeneratingDescription(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading site...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Site not found'}</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Admin
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Site</h1>
          <p className="text-gray-600 mt-1">{site.siteName}</p>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">Basic Information</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Name *</label>
              <input
                type="text"
                value={site.siteName || ''}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DBN</label>
              <input
                type="text"
                value={site.dbn || ''}
                onChange={(e) => handleChange('dbn', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program *</label>
              <input
                type="text"
                value={site.program || ''}
                onChange={(e) => handleChange('program', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={site.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Status</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={site.category || ''}
                onChange={(e) => handleChange('category', e.target.value as 'adult-ed' | 'youth')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="adult-ed">Adult Education</option>
                <option value="youth">Youth Programs</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={site.subject || ''}
                onChange={(e) => handleChange('subject', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={site.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="Site description will appear here..."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateDescription('template')}
                  disabled={generatingDescription || !site.siteName || !site.program}
                  className="px-4 py-2 bg-d79-navy text-white rounded-lg hover:bg-d79-blue disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {generatingDescription ? 'Generating...' : 'Fill from site details'}
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateDescription('ai')}
                  disabled={generatingDescription || !site.siteName || !site.program}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Write with AI
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Fill from site details is free and stays in sync on CSV import. Write with AI is optional and kept until you replace it.
              </p>
            </div>

            {/* Address Information */}
            <div className="md:col-span-2 mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">Address Information</h2>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Building Address</label>
                  <input
                    type="text"
                    value={site.buildingAddress || ''}
                    onChange={(e) => handleChange('buildingAddress', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocoding || !site.buildingAddress}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  title="Geocode address to get latitude/longitude"
                >
                  {geocoding ? 'Geocoding...' : '📍 Geocode'}
                </button>
              </div>
              {(site.latitude && site.longitude) && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Geocoded: {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                </p>
              )}
              {(!site.latitude || !site.longitude) && (
                <p className="text-xs text-gray-500 mt-1">
                  No coordinates set. Use Geocode button or enter manually below.
                </p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Borough / City *</label>
              <input
                type="text"
                value={site.borough || ''}
                onChange={(e) => handleChange('borough', e.target.value)}
                onFocus={() => setShowBoroughSuggestions(true)}
                onBlur={() => setTimeout(() => setShowBoroughSuggestions(false), 200)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter borough or city (e.g., Manhattan, Dobbs Ferry)"
                required
              />
              
              {/* Borough Suggestions Dropdown */}
              {showBoroughSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {boroughSuggestions
                    .filter(borough => 
                      !site.borough || 
                      borough.toLowerCase().includes(site.borough.toLowerCase())
                    )
                    .map((borough, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          handleChange('borough', borough);
                          setShowBoroughSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        {borough}
                      </button>
                    ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter any borough or city name (e.g., Manhattan, Dobbs Ferry, Yonkers)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input
                type="text"
                value={site.zipCode || ''}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Coordinates - Always visible for manual entry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={site.latitude ?? ''}
                onChange={(e) => handleChange('latitude', e.target.value ? parseFloat(e.target.value).toString() : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 40.7128"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter manually if geocoding fails
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={site.longitude ?? ''}
                onChange={(e) => handleChange('longitude', e.target.value ? parseFloat(e.target.value).toString() : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., -74.0060"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter manually if geocoding fails
              </p>
            </div>

            {/* Contact Information */}
            <div className="md:col-span-2 mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">Contact Information</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone</label>
              <input
                type="tel"
                value={site.businessPhone || ''}
                onChange={(e) => handleChange('businessPhone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Principal</label>
              <input
                type="text"
                value={site.principal || ''}
                onChange={(e) => handleChange('principal', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Principal Email</label>
              <input
                type="email"
                value={site.principalEmail || ''}
                onChange={(e) => handleChange('principalEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Assistant Principals - Dynamic Fields */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Assistant Principal(s)</label>
                <button
                  type="button"
                  onClick={addAssistantPrincipal}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                  </svg>
                  Add AP
                </button>
              </div>
              
              <div className="space-y-3">
                {getAssistantPrincipals().length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-3 border border-gray-200 rounded-lg bg-gray-50">
                    No assistant principals. Click "Add AP" to add one.
                  </div>
                ) : (
                  getAssistantPrincipals().map((ap, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={ap.name}
                          onChange={(e) => updateAssistantPrincipals(index, 'name', e.target.value)}
                          placeholder="Assistant Principal Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        <input
                          type="email"
                          value={ap.email}
                          onChange={(e) => updateAssistantPrincipals(index, 'email', e.target.value)}
                          placeholder="Email address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAssistantPrincipal(index)}
                        className="mt-2 text-red-600 hover:text-red-800 p-2"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Each assistant principal will be automatically separated by "/" when saved.
              </p>
            </div>

            {/* Site Supervisors - Dynamic Fields */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Site Supervisor(s)</label>
                <button
                  type="button"
                  onClick={addSiteSupervisor}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                  </svg>
                  Add supervisor
                </button>
              </div>
              
              <div className="space-y-3">
                {getSiteSupervisors().length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-3 border border-gray-200 rounded-lg bg-gray-50">
                    No site supervisors. Click &quot;Add supervisor&quot; to add one.
                  </div>
                ) : (
                  getSiteSupervisors().map((supervisor, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={supervisor.name}
                          onChange={(e) => updateSiteSupervisor(index, 'name', e.target.value)}
                          placeholder="Site supervisor name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        <input
                          type="tel"
                          value={supervisor.phone}
                          onChange={(e) => updateSiteSupervisor(index, 'phone', e.target.value)}
                          placeholder="Phone number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSiteSupervisor(index)}
                        className="mt-2 text-red-600 hover:text-red-800 p-2"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Each site supervisor will be automatically separated by &quot;/&quot; when saved.
              </p>
            </div>

            {/* System Codes */}
            <div className="md:col-span-2 mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">System Codes</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LCGMS Building Code</label>
              <input
                type="text"
                value={site.lcgmsBuildingCode || ''}
                onChange={(e) => handleChange('lcgmsBuildingCode', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CSD</label>
              <input
                type="text"
                value={site.csd || ''}
                onChange={(e) => handleChange('csd', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Operating Hours */}
            <div className="md:col-span-2 mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">Operating Hours</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daytime Days</label>
              <input
                type="text"
                value={site.daytimeDays || ''}
                onChange={(e) => handleChange('daytimeDays', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mon-Fri"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daytime Hours</label>
              <input
                type="text"
                value={site.daytimeHours || ''}
                onChange={(e) => handleChange('daytimeHours', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 9:00 AM - 3:00 PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evening Days</label>
              <input
                type="text"
                value={site.eveningDays || ''}
                onChange={(e) => handleChange('eveningDays', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mon-Thu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evening Hours</label>
              <input
                type="text"
                value={site.eveningHours || ''}
                onChange={(e) => handleChange('eveningHours', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 4:00 PM - 8:00 PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Has Saturday Program</label>
              <select
                value={site.hasSaturdayProgram || ''}
                onChange={(e) => handleChange('hasSaturdayProgram', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Saturday Hours</label>
              <input
                type="text"
                value={site.saturdayHours || ''}
                onChange={(e) => handleChange('saturdayHours', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 9:00 AM - 1:00 PM"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      <Footer />
    </div>
  );
}


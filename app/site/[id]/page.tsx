'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import StaticMap from '@/components/StaticMap';
import { 
  Loader2, 
  ChevronLeft, 
  AlertCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Home,
  ExternalLink,
  FileText
} from 'lucide-react';
import Link from 'next/link';

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
  assistantPrincipal?: string;
  apEmail?: string;
  principal?: string;
  principalEmail?: string;
  daytimeDays?: string;
  daytimeHours?: string;
  eveningDays?: string;
  eveningHours?: string;
  saturdayHours?: string;
  hasSaturdayProgram?: string;
  subject?: string;
  description?: string;
  category: 'adult-ed' | 'youth';
  lcgmsBuildingCode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSite();
      fetchMapboxToken();
    }
  }, [id]);

  const fetchSite = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sites/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Site not found');
        } else {
          setError('Failed to load site');
        }
        return;
      }

      const data = await response.json();
      setSite(data);
    } catch (err) {
      console.error('Error fetching site:', err);
      setError('Failed to load site');
    } finally {
      setLoading(false);
    }
  };

  const fetchMapboxToken = async () => {
    try {
      const response = await fetch('/api/mapbox-token');
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setMapboxToken(data.token);
        }
      }
    } catch (err) {
      console.error('Error fetching mapbox token:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Site Details
          </h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              {error || 'Site Not Found'}
            </h2>
            <p className="text-red-700 mb-4">
              {error || 'The site you are looking for does not exist.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Directory
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                View Map
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasCoordinates = site.latitude && site.longitude && 
    !isNaN(site.latitude) && !isNaN(site.longitude) &&
    isFinite(site.latitude) && isFinite(site.longitude);

  // Format hours
  const validHours: Array<{ type: string; days: string | null | undefined; hours: string }> = [];
  if (site.daytimeHours && site.daytimeHours !== 'N/A' && !site.daytimeHours.includes('undefined')) {
    validHours.push({ type: 'Daytime', days: site.daytimeDays, hours: site.daytimeHours });
  }
  if (site.eveningHours && site.eveningHours !== 'N/A' && !site.eveningHours.includes('undefined')) {
    validHours.push({ type: 'Evening', days: site.eveningDays, hours: site.eveningHours });
  }
  if (site.saturdayHours && site.saturdayHours !== 'N/A' && !site.saturdayHours.includes('undefined')) {
    validHours.push({ type: 'Saturday', days: null, hours: site.saturdayHours });
  }

  // Parse assistant principals
  const apNames = site.assistantPrincipal ? site.assistantPrincipal.split('/').map(n => n.trim()).filter(Boolean) : [];
  const apEmails = site.apEmail ? site.apEmail.split('/').map(e => e.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Directory
          </Link>
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{site.siteName}</h1>
                {site.status && (
                  <span
                    className={`px-3 py-1 text-sm rounded-full font-medium ${
                      site.status === 'Open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {site.status}
                  </span>
                )}
                <span
                  className={`px-3 py-1 text-sm rounded-full font-medium ${
                    site.category === 'adult-ed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {site.category === 'adult-ed' ? 'Adult Education' : 'Youth Programs'}
                </span>
              </div>
              <p className="text-xl text-gray-600">{site.program}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {site.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  About This Program
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {site.description}
                </p>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                Contact Information
              </h2>
              
              <div className="space-y-4">
                {site.buildingAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-gray-900">
                        {site.buildingAddress}
                        {site.borough && `, ${site.borough}`}
                        {site.zipCode && ` ${site.zipCode}`}
                      </p>
                      {hasCoordinates && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
                        >
                          Open in Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {site.businessPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <a
                        href={`tel:${site.businessPhone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {site.businessPhone}
                      </a>
                    </div>
                  </div>
                )}

                {site.dbn && (
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">DBN</p>
                      <p className="text-gray-900">{site.dbn}</p>
                    </div>
                  </div>
                )}

                {site.lcgmsBuildingCode && (
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">LCGMS Building Code</p>
                      <p className="text-gray-900">{site.lcgmsBuildingCode}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Staff Information */}
            {(site.principal || site.principalEmail || site.assistantPrincipal || site.apEmail) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Staff Information
                </h2>
                
                <div className="space-y-4">
                  {(site.principal || site.principalEmail) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Principal</p>
                      <div className="space-y-1">
                        {site.principal && (
                          <p className="text-gray-900">{site.principal}</p>
                        )}
                        {site.principalEmail && (
                          <a
                            href={`mailto:${site.principalEmail.toLowerCase()}`}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            {site.principalEmail.toLowerCase()}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {(apNames.length > 0 || apEmails.length > 0) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Assistant Principal{apNames.length > 1 || apEmails.length > 1 ? 's' : ''}
                      </p>
                      <div className="space-y-2">
                        {Array.from({ length: Math.max(apNames.length, apEmails.length) }).map((_, i) => (
                          <div key={i} className="space-y-1">
                            {apNames[i] && (
                              <p className="text-gray-900">{apNames[i]}</p>
                            )}
                            {apEmails[i] && (
                              <a
                                href={`mailto:${apEmails[i].toLowerCase()}`}
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                              >
                                {apEmails[i].toLowerCase()}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hours */}
            {validHours.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Operating Hours
                </h2>
                
                <div className="space-y-3">
                  {validHours.map((hour, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-medium text-gray-900">{hour.type}</p>
                      {hour.days && (
                        <p className="text-sm text-gray-600">{hour.days}</p>
                      )}
                      <p className="text-gray-700">{hour.hours}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Information */}
            {site.subject && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
                <p className="text-gray-700">
                  <span className="font-medium">Subject:</span> {site.subject}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar with Map */}
          <div className="space-y-6">
            {/* Map */}
            {hasCoordinates && mapboxToken ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                <div className="h-[400px] w-full">
                  <StaticMap
                    latitude={site.latitude!}
                    longitude={site.longitude!}
                    mapboxToken={mapboxToken}
                    zoom={15}
                    siteName={site.siteName}
                  />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Coordinates:</span> {site.latitude?.toFixed(6)}, {site.longitude?.toFixed(6)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                <div className="h-[400px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Location coordinates not available</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/map"
                  className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  View on Map
                </Link>
                <Link
                  href="/"
                  className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
                >
                  Back to Directory
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}


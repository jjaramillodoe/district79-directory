'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'mapbox-gl/dist/mapbox-gl.css';

const Map = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.Map),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

const Marker = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.Popup),
  { ssr: false }
);

const NavigationControl = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.NavigationControl),
  { ssr: false }
);

export interface Site {
  _id: string;
  dbn: string;
  program: string;
  siteName: string;
  buildingAddress?: string;
  borough?: string;
  zipCode?: string;
  businessPhone?: string;
  latitude?: number | null;
  longitude?: number | null;
  category: 'adult-ed' | 'youth';
}

interface SiteMapProps {
  sites: Site[];
  selectedSite?: string;
  onSiteSelect?: (siteId: string) => void;
  mapboxToken: string;
}

export default function SiteMap({
  sites,
  selectedSite,
  onSiteSelect,
  mapboxToken,
}: SiteMapProps) {
  const [popupInfo, setPopupInfo] = useState<Site | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState({
    longitude: -74.0060,
    latitude: 40.7128,
    zoom: 10,
  });

  // Generate icon index for each program (consistent hash-based assignment)
  const getProgramIcon = useCallback((program: string): number => {
    if (!program) return 1;
    let hash = 0;
    for (let i = 0; i < program.length; i++) {
      hash = program.charCodeAt(i) + ((hash << 5) - hash);
    }
    const iconCount = 17;
    const index = Math.abs(hash) % iconCount;
    return index + 1;
  }, []);

  // Filter sites with valid coordinates
  const sitesWithCoordinates = useMemo(
    () =>
      sites.filter(
        (site) =>
          site.latitude != null &&
          site.longitude != null &&
          !isNaN(site.latitude) &&
          !isNaN(site.longitude) &&
          isFinite(site.latitude) &&
          isFinite(site.longitude)
      ),
    [sites]
  );

  // Update view state when sites change
  useEffect(() => {
    if (sitesWithCoordinates.length > 0) {
      const avgLat =
        sitesWithCoordinates.reduce(
          (sum, site) => sum + (site.latitude || 0),
          0
        ) / sitesWithCoordinates.length;
      const avgLng =
        sitesWithCoordinates.reduce(
          (sum, site) => sum + (site.longitude || 0),
          0
        ) / sitesWithCoordinates.length;

      setViewState((prev) => ({
        ...prev,
        latitude: avgLat,
        longitude: avgLng,
        zoom: sitesWithCoordinates.length === 1 ? 14 : 10,
      }));
    }
  }, [sitesWithCoordinates.length]);

  // Handle site selection
  const handleMarkerClick = (site: Site) => {
    setPopupInfo(site);
    if (onSiteSelect) {
      onSiteSelect(site._id);
    }
  };

  // Update popup when selectedSite changes externally
  useEffect(() => {
    if (selectedSite) {
      const site = sites.find((s) => s._id === selectedSite);
      if (site && site.latitude && site.longitude) {
        setPopupInfo(site);
        setViewState((prev) => ({
          ...prev,
          latitude: site.latitude!,
          longitude: site.longitude!,
          zoom: 14,
        }));
      }
    }
  }, [selectedSite, sites]);

  if (!mapboxToken) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600">Mapbox token is required</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="h-full w-full">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={() => setIsMapLoaded(true)}
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        {isMapLoaded && <NavigationControl position="top-right" />}

        {isMapLoaded && sitesWithCoordinates.map((site) => {
          if (!site.latitude || !site.longitude) return null;

          const iconNumber = getProgramIcon(site.program);
          const isSelected = selectedSite === site._id;

          return (
            <Marker
              key={site._id}
              longitude={site.longitude}
              latitude={site.latitude}
              anchor="bottom"
              onClick={(e) => {
                if (e?.originalEvent) {
                  e.originalEvent.stopPropagation();
                }
                handleMarkerClick(site);
              }}
            >
              <div
                className={`cursor-pointer transform transition-all ${
                  isSelected ? 'scale-125' : 'hover:scale-110'
                }`}
              >
                <img
                  src={`/images/icons/icon${iconNumber}.png`}
                  alt={`${site.program} icon`}
                  width={40}
                  height={40}
                  className="drop-shadow-lg"
                  style={{ pointerEvents: 'none', display: 'block' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.endsWith('/images/icons/icon1.png')) {
                      target.src = '/images/icons/icon1.png';
                    }
                  }}
                />
              </div>
            </Marker>
          );
        })}

        {popupInfo && popupInfo.latitude && popupInfo.longitude && (
          <Popup
            anchor="top"
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-gray-900 mb-1">
                {popupInfo.siteName}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{popupInfo.program}</p>
              {popupInfo.buildingAddress && (
                <p className="text-xs text-gray-500 mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 inline mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {popupInfo.buildingAddress}
                  {popupInfo.borough && `, ${popupInfo.borough}`}
                </p>
              )}
              {popupInfo.businessPhone && (
                <p className="text-xs text-gray-500 mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 inline mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <a
                    href={`tel:${popupInfo.businessPhone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {popupInfo.businessPhone}
                  </a>
                </p>
              )}
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  popupInfo.category === 'adult-ed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {popupInfo.category === 'adult-ed' ? 'Adult Ed' : 'Youth'}
              </span>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}


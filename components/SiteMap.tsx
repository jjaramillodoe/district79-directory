'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface Site {
  _id: string;
  dbn: string;
  program: string;
  siteName: string;
  status?: string;
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

// Color palette for 17 different programs
const PROGRAM_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52BE80', // Green
  '#EC7063', // Coral
  '#5DADE2', // Light Blue
  '#F1948A', // Pink
  '#73C6B6', // Teal
  '#F39C12', // Dark Orange
  '#58D68D', // Light Green
  '#AF7AC5', // Lavender
];

// Generate consistent color for program
const getProgramColor = (program: string): string => {
  if (!program) return PROGRAM_COLORS[0];
  
  let hash = 0;
  for (let i = 0; i < program.length; i++) {
    hash = program.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % PROGRAM_COLORS.length;
  return PROGRAM_COLORS[index];
};

export default function SiteMap({
  sites,
  selectedSite,
  onSiteSelect,
  mapboxToken,
}: SiteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filter sites with valid coordinates
  const validSites = useMemo(
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

  // Convert sites to GeoJSON format
  const geoJsonData = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: validSites.map((site) => ({
        type: 'Feature' as const,
        properties: {
          id: site._id,
          siteName: site.siteName || 'Unknown',
          program: site.program || '',
          buildingAddress: site.buildingAddress || '',
          borough: site.borough || '',
          zipCode: site.zipCode || '',
          businessPhone: site.businessPhone || '',
          category: site.category || 'adult-ed',
          color: getProgramColor(site.program || ''),
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [site.longitude!, site.latitude!],
        },
      })),
    };
  }, [validSites]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    // Initialize map with NYC center
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.0060, 40.7128],
      zoom: 10,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setIsLoaded(false);
    };
  }, [mapboxToken]);

  // Update map source and layers when data changes
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const mapInstance = map.current;

    // Remove existing source and layers if they exist
    if (mapInstance.getSource('sites')) {
      if (mapInstance.getLayer('clusters')) mapInstance.removeLayer('clusters');
      if (mapInstance.getLayer('cluster-count')) mapInstance.removeLayer('cluster-count');
      if (mapInstance.getLayer('unclustered-point')) mapInstance.removeLayer('unclustered-point');
      mapInstance.removeSource('sites');
    }

    // Add GeoJSON source with clustering
    mapInstance.addSource('sites', {
      type: 'geojson',
      data: geoJsonData,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points
      clusterRadius: 50, // Radius of each cluster
    });

    // Add cluster circles layer
    mapInstance.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'sites',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1',
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40,
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });

    // Add cluster count labels
    mapInstance.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'sites',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });

    // Add individual markers layer with program colors
    mapInstance.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'sites',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    // Click handler for clusters
    mapInstance.on('click', 'clusters', (e) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ['clusters'],
      });
      const clusterId = features[0].properties?.cluster_id;
      const source = mapInstance.getSource('sites') as mapboxgl.GeoJSONSource;
      
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        mapInstance.easeTo({
          center: (e.lngLat as any),
          zoom: zoom as number,
        });
      });
    });

    // Click handler for individual markers
    mapInstance.on('click', 'unclustered-point', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const props = feature.properties;
      if (!props) return;

      const coordinates = (feature.geometry as GeoJSON.Point).coordinates;
      
      // Close existing popup
      if (popupRef.current) {
        popupRef.current.remove();
      }

      // Create enhanced popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'popup-content';
      popupContent.style.cssText = 'min-width: 250px; padding: 0;';
      popupContent.innerHTML = `
        <div style="padding: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${props.color}; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${props.siteName}</h3>
          </div>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #4B5563; font-weight: 500;">${props.program || 'N/A'}</p>
          ${
            props.buildingAddress
              ? `<div style="margin-bottom: 6px; font-size: 13px; color: #6B7280;">
                  <svg style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                  ${props.buildingAddress}${props.borough ? `, ${props.borough}` : ''}${props.zipCode ? ` ${props.zipCode}` : ''}
                </div>`
              : ''
          }
          ${
            props.businessPhone
              ? `<div style="margin-bottom: 6px; font-size: 13px; color: #6B7280;">
                  <svg style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                  <a href="tel:${props.businessPhone}" style="color: #2563EB; text-decoration: none;">${props.businessPhone}</a>
                </div>`
              : ''
          }
          <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight: 500; display: inline-block; ${
              props.category === 'adult-ed'
                ? 'background-color: #DBEAFE; color: #1E40AF;'
                : 'background-color: #F3E8FF; color: #6B21A8;'
            }">
              ${props.category === 'adult-ed' ? 'Adult Ed' : 'Youth'}
            </span>
            <a href="/site/${props.id}" style="font-size: 12px; color: #2563EB; text-decoration: none; font-weight: 500; padding: 4px 0;" onMouseOver="this.style.textDecoration='underline'" onMouseOut="this.style.textDecoration='none'">
              View Details →
            </a>
          </div>
        </div>
      `;

      // Create and show popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'site-popup',
      })
        .setLngLat([coordinates[0], coordinates[1]])
        .setDOMContent(popupContent)
        .addTo(mapInstance);

      popupRef.current = popup;

      // Callback for site selection
      if (onSiteSelect) {
        onSiteSelect(props.id);
      }

      // Fly to marker
      mapInstance.flyTo({
        center: [coordinates[0], coordinates[1]],
        zoom: 15,
        duration: 500,
      });
    });

    // Change cursor on hover
    mapInstance.on('mouseenter', 'clusters', () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    });
    mapInstance.on('mouseleave', 'clusters', () => {
      mapInstance.getCanvas().style.cursor = '';
    });

    mapInstance.on('mouseenter', 'unclustered-point', () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    });
    mapInstance.on('mouseleave', 'unclustered-point', () => {
      mapInstance.getCanvas().style.cursor = '';
    });

    // Fit bounds to all sites if we have them
    if (validSites.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validSites.forEach((site) => {
        if (site.latitude && site.longitude) {
          bounds.extend([site.longitude, site.latitude]);
        }
      });
      
      if (validSites.length === 1) {
        mapInstance.flyTo({
          center: [validSites[0].longitude!, validSites[0].latitude!],
          zoom: 14,
          duration: 1000,
        });
      } else {
        mapInstance.fitBounds(bounds, {
          padding: 50,
          duration: 1000,
        });
      }
    }
  }, [geoJsonData, isLoaded, onSiteSelect, validSites]);

  // Handle selected site changes
  useEffect(() => {
    if (!map.current || !isLoaded || !selectedSite) return;

    const site = validSites.find((s) => s._id === selectedSite);
    if (site && site.latitude && site.longitude) {
      // Find the feature and trigger popup
      const feature = geoJsonData.features.find((f) => f.properties.id === selectedSite);
      if (feature) {
        // Close existing popup
        if (popupRef.current) {
          popupRef.current.remove();
        }

        // Create popup (reuse the same logic)
        const props = feature.properties;
        const coordinates = feature.geometry.coordinates;

        const popupContent = document.createElement('div');
        popupContent.className = 'popup-content';
        popupContent.style.cssText = 'min-width: 250px; padding: 0;';
        popupContent.innerHTML = `
          <div style="padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${props.color}; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${props.siteName}</h3>
            </div>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4B5563; font-weight: 500;">${props.program || 'N/A'}</p>
            ${
              props.buildingAddress
                ? `<div style="margin-bottom: 6px; font-size: 13px; color: #6B7280;">
                    <svg style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                    </svg>
                    ${props.buildingAddress}${props.borough ? `, ${props.borough}` : ''}${props.zipCode ? ` ${props.zipCode}` : ''}
                  </div>`
                : ''
            }
            ${
              props.businessPhone
                ? `<div style="margin-bottom: 6px; font-size: 13px; color: #6B7280;">
                    <svg style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                    <a href="tel:${props.businessPhone}" style="color: #2563EB; text-decoration: none;">${props.businessPhone}</a>
                  </div>`
                : ''
            }
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight: 500; display: inline-block; ${
                props.category === 'adult-ed'
                  ? 'background-color: #DBEAFE; color: #1E40AF;'
                  : 'background-color: #F3E8FF; color: #6B21A8;'
              }">
                ${props.category === 'adult-ed' ? 'Adult Ed' : 'Youth'}
              </span>
              <a href="/site/${props.id}" style="font-size: 12px; color: #2563EB; text-decoration: none; font-weight: 500; padding: 4px 0;" onMouseOver="this.style.textDecoration='underline'" onMouseOut="this.style.textDecoration='none'">
                View Details →
              </a>
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
        })
          .setLngLat([coordinates[0], coordinates[1]])
          .setDOMContent(popupContent)
          .addTo(map.current);

        popupRef.current = popup;
      }

      map.current.flyTo({
        center: [site.longitude, site.latitude],
        zoom: 15,
        duration: 500,
      });
    }
  }, [selectedSite, validSites, isLoaded, geoJsonData]);

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
    <>
      <div ref={mapContainer} className="h-full w-full" style={{ minHeight: '400px' }} />
      <style jsx global>{`
        .site-popup .mapboxgl-popup-content {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .site-popup .mapboxgl-popup-close-button {
          font-size: 20px;
          color: #6B7280;
          padding: 4px 8px;
        }
        .site-popup .mapboxgl-popup-close-button:hover {
          color: #111827;
        }
      `}</style>
    </>
  );
}

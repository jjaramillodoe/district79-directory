'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { parseLatLng } from '@/lib/coordinates';

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

const CATEGORY_COLOR: Record<string, string> = {
  'adult-ed': '#003F87',
  youth: '#7C3AED',
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function popupHtml(props: {
  id: string;
  siteName: string;
  program: string;
  buildingAddress?: string;
  borough?: string;
  zipCode?: string;
  businessPhone?: string;
  category: string;
  color: string;
}) {
  const address = [props.buildingAddress, props.borough, props.zipCode].filter(Boolean).join(', ');
  const isAdult = props.category === 'adult-ed';
  return `
    <div class="d79-popup">
      <div class="d79-popup-title">
        <span class="d79-popup-dot" style="background:${props.color}"></span>
        <strong>${escapeHtml(props.siteName)}</strong>
      </div>
      <p class="d79-popup-program">${escapeHtml(props.program || 'N/A')}</p>
      ${address ? `<p class="d79-popup-meta">${escapeHtml(address)}</p>` : ''}
      ${
        props.businessPhone
          ? `<p class="d79-popup-meta"><a href="tel:${escapeHtml(props.businessPhone)}">${escapeHtml(props.businessPhone)}</a></p>`
          : ''
      }
      <div class="d79-popup-footer">
        <span class="d79-popup-badge" style="${
          isAdult ? 'background:#E8F3FC;color:#003F87' : 'background:#F3E8FF;color:#6B21A8'
        }">${isAdult ? 'Adult Ed' : 'Youth'}</span>
        <a href="/site/${escapeHtml(props.id)}">View details →</a>
      </div>
    </div>
  `;
}

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

  const validSites = useMemo(
    () =>
      sites.flatMap((site) => {
        const coords = parseLatLng(site);
        return coords ? [{ ...site, ...coords }] : [];
      }),
    [sites]
  );

  const geoJsonData = useMemo(
    () => ({
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
          color: CATEGORY_COLOR[site.category] || CATEGORY_COLOR['adult-ed'],
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [site.longitude, site.latitude],
        },
      })),
    }),
    [validSites]
  );

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.006, 40.7128],
      zoom: 10,
      minZoom: 6,
      maxZoom: 16,
      projection: 'mercator',
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      map.current?.resize();
      setIsLoaded(true);
    });

    return () => {
      popupRef.current?.remove();
      map.current?.remove();
      map.current = null;
      setIsLoaded(false);
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current || !isLoaded) return;
    const mapInstance = map.current;

    if (mapInstance.getSource('sites')) {
      if (mapInstance.getLayer('clusters')) mapInstance.removeLayer('clusters');
      if (mapInstance.getLayer('cluster-count')) mapInstance.removeLayer('cluster-count');
      if (mapInstance.getLayer('unclustered-point')) mapInstance.removeLayer('unclustered-point');
      mapInstance.removeSource('sites');
    }

    mapInstance.addSource('sites', {
      type: 'geojson',
      data: geoJsonData,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    mapInstance.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'sites',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#0078D4',
          25,
          '#003F87',
          75,
          '#002A5C',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 18, 25, 24, 75, 32],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

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
      paint: { 'text-color': '#ffffff' },
    });

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

    const openPopup = (props: Record<string, string>, coordinates: [number, number]) => {
      popupRef.current?.remove();
      const popup = new mapboxgl.Popup({
        offset: 18,
        closeButton: true,
        closeOnClick: false,
        className: 'site-popup',
      })
        .setLngLat(coordinates)
        .setHTML(popupHtml(props as never))
        .addTo(mapInstance);
      popupRef.current = popup;
    };

    const onClusterClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0]?.properties?.cluster_id;
      const source = mapInstance.getSource('sites') as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        mapInstance.easeTo({ center: e.lngLat, zoom });
      });
    };

    const onPointClick = (e: mapboxgl.MapMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature?.properties) return;
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
      openPopup(feature.properties, coordinates);
      onSiteSelect?.(feature.properties.id);
      mapInstance.flyTo({ center: coordinates, zoom: 14, duration: 500 });
    };

    mapInstance.on('click', 'clusters', onClusterClick);
    mapInstance.on('click', 'unclustered-point', onPointClick);

    const pointer = () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    };
    const reset = () => {
      mapInstance.getCanvas().style.cursor = '';
    };
    mapInstance.on('mouseenter', 'clusters', pointer);
    mapInstance.on('mouseleave', 'clusters', reset);
    mapInstance.on('mouseenter', 'unclustered-point', pointer);
    mapInstance.on('mouseleave', 'unclustered-point', reset);

    if (validSites.length === 1) {
      mapInstance.flyTo({
        center: [validSites[0].longitude, validSites[0].latitude],
        zoom: 13,
        duration: 800,
      });
    } else if (validSites.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      validSites.forEach((site) => bounds.extend([site.longitude, site.latitude]));
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const tooWide = ne.lat - sw.lat > 4 || Math.abs(ne.lng - sw.lng) > 4;
      if (tooWide) {
        mapInstance.jumpTo({ center: [-74.006, 40.7128], zoom: 10 });
      } else {
        mapInstance.fitBounds(bounds, { padding: 60, duration: 800, maxZoom: 13 });
      }
    }

    return () => {
      mapInstance.off('click', 'clusters', onClusterClick);
      mapInstance.off('click', 'unclustered-point', onPointClick);
      mapInstance.off('mouseenter', 'clusters', pointer);
      mapInstance.off('mouseleave', 'clusters', reset);
      mapInstance.off('mouseenter', 'unclustered-point', pointer);
      mapInstance.off('mouseleave', 'unclustered-point', reset);
    };
  }, [geoJsonData, isLoaded, onSiteSelect, validSites]);

  useEffect(() => {
    if (!map.current || !isLoaded || !selectedSite) return;
    const site = validSites.find((s) => s._id === selectedSite);
    if (!site?.latitude || !site.longitude) return;

    const feature = geoJsonData.features.find((f) => f.properties.id === selectedSite);
    if (!feature) return;

    popupRef.current?.remove();
    const popup = new mapboxgl.Popup({
      offset: 18,
      closeButton: true,
      closeOnClick: false,
      className: 'site-popup',
    })
      .setLngLat(feature.geometry.coordinates as [number, number])
      .setHTML(popupHtml(feature.properties))
      .addTo(map.current);
    popupRef.current = popup;

    map.current.flyTo({
      center: [site.longitude, site.latitude],
      zoom: 14,
      duration: 500,
    });
  }, [selectedSite, validSites, isLoaded, geoJsonData]);

  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100">
        <p className="text-red-600">Mapbox token is required</p>
      </div>
    );
  }

  return (
    <>
      <div ref={mapContainer} className="h-full w-full" />
      <style jsx global>{`
        .site-popup .mapboxgl-popup-content {
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 8px 24px rgb(0 63 135 / 0.12);
        }
        .site-popup .mapboxgl-popup-close-button {
          font-size: 18px;
          color: #64748b;
          padding: 6px 10px;
        }
        .d79-popup { padding: 14px 16px 12px; min-width: 220px; }
        .d79-popup-title { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
        .d79-popup-dot { width: 10px; height: 10px; border-radius: 99px; margin-top: 5px; flex-shrink: 0; }
        .d79-popup-title strong { font-size: 15px; color: #0f172a; line-height: 1.3; }
        .d79-popup-program { margin: 0 0 6px; font-size: 13px; color: #334155; }
        .d79-popup-meta { margin: 0 0 4px; font-size: 12px; color: #64748b; }
        .d79-popup-meta a { color: #0078D4; }
        .d79-popup-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; }
        .d79-popup-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
        .d79-popup-footer a { font-size: 12px; font-weight: 600; color: #003F87; text-decoration: none; }
      `}</style>
    </>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface StaticMapProps {
  latitude: number;
  longitude: number;
  mapboxToken: string;
  zoom?: number;
  siteName?: string;
}

export default function StaticMap({
  latitude,
  longitude,
  mapboxToken,
  zoom = 14,
  siteName,
}: StaticMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [longitude, latitude],
      zoom: zoom,
      interactive: true,
      scrollZoom: true,
      boxZoom: true,
      dragRotate: false,
      dragPan: true,
      keyboard: true,
      doubleClickZoom: true,
      touchZoomRotate: true,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#EF4444';
    el.style.border = '3px solid #FFFFFF';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';

    marker.current = new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .addTo(map.current!);

    // Cleanup
    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, mapboxToken, zoom]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
}


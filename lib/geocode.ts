/**
 * Geocode site addresses for storage on the map.
 *
 * NYC sites: NYC Planning GeoSearch (official PAD data).
 * Fallback / out-of-city sites: Mapbox Geocoding v6 with permanent=true,
 * which is required because we store coordinates in MongoDB.
 */

import { isValidLatLng } from '@/lib/coordinates';

export interface GeocodeResult {
  latitude: number | null;
  longitude: number | null;
  error?: string;
  source?: 'nyc-geosearch' | 'mapbox';
}

const NYC_BOROUGHS = new Set([
  'manhattan',
  'brooklyn',
  'queens',
  'bronx',
  'the bronx',
  'staten island',
  'staten-island',
  'rockaway',
  'new york',
]);

const OUTSIDE_NYC_BOROUGHS = new Set([
  'yonkers',
  'buffalo',
  'rochester',
  'albany',
  'dobbs ferry',
  'ellenville',
  'fallsburg',
  'out of borough',
  'na',
  'n/a',
]);

function buildQuery(address: string, borough?: string, zipCode?: string): string {
  const parts = [address.trim()];
  if (borough?.trim()) parts.push(borough.trim());
  if (zipCode?.trim()) parts.push(`NY ${zipCode.trim()}`);
  else if (borough?.trim()) parts.push('NY');
  return parts.join(', ');
}

function shouldTryNycGeosearch(borough?: string, zipCode?: string): boolean {
  const b = (borough || '').trim().toLowerCase();
  if (b && OUTSIDE_NYC_BOROUGHS.has(b)) return false;
  if (b && NYC_BOROUGHS.has(b)) return true;

  const zip = Number((zipCode || '').replace(/\D/g, '').slice(0, 5));
  if (
    (zip >= 10001 && zip <= 10499) ||
    (zip >= 11001 && zip <= 11499) ||
    (zip >= 10301 && zip <= 10314) ||
    (zip >= 11691 && zip <= 11697)
  ) {
    return true;
  }

  return !b;
}

function coordsFromFeature(feature: unknown): { latitude: number; longitude: number } | null {
  const geometry = (feature as { geometry?: { coordinates?: unknown } } | undefined)?.geometry;
  const coords = geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const longitude = Number(coords[0]);
  const latitude = Number(coords[1]);
  if (!isValidLatLng(latitude, longitude)) return null;
  return { latitude, longitude };
}

async function geocodeWithNycGeosearch(query: string): Promise<GeocodeResult | null> {
  const url = `https://geosearch.planninglabs.nyc/v2/search?${new URLSearchParams({
    text: query,
    size: '1',
  })}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  const data = await response.json();
  const coords = coordsFromFeature(data?.features?.[0]);
  if (!coords) return null;
  return { ...coords, source: 'nyc-geosearch' };
}

async function geocodeWithMapbox(query: string): Promise<GeocodeResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return { latitude: null, longitude: null, error: 'Mapbox access token is missing' };
  }

  const params = new URLSearchParams({
    q: query,
    access_token: token,
    permanent: 'true',
    autocomplete: 'false',
    limit: '1',
    country: 'us',
    proximity: '-74.006,40.7128',
  });

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`);
  if (!response.ok) {
    const detail = response.status === 403 || response.status === 402
      ? ' Mapbox permanent geocoding requires a card on file in the Mapbox account.'
      : '';
    return {
      latitude: null,
      longitude: null,
      error: `Mapbox geocoding failed (${response.status}).${detail}`,
    };
  }

  const data = await response.json();
  const coords = coordsFromFeature(data?.features?.[0]);
  if (!coords) {
    return { latitude: null, longitude: null, error: 'Address not found' };
  }
  return { ...coords, source: 'mapbox' };
}

export async function geocodeAddress(
  address: string,
  borough?: string,
  zipCode?: string
): Promise<GeocodeResult> {
  if (!address?.trim()) {
    return { latitude: null, longitude: null, error: 'Address is required' };
  }

  const query = buildQuery(address, borough, zipCode);

  try {
    if (shouldTryNycGeosearch(borough, zipCode)) {
      const nycResult = await geocodeWithNycGeosearch(query);
      if (nycResult) return nycResult;
    }

    return await geocodeWithMapbox(query);
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      latitude: null,
      longitude: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function geocodeBatch(
  addresses: Array<{ address: string; borough?: string; zipCode?: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<Array<GeocodeResult>> {
  const results: GeocodeResult[] = [];

  for (let i = 0; i < addresses.length; i++) {
    const { address, borough, zipCode } = addresses[i];
    results.push(await geocodeAddress(address, borough, zipCode));
    onProgress?.(i + 1, addresses.length);
  }

  return results;
}

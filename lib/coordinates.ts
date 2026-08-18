export type LatLng = { latitude: number; longitude: number };

/** True when lat/lng are finite numbers inside a real geographic range. */
export function isValidLatLng(latitude: unknown, longitude: unknown): boolean {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function parseLatLng(site: { latitude?: unknown; longitude?: unknown }): LatLng | null {
  if (!isValidLatLng(site.latitude, site.longitude)) return null;
  return { latitude: Number(site.latitude), longitude: Number(site.longitude) };
}

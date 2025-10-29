/**
 * Geocoding utility using OpenStreetMap's Nominatim API
 * Free service with rate limiting: max 1 request per second
 * 
 * Usage: https://nominatim.org/release-docs/develop/api/Search/
 */

interface GeocodeResult {
  latitude: number | null;
  longitude: number | null;
  error?: string;
}

export async function geocodeAddress(
  address: string,
  borough?: string,
  zipCode?: string
): Promise<GeocodeResult> {
  if (!address) {
    return { latitude: null, longitude: null };
  }

  try {
    // Build full address for better geocoding accuracy
    let fullAddress = address;
    if (borough) {
      fullAddress += `, ${borough}`;
    }
    if (zipCode) {
      fullAddress += `, NY ${zipCode}`;
    } else if (borough) {
      fullAddress += ', NY';
    }

    // Use Nominatim API (free, requires user agent and rate limiting)
    const query = encodeURIComponent(fullAddress);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`;

    // Add delay to respect rate limiting (1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'District79-Directory/1.0 (contact: jjaramillo7@schools.nyc.gov)', // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.error(`Geocoding API error: ${response.status}`);
      return { latitude: null, longitude: null, error: `API error: ${response.status}` };
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };
    }

    return { latitude: null, longitude: null, error: 'Address not found' };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      latitude: null,
      longitude: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch geocode with proper rate limiting
 * Processes addresses one at a time with 1 second delay between requests
 */
export async function geocodeBatch(
  addresses: Array<{ address: string; borough?: string; zipCode?: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<Array<GeocodeResult>> {
  const results: GeocodeResult[] = [];

  for (let i = 0; i < addresses.length; i++) {
    const { address, borough, zipCode } = addresses[i];
    const result = await geocodeAddress(address, borough, zipCode);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, addresses.length);
    }

    // Rate limiting: 1 request per second (already handled in geocodeAddress)
    // Additional delay only needed if not the last item
    if (i < addresses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}


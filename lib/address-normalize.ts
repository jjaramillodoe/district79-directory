/**
 * Address normalization utility for NYC addresses
 * Standardizes addresses to a consistent format
 */

interface NormalizedAddress {
  streetNumber: string;
  streetName: string;
  fullAddress: string;
  normalized: string;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;
  
  // Special cases for 11th, 12th, 13th
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }
  
  // Regular cases
  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Common NYC street abbreviations and their standard forms
 */
const STREET_ABBREVIATIONS: Record<string, string> = {
  'st': 'Street',
  'street': 'Street',
  'ave': 'Avenue',
  'avenue': 'Avenue',
  'av': 'Avenue',
  'blvd': 'Boulevard',
  'boulevard': 'Boulevard',
  'rd': 'Road',
  'road': 'Road',
  'dr': 'Drive',
  'drive': 'Drive',
  'ln': 'Lane',
  'lane': 'Lane',
  'pl': 'Place',
  'place': 'Place',
  'ct': 'Court',
  'court': 'Court',
  'pkwy': 'Parkway',
  'parkway': 'Parkway',
  'pky': 'Parkway',
  'ter': 'Terrace',
  'terrace': 'Terrace',
  'cir': 'Circle',
  'circle': 'Circle',
  'sq': 'Square',
  'square': 'Square',
  'bl': 'Boulevard',
  'n': 'North',
  's': 'South',
  'e': 'East',
  'w': 'West',
  'north': 'North',
  'south': 'South',
  'east': 'East',
  'west': 'West',
};

/**
 * Directional abbreviations
 */
const DIRECTIONAL_ABBREVIATIONS: Record<string, string> = {
  'n': 'North',
  's': 'South',
  'e': 'East',
  'w': 'West',
  'n.': 'North',
  's.': 'South',
  'e.': 'East',
  'w.': 'North',
};

/**
 * Normalize a NYC address to a standard format
 * Handles numbered streets like "5800 20 Avenue" correctly
 * @param address - The address string to normalize
 * @returns Normalized address string
 */
export function normalizeNYCAddress(address: string): string {
  if (!address) return '';

  // Remove extra whitespace
  let normalized = address.trim();

  // Remove common punctuation that causes issues
  normalized = normalized.replace(/,+/g, ',');
  normalized = normalized.replace(/\s+/g, ' ');

  // PRE-PROCESSING: Remove incorrectly placed ordinal suffixes from building numbers
  // Match pattern like "751st Briggs" where a number with ordinal is followed by a non-number
  // This fixes addresses that were incorrectly normalized previously
  normalized = normalized.replace(/^(\d+)(st|nd|rd|th)\s+([A-Za-z])/i, '$1 $3');

  // Split address into parts
  const parts = normalized.split(/[\s,]+/).filter(p => p);

  if (parts.length === 0) return '';

  // Extract building number (first token if it starts with a digit and is followed by a non-numbered street)
  // For numbered streets like "20 Avenue", we need special handling
  let buildingNumber = '';
  let streetParts: string[] = [];
  
  // Check if first token is a building number
  // If we have at least 2 parts and the second is a number followed by a street type, 
  // then first is building number (e.g., "5800 20 Avenue")
  // If second part is not a number, first might be building number (e.g., "123 Main St")
  if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
    const secondPart = parts[1].toLowerCase();
    const thirdPart = parts.length >= 3 ? parts[2].toLowerCase() : '';
    
    // Check if second part is a numbered street (number followed by street type, or just a number before street type)
    const isNumberedStreet = 
      /^\d+/.test(parts[1]) || // Second part is a number (like "20" in "20 Avenue")
      /^\d+(st|nd|rd|th)$/.test(secondPart) || // Second part is ordinal (like "5th")
      (thirdPart && STREET_ABBREVIATIONS[thirdPart]); // Third part is a street type (like "Avenue" in "20 Avenue")
    
    if (isNumberedStreet) {
      // First part is building number, rest is street name
      buildingNumber = parts[0];
      streetParts = parts.slice(1);
    } else if (STREET_ABBREVIATIONS[secondPart]) {
      // Second part is a street type, so first is building number
      buildingNumber = parts[0];
      streetParts = parts.slice(1);
    } else if (!/^\d+$/.test(secondPart)) {
      // Second part is NOT a number and NOT a street type, so first part is likely building number
      // (e.g., "751 Briggs Highway" - "Briggs" is not a number, so 751 is building number)
      buildingNumber = parts[0];
      streetParts = parts.slice(1);
    } else {
      // Fallback: keep all parts in street name
      streetParts = parts;
    }
  } else if (parts.length >= 1 && /^\d+/.test(parts[0])) {
    // Only one part starting with digit - might be just a numbered street
    streetParts = parts;
  } else {
    // No building number
    streetParts = parts;
  }

  // Normalize street name parts
  const normalizedParts: string[] = [];
  
  for (let i = 0; i < streetParts.length; i++) {
    const part = streetParts[i].toLowerCase();
    const nextPart = i < streetParts.length - 1 ? streetParts[i + 1].toLowerCase() : '';
    
    // Handle ordinal numbers (1st, 2nd, 3rd, 4th, etc.)
    if (/^\d+(st|nd|rd|th)$/.test(part)) {
      const num = part.match(/^\d+/)?.[0];
      const suffix = part.match(/(st|nd|rd|th)$/)?.[1];
      if (num && suffix) {
        // Convert to ordinal format
        normalizedParts.push(num + suffix);
        continue;
      }
    }
    
    // Handle directional prefixes (N, S, E, W) - but only if not part of a numbered street
    if (i === 0 && DIRECTIONAL_ABBREVIATIONS[part] && !/^\d+/.test(part)) {
      normalizedParts.push(DIRECTIONAL_ABBREVIATIONS[part]);
      continue;
    }
    
    // Handle street type abbreviations (last token or second-to-last if there's a directional)
    const isLast = i === streetParts.length - 1;
    const isSecondToLast = i === streetParts.length - 2;
    
    if ((isLast || isSecondToLast) && STREET_ABBREVIATIONS[part]) {
      normalizedParts.push(STREET_ABBREVIATIONS[part]);
    } else if (/^\d+$/.test(part)) {
      // This is a plain number - only add ordinal suffix if next part is a street type
      // (like "20" in "20 Avenue", but NOT "751" in "751 Briggs")
      const nextPartIsStreetType = nextPart && STREET_ABBREVIATIONS[nextPart];
      
      if (nextPartIsStreetType) {
        // Numbered street - add ordinal suffix
        const num = parseInt(part, 10);
        const suffix = getOrdinalSuffix(num);
        normalizedParts.push(`${num}${suffix}`);
      } else {
        // Just a number in the street name (like in "Route 9"), keep as is
        normalizedParts.push(part);
      }
    } else {
      // Capitalize first letter of each word
      normalizedParts.push(part.charAt(0).toUpperCase() + part.slice(1));
    }
  }

  // Reconstruct address
  const streetName = normalizedParts.join(' ');
  const fullAddress = buildingNumber ? `${buildingNumber} ${streetName}` : streetName;

  return fullAddress.trim();
}

/**
 * Use NYC GeoSearch API to standardize address (requires API call)
 * This is more accurate but requires internet connection
 * @param address - The address to standardize
 * @param borough - Optional borough name
 * @returns Standardized address from NYC GeoSearch API
 */
export async function standardizeNYCAddressAPI(
  address: string,
  borough?: string
): Promise<{ standardized: string; error?: string }> {
  if (!address) {
    return { standardized: '', error: 'Address is required' };
  }

  try {
    // Build query for NYC GeoSearch
    let query = address;
    if (borough) {
      query += ` ${borough} NY`;
    }

    // NYC GeoSearch API endpoint
    const url = `https://geosearch.planninglabs.nyc/v1/search?text=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        standardized: address,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // GeoSearch returns an array of features
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const properties = feature.properties;

      // Extract standardized address from GeoSearch response
      // The response structure may vary, so we check for common fields
      const standardized =
        properties.label ||
        properties.name ||
        properties.address ||
        address;

      return { standardized };
    }

    return {
      standardized: address,
      error: 'Address not found in NYC GeoSearch',
    };
  } catch (error) {
    console.error('NYC GeoSearch API error:', error);
    return {
      standardized: address,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Normalize address with optional API fallback
 * @param address - The address to normalize
 * @param useAPI - Whether to use NYC GeoSearch API if normalization doesn't change address
 * @param borough - Optional borough name for API calls
 * @returns Normalized address
 */
export async function normalizeAddress(
  address: string,
  useAPI: boolean = false,
  borough?: string
): Promise<string> {
  // First, try simple normalization
  const normalized = normalizeNYCAddress(address);

  // If useAPI is true and address seems complex, try API
  if (useAPI && normalized !== address) {
    const apiResult = await standardizeNYCAddressAPI(address, borough);
    if (!apiResult.error && apiResult.standardized) {
      return apiResult.standardized;
    }
  }

  return normalized;
}

/**
 * Batch normalize addresses
 * @param addresses - Array of addresses to normalize
 * @param useAPI - Whether to use API (note: API has rate limits)
 * @returns Array of normalized addresses
 */
export async function normalizeAddressesBatch(
  addresses: string[],
  useAPI: boolean = false
): Promise<string[]> {
  const results: string[] = [];

  for (const address of addresses) {
    const normalized = await normalizeAddress(address, useAPI);
    results.push(normalized);
    
    // Rate limiting if using API (1 request per second)
    if (useAPI) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}


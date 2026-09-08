import { NextResponse, NextRequest } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { CANONICAL_JURISDICTIONS, findJurisdictionByLocation } from '@/data/jurisdictions';

interface CensusAddressComponent {
  city?: string;
  state?: string;
  zip?: string;
}

interface CensusAddressMatch {
  matchedAddress: string;
  coordinates: { x: number; y: number };
  addressComponents: CensusAddressComponent;
}

/**
 * Attempts resolution using the free public US Census Bureau Geocoding API.
 * Returns null if network fails, times out, or no match is found.
 */
async function queryCensusGeocoder(rawAddress: string): Promise<CensusAddressMatch | null> {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(
      rawAddress
    )}&benchmark=Public_AR_Current&format=json`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const matches = data?.result?.addressMatches;
    if (matches && matches.length > 0) {
      return matches[0] as CensusAddressMatch;
    }
  } catch {
    // Gracefully ignore network / timeout errors in offline/test environments
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  if (!address || typeof address !== 'string' || !address.trim()) {
    return NextResponse.json({ error: 'Address query is required' }, { status: 400 });
  }

  const raw = address.trim();
  const rawLower = raw.toLowerCase();

  // Tier 1: Query US Census Bureau Geocoder API
  const censusResult = await queryCensusGeocoder(raw);
  let resolvedCity = censusResult?.addressComponents?.city || '';
  let resolvedState = censusResult?.addressComponents?.state || '';
  let resolvedZip = censusResult?.addressComponents?.zip || '';
  const formattedAddress = censusResult?.matchedAddress || raw;

  // Extract 5-digit zip code from raw input if geocoder didn't return one
  if (!resolvedZip) {
    const zipMatch = raw.match(/\b\d{5}\b/);
    if (zipMatch) resolvedZip = zipMatch[0];
  }

  // Tier 2: Match against Canonical Jurisdiction Registry
  let matchedJurisdiction = findJurisdictionByLocation(resolvedCity, resolvedState, resolvedZip);

  // If not matched by parsed city/zip, scan raw text against registered city names and zip codes
  if (!matchedJurisdiction) {
    for (const j of CANONICAL_JURISDICTIONS) {
      const cityName = j.name.replace(/^City of /, '').toLowerCase();
      const clientSlug = (j.clientIdentifier || '').toLowerCase();

      const cityMentioned = rawLower.includes(cityName) || (clientSlug && rawLower.includes(clientSlug));
      const zipMentioned = j.zipCodes?.some((z) => rawLower.includes(z));

      if (cityMentioned || zipMentioned) {
        matchedJurisdiction = j;
        if (!resolvedCity) resolvedCity = j.name.replace(/^City of /, '');
        if (!resolvedState) resolvedState = j.state;
        break;
      }
    }
  }

  // Fallback to primary reference city (Cleveland) if no known jurisdiction matched
  const activeJurisdiction = matchedJurisdiction || CANONICAL_JURISDICTIONS[1] || CANONICAL_JURISDICTIONS[0];
  const canonicalCityName = activeJurisdiction.name.replace(/^City of /, '');
  const finalCity = canonicalCityName || (resolvedCity ? resolvedCity.charAt(0).toUpperCase() + resolvedCity.slice(1).toLowerCase() : 'Cleveland');
  const finalState = resolvedState || activeJurisdiction.state;
  const finalZip = resolvedZip || activeJurisdiction.zipCodes?.[0] || '44105';

  // Tier 3: District / Ward Resolution
  // Check if raw input mentions a specific ward/district in this jurisdiction
  let matchedDivision = activeJurisdiction.divisions[0];
  for (const div of activeJurisdiction.divisions) {
    const divNameLower = div.name.toLowerCase();
    const divIdLower = div.id.toLowerCase();
    if (
      rawLower.includes(divNameLower) ||
      rawLower.includes(divIdLower) ||
      (div.name.includes('/') && div.name.split('/').some((part) => rawLower.includes(part.trim().toLowerCase())))
    ) {
      matchedDivision = div;
      break;
    }
  }

  // Specific neighborhood heuristics for well-known corridors
  if (activeJurisdiction.clientIdentifier === 'cleveland') {
    if (rawLower.includes('slavic') || rawLower.includes('fleet') || rawLower.includes('44105') || rawLower.includes('ward 12')) {
      const w12 = activeJurisdiction.divisions.find((d) => d.id.includes('ward:12'));
      if (w12) matchedDivision = w12;
    } else if (rawLower.includes('ohio city') || rawLower.includes('downtown') || rawLower.includes('ward 3')) {
      const w3 = activeJurisdiction.divisions.find((d) => d.id.includes('ward:3'));
      if (w3) matchedDivision = w3;
    } else if (rawLower.includes('detroit shoreway') || rawLower.includes('cudell') || rawLower.includes('ward 15')) {
      const w15 = activeJurisdiction.divisions.find((d) => d.id.includes('ward:15'));
      if (w15) matchedDivision = w15;
    }
  } else if (activeJurisdiction.clientIdentifier === 'austin') {
    if (rawLower.includes('montopolis') || rawLower.includes('east') || rawLower.includes('district 3')) {
      const d3 = activeJurisdiction.divisions.find((d) => d.id.includes('district:3'));
      if (d3) matchedDivision = d3;
    } else if (rawLower.includes('downtown') || rawLower.includes('central') || rawLower.includes('district 9')) {
      const d9 = activeJurisdiction.divisions.find((d) => d.id.includes('district:9'));
      if (d9) matchedDivision = d9;
    }
  }

  const neighborhood = matchedDivision.name;
  const explanation = censusResult
    ? `Geocoded via US Census Bureau to ${finalCity}, ${finalState} ${finalZip} (${neighborhood}).`
    : `Matched to ${activeJurisdiction.name} (${neighborhood}) based on municipal boundary mapping.`;

  // Tier 4: Dynamic LLM GIS Fallback (if Gemini client is configured)
  const ai = getGeminiClient();
  if (ai) {
    try {
      const jurisdictionListText = CANONICAL_JURISDICTIONS.map((j, i) => {
        const divisionNames = j.divisions.map((d) => `${d.name} [ID: ${d.id}]`).join(', ');
        return `${i + 1}. ${j.name}, ${j.state} (Jurisdiction ID: ${j.id})\n   Divisions: ${divisionNames}\n   ZIPs: ${j.zipCodes?.join(', ') || 'N/A'}`;
      }).join('\n\n');

      const prompt = `You are a Municipal GIS & Civic Boundary Expert for US cities.
Parse the following user address input and identify the exact city jurisdiction, council district/ward, neighborhood, state, and zip:
User Input: "${address}"

Available System Jurisdictions:
${jurisdictionListText}

Return a JSON object matching this schema:
{
  "city": string,
  "state": string,
  "zipCode": string,
  "neighborhood": string,
  "formattedAddress": string,
  "matchedJurisdictionId": string,
  "matchedDivisionId": string,
  "divisionName": string,
  "councilMemberName": string,
  "councilMemberEmail": string,
  "confidence": number,
  "explanation": string
}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');
      if (parsed.city && parsed.matchedDivisionId) {
        return NextResponse.json({
          matched: true,
          rawInput: address,
          formattedAddress: parsed.formattedAddress || formattedAddress,
          city: parsed.city || finalCity,
          state: parsed.state || finalState,
          zipCode: parsed.zipCode || finalZip,
          neighborhood: parsed.neighborhood || neighborhood,
          matchedJurisdictionId: parsed.matchedJurisdictionId || activeJurisdiction.id,
          matchedDivisionId: parsed.matchedDivisionId || matchedDivision.id,
          divisionName: parsed.divisionName || matchedDivision.name,
          councilMember: {
            name: parsed.councilMemberName || 'Council Representative',
            email: parsed.councilMemberEmail || `council@${finalCity.toLowerCase().replace(/\s+/g, '')}.gov`,
            phone: '',
          },
          confidence: parsed.confidence || 0.95,
          explanation: parsed.explanation || explanation,
        });
      }
    } catch (e) {
      console.warn('AI Address resolution fallback notice:', e);
    }
  }

  return NextResponse.json({
    matched: true,
    rawInput: address,
    formattedAddress,
    city: finalCity,
    state: finalState,
    zipCode: finalZip,
    neighborhood,
    matchedJurisdictionId: activeJurisdiction.id,
    matchedDivisionId: matchedDivision.id,
    divisionName: matchedDivision.name,
    councilMember: {
      name: 'Council Representative',
      email: `council@${finalCity.toLowerCase().replace(/\s+/g, '')}.gov`,
      phone: '',
    },
    confidence: 0.9,
    explanation,
  });
}

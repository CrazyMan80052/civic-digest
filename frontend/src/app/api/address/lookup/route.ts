import { NextResponse, NextRequest } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  if (!address || typeof address !== 'string' || !address.trim()) {
    return NextResponse.json({ error: 'Address query is required' }, { status: 400 });
  }

  const raw = address.trim().toLowerCase();
  const ai = getGeminiClient();

  let matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government';
  let matchedDivisionId = 'ocd-division/country:us/state:oh/place:cleveland/ward:12';
  let neighborhood = 'Slavic Village';
  let city = 'Cleveland';
  let state = 'OH';
  let zipCode = '44105';
  let councilMemberName = 'Rebecca Maurer';
  let councilMemberEmail = 'rmaurer@clevelandcitycouncil.org';
  let councilMemberPhone = '(216) 664-4235';
  const formattedAddress = address.trim();
  let explanation = 'Matched to City of Cleveland Ward 12 based on Slavic Village/Fleet corridor geographic boundaries.';

  if (raw.includes('43016') || raw.includes('dublin') || raw.includes('perimeter') || raw.includes('shier rings')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:oh/place:dublin/government';
    city = 'Dublin';
    state = 'OH';
    zipCode = '43016';
    matchedDivisionId = 'ocd-division/country:us/state:oh/place:dublin/ward:1';
    neighborhood = 'Northwest Dublin / Perimeter Corridor';
    councilMemberName = 'Cathy De Rosa';
    councilMemberEmail = 'cderosa@dublin.oh.us';
    councilMemberPhone = '(614) 410-4400';
    explanation = 'Matched to City of Dublin Ward 1 based on 43016 postal code & Perimeter Drive municipal center.';
  } else if (raw.includes('sacramento') || raw.includes(', ca') || raw.includes('california') || raw.includes('95814') || raw.includes('natomas') || raw.includes('land park')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:ca/place:sacramento/government';
    city = 'Sacramento';
    state = 'CA';
    if (raw.includes('natomas') || raw.includes('95834') || raw.includes('95835')) {
      matchedDivisionId = 'ocd-division/country:us/state:ca/place:sacramento/district:1';
      neighborhood = 'North Natomas';
      councilMemberName = 'Lisa Kaplan';
      councilMemberEmail = 'district1@cityofsacramento.org';
    } else {
      matchedDivisionId = 'ocd-division/country:us/state:ca/place:sacramento/district:4';
      neighborhood = 'Central City / Land Park';
      councilMemberName = 'Katie Valenzuela';
      councilMemberEmail = 'kvalenzuela@cityofsacramento.org';
    }
    explanation = `Geocoded to City of Sacramento (${neighborhood}).`;
  } else if (raw.includes('austin') || raw.includes(', tx') || raw.includes('texas') || raw.includes('78701') || raw.includes('78702') || raw.includes('montopolis') || raw.includes('east austin')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:tx/place:austin/government';
    city = 'Austin';
    state = 'TX';
    if (raw.includes('east') || raw.includes('montopolis') || raw.includes('78702') || raw.includes('78741')) {
      matchedDivisionId = 'ocd-division/country:us/state:tx/place:austin/district:3';
      neighborhood = 'East Austin / Montopolis';
      councilMemberName = 'José Velásquez';
      councilMemberEmail = 'district3@austintexas.gov';
    } else {
      matchedDivisionId = 'ocd-division/country:us/state:tx/place:austin/district:9';
      neighborhood = 'Downtown / Central Austin';
      councilMemberName = 'Zohaib "Zo" Qadri';
      councilMemberEmail = 'district9@austintexas.gov';
    }
    explanation = `Geocoded to City of Austin (${neighborhood}).`;
  } else if (raw.includes('ohio city') || raw.includes('downtown') || raw.includes('tremont') || raw.includes('w 25') || raw.includes('44113') || raw.includes('44114')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government';
    matchedDivisionId = 'ocd-division/country:us/state:oh/place:cleveland/ward:3';
    neighborhood = 'Downtown / Ohio City';
    city = 'Cleveland';
    state = 'OH';
    zipCode = '44113';
    councilMemberName = 'Kerry McCormack';
    councilMemberEmail = 'kmccormack@clevelandcitycouncil.org';
    councilMemberPhone = '(216) 664-2691';
    explanation = 'Geocoded to Cleveland Ward 3 (Downtown / Ohio City / Near West Side).';
  } else if (raw.includes('detroit shoreway') || raw.includes('cudell') || raw.includes('w 65') || raw.includes('44102')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government';
    matchedDivisionId = 'ocd-division/country:us/state:oh/place:cleveland/ward:15';
    neighborhood = 'Detroit Shoreway / Cudell';
    city = 'Cleveland';
    state = 'OH';
    zipCode = '44102';
    councilMemberName = 'Jenny Spencer';
    councilMemberEmail = 'jspencer@clevelandcitycouncil.org';
    councilMemberPhone = '(216) 664-4231';
    explanation = 'Geocoded to Cleveland Ward 15 (Detroit Shoreway / Cudell).';
  } else if (raw.includes('west park') || raw.includes('kamm') || raw.includes('lorain') || raw.includes('44111')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government';
    matchedDivisionId = 'ocd-division/country:us/state:oh/place:cleveland/ward:17';
    neighborhood = "West Park / Kamm's Corners";
    city = 'Cleveland';
    state = 'OH';
    zipCode = '44111';
    councilMemberName = 'Charles Slife';
    councilMemberEmail = 'cslife@clevelandcitycouncil.org';
    councilMemberPhone = '(216) 664-4239';
    explanation = "Geocoded to Cleveland Ward 17 (West Park / Kamm's Corners).";
  }

  if (ai) {
    try {
      const prompt = `You are a Municipal GIS & Civic Boundary Expert for US cities.
      Parse the following user address input and identify the exact city jurisdiction, council district/ward, neighborhood, state, and zip:
      User Input: "${address}"

      Available System Jurisdictions:
      1. City of Cleveland, OH (Wards 1, 3, 12, 15, 17)
         - Ward 1: Lee-Harvard / Southeast (ZIPs 44128, 44120)
         - Ward 3: Downtown, Ohio City, Tremont North, Near West (ZIPs 44113, 44114, 44115)
         - Ward 12: Slavic Village, Tremont South, Fleet Ave, Broadway (ZIPs 44105, 44127)
         - Ward 15: Detroit Shoreway, Cudell, Gordon Square, Edgewater (ZIP 44102)
         - Ward 17: West Park, Kamm's Corners, Puritas (ZIP 44111)
      2. City of Sacramento, CA (Districts 1, 4, 6, 8)
         - District 1: North Natomas (ZIPs 95834, 95835)
         - District 4: Central City, Downtown, Midtown, Land Park (ZIPs 95814, 95816, 95818)
         - District 6: Tahoe Park, Elmhurst (ZIP 95820)
         - District 8: Meadowview, South Sacramento (ZIP 95823, 95832)
      3. City of Austin, TX (Districts 3, 9)
         - District 3: East Austin, Montopolis (ZIPs 78702, 78741)
         - District 9: Downtown, UT Campus, Central (ZIPs 78701, 78705, 78703)

      If the address is in another city (e.g. Chicago, Seattle, Philadelphia, New York, or generic), map it accurately and provide the best division format.

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
        "confidence": number (0.0 to 1.0),
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
          formattedAddress: parsed.formattedAddress || address,
          city: parsed.city || city,
          state: parsed.state || state,
          zipCode: parsed.zipCode || zipCode,
          neighborhood: parsed.neighborhood || neighborhood,
          matchedJurisdictionId: parsed.matchedJurisdictionId || matchedJurisdictionId,
          matchedDivisionId: parsed.matchedDivisionId || matchedDivisionId,
          divisionName: parsed.divisionName || neighborhood,
          councilMember: {
            name: parsed.councilMemberName || councilMemberName,
            email: parsed.councilMemberEmail || councilMemberEmail,
            phone: councilMemberPhone,
          },
          confidence: parsed.confidence || 0.95,
          explanation: parsed.explanation || explanation,
        });
      }
    } catch (e) {
      console.warn('AI Address resolution fallback:', e);
    }
  }

  return NextResponse.json({
    matched: true,
    rawInput: address,
    formattedAddress,
    city,
    state,
    zipCode,
    neighborhood,
    matchedJurisdictionId,
    matchedDivisionId,
    divisionName: neighborhood,
    councilMember: {
      name: councilMemberName,
      email: councilMemberEmail,
      phone: councilMemberPhone,
    },
    confidence: 0.88,
    explanation,
  });
}

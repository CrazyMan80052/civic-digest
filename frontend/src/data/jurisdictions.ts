/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OCDJurisdiction } from '../types';

/**
 * Unified Jurisdiction Registry (Single Source of Truth)
 * Maps municipal entities to data providers (Legistar OData v1, Custom Portals, etc.)
 * and geographic boundary metadata.
 */
export const CANONICAL_JURISDICTIONS: OCDJurisdiction[] = [
  {
    id: 'ocd-jurisdiction/country:us/state:oh/place:dublin/government',
    name: 'City of Dublin',
    state: 'OH',
    level: 'city',
    provider: 'custom_portal',
    clientIdentifier: 'dublin',
    legistarClient: 'dublin',
    officialUrl: 'https://dublinohiousa.gov/city-council/legislation-minutes/',
    endpoint: 'https://dublinohiousa.gov/city-council/legislation-minutes/',
    councilSize: 7,
    zipCodes: ['43016', '43017'],
    divisions: [
      { id: 'ocd-division/country:us/state:oh/place:dublin/ward:1', name: 'Ward 1 (Northwest / 43016)', type: 'ward', representativeId: 'ocd-person/dub-1', population: 12400 },
      { id: 'ocd-division/country:us/state:oh/place:dublin/ward:2', name: 'Ward 2 (Southwest / Shier Rings)', type: 'ward', representativeId: 'ocd-person/dub-2', population: 11800 },
      { id: 'ocd-division/country:us/state:oh/place:dublin/ward:3', name: 'Ward 3 (Historic District / Central)', type: 'ward', representativeId: 'ocd-person/dub-3', population: 12100 },
      { id: 'ocd-division/country:us/state:oh/place:dublin/ward:4', name: 'Ward 4 (Southeast / Riverside)', type: 'ward', representativeId: 'ocd-person/dub-4', population: 13200 },
    ],
  },
  {
    id: 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government',
    name: 'City of Cleveland',
    state: 'OH',
    level: 'city',
    provider: 'legistar',
    clientIdentifier: 'cleveland',
    legistarClient: 'cleveland',
    officialUrl: 'https://cityofcleveland.org',
    endpoint: 'https://webapi.legistar.com/v1/cleveland/matters',
    councilSize: 17,
    zipCodes: ['44102', '44105', '44111', '44113', '44114', '44115', '44120', '44127', '44128'],
    divisions: [
      { id: 'ocd-division/country:us/state:oh/place:cleveland/ward:1', name: 'Ward 1 (Lee-Harvard)', type: 'ward', representativeId: 'ocd-person/cle-1', population: 20400 },
      { id: 'ocd-division/country:us/state:oh/place:cleveland/ward:3', name: 'Ward 3 (Downtown / Ohio City)', type: 'ward', representativeId: 'ocd-person/cle-3', population: 24800 },
      { id: 'ocd-division/country:us/state:oh/place:cleveland/ward:12', name: 'Ward 12 (Slavic Village / Tremont South)', type: 'ward', representativeId: 'ocd-person/cle-12', population: 21100 },
      { id: 'ocd-division/country:us/state:oh/place:cleveland/ward:15', name: 'Ward 15 (Detroit Shoreway / Cudell)', type: 'ward', representativeId: 'ocd-person/cle-15', population: 22600 },
      { id: 'ocd-division/country:us/state:oh/place:cleveland/ward:17', name: 'Ward 17 (West Park / Kamm\'s Corners)', type: 'ward', representativeId: 'ocd-person/cle-17', population: 23900 },
    ],
  },
  {
    id: 'ocd-jurisdiction/country:us/state:ca/place:sacramento/government',
    name: 'City of Sacramento',
    state: 'CA',
    level: 'city',
    provider: 'legistar',
    clientIdentifier: 'sacramento',
    legistarClient: 'sacramento',
    officialUrl: 'https://cityofsacramento.gov',
    endpoint: 'https://webapi.legistar.com/v1/sacramento/matters',
    councilSize: 9,
    zipCodes: ['95814', '95816', '95818', '95820', '95823', '95832', '95834', '95835'],
    divisions: [
      { id: 'ocd-division/country:us/state:ca/place:sacramento/district:1', name: 'District 1 (North Natomas)', type: 'district', representativeId: 'ocd-person/sac-1', population: 64000 },
      { id: 'ocd-division/country:us/state:ca/place:sacramento/district:4', name: 'District 4 (Central City / Land Park)', type: 'district', representativeId: 'ocd-person/sac-4', population: 68500 },
      { id: 'ocd-division/country:us/state:ca/place:sacramento/district:6', name: 'District 6 (Tahoe Park / Elmhurst)', type: 'district', representativeId: 'ocd-person/sac-6', population: 62100 },
      { id: 'ocd-division/country:us/state:ca/place:sacramento/district:8', name: 'District 8 (Meadowview / South Sac)', type: 'district', representativeId: 'ocd-person/sac-8', population: 66000 },
    ],
  },
  {
    id: 'ocd-jurisdiction/country:us/state:tx/place:austin/government',
    name: 'City of Austin',
    state: 'TX',
    level: 'city',
    provider: 'legistar',
    clientIdentifier: 'austin',
    legistarClient: 'austin',
    officialUrl: 'https://austintexas.gov',
    endpoint: 'https://webapi.legistar.com/v1/austin/matters',
    councilSize: 11,
    zipCodes: ['78701', '78702', '78703', '78704', '78705', '78741'],
    divisions: [
      { id: 'ocd-division/country:us/state:tx/place:austin/district:3', name: 'District 3 (East Austin / Montopolis)', type: 'district', representativeId: 'ocd-person/atx-3', population: 98000 },
      { id: 'ocd-division/country:us/state:tx/place:austin/district:9', name: 'District 9 (Downtown / Central)', type: 'district', representativeId: 'ocd-person/atx-9', population: 104000 },
    ],
  },
  {
    id: 'ocd-jurisdiction/country:us/state:il/place:chicago/government',
    name: 'City of Chicago',
    state: 'IL',
    level: 'city',
    provider: 'legistar',
    clientIdentifier: 'chicago',
    legistarClient: 'chicago',
    officialUrl: 'https://chicago.gov',
    endpoint: 'https://webapi.legistar.com/v1/chicago/matters',
    councilSize: 50,
    zipCodes: ['60601', '60602', '60603', '60604', '60605', '60611', '60614', '60622', '60647'],
    divisions: [
      { id: 'ocd-division/country:us/state:il/place:chicago/ward:1', name: 'Ward 1 (Logan Square / Wicker Park)', type: 'ward', population: 55000 },
      { id: 'ocd-division/country:us/state:il/place:chicago/ward:2', name: 'Ward 2 (Near North / Downtown)', type: 'ward', population: 56000 },
      { id: 'ocd-division/country:us/state:il/place:chicago/ward:4', name: 'Ward 4 (Bronzeville / Kenwood)', type: 'ward', population: 54000 },
      { id: 'ocd-division/country:us/state:il/place:chicago/ward:32', name: 'Ward 32 (Bucktown / Lincoln Park)', type: 'ward', population: 57000 },
      { id: 'ocd-division/country:us/state:il/place:chicago/ward:42', name: 'Ward 42 (Loop / River North)', type: 'ward', population: 58000 },
    ],
  },
  {
    id: 'ocd-jurisdiction/country:us/state:wa/place:seattle/government',
    name: 'City of Seattle',
    state: 'WA',
    level: 'city',
    provider: 'legistar',
    clientIdentifier: 'seattle',
    legistarClient: 'seattle',
    officialUrl: 'https://seattle.gov',
    endpoint: 'https://webapi.legistar.com/v1/seattle/matters',
    councilSize: 9,
    zipCodes: ['98101', '98102', '98103', '98104', '98109', '98115', '98122'],
    divisions: [
      { id: 'ocd-division/country:us/state:wa/place:seattle/district:3', name: 'District 3 (Capitol Hill / Central District)', type: 'district', population: 104000 },
      { id: 'ocd-division/country:us/state:wa/place:seattle/district:4', name: 'District 4 (University District / Wallingford)', type: 'district', population: 102000 },
      { id: 'ocd-division/country:us/state:wa/place:seattle/district:7', name: 'District 7 (Downtown / Queen Anne)', type: 'district', population: 108000 },
    ],
  },
  {
    id: 'ocd-jurisdiction/country:us/state:pa/place:philadelphia/government',
    name: 'City of Philadelphia',
    state: 'PA',
    level: 'city',
    provider: 'legistar',
    clientIdentifier: 'phila',
    legistarClient: 'phila',
    officialUrl: 'https://phila.gov',
    endpoint: 'https://webapi.legistar.com/v1/phila/matters',
    councilSize: 17,
    zipCodes: ['19102', '19103', '19104', '19106', '19107', '19147'],
    divisions: [
      { id: 'ocd-division/country:us/state:pa/place:philadelphia/district:1', name: 'District 1 (Center City / South Philly)', type: 'district', population: 160000 },
      { id: 'ocd-division/country:us/state:pa/place:philadelphia/district:3', name: 'District 3 (West Philadelphia)', type: 'district', population: 155000 },
    ],
  },
];

/**
 * Fast lookup helper by state and city name or zip code
 */
export function findJurisdictionByLocation(city?: string, state?: string, zipCode?: string): OCDJurisdiction | undefined {
  if (zipCode) {
    const cleanZip = zipCode.trim().slice(0, 5);
    const byZip = CANONICAL_JURISDICTIONS.find((j) => j.zipCodes?.includes(cleanZip));
    if (byZip) return byZip;
  }

  if (city) {
    const cleanCity = city.trim().toLowerCase();
    const cleanState = state?.trim().toUpperCase();

    const byName = CANONICAL_JURISDICTIONS.find((j) => {
      const matchCity = j.name.toLowerCase().includes(cleanCity) || cleanCity.includes(j.clientIdentifier || '');
      const matchState = !cleanState || j.state.toUpperCase() === cleanState;
      return matchCity && matchState;
    });
    if (byName) return byName;
  }

  return undefined;
}

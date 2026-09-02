import { NextResponse } from 'next/server';

export const SCRAPER_TARGETS = [
  {
    id: 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government',
    city: 'Cleveland',
    state: 'OH',
    clientName: 'cleveland',
    system: 'Legistar OData v1',
    endpoint: 'https://webapi.legistar.com/v1/cleveland/matters',
    councilSize: 17,
    status: 'active',
  },
  {
    id: 'ocd-jurisdiction/country:us/state:tx/place:austin/government',
    city: 'Austin',
    state: 'TX',
    clientName: 'austin',
    system: 'Legistar OData v1',
    endpoint: 'https://webapi.legistar.com/v1/austin/matters',
    councilSize: 11,
    status: 'active',
  },
  {
    id: 'ocd-jurisdiction/country:us/state:il/place:chicago/government',
    city: 'Chicago',
    state: 'IL',
    clientName: 'chicago',
    system: 'Legistar OData v1',
    endpoint: 'https://webapi.legistar.com/v1/chicago/matters',
    councilSize: 50,
    status: 'active',
  },
  {
    id: 'ocd-jurisdiction/country:us/state:wa/place:seattle/government',
    city: 'Seattle',
    state: 'WA',
    clientName: 'seattle',
    system: 'Legistar OData v1',
    endpoint: 'https://webapi.legistar.com/v1/seattle/matters',
    councilSize: 9,
    status: 'active',
  },
  {
    id: 'ocd-jurisdiction/country:us/state:pa/place:philadelphia/government',
    city: 'Philadelphia',
    state: 'PA',
    clientName: 'phila',
    system: 'Legistar OData v1',
    endpoint: 'https://webapi.legistar.com/v1/phila/matters',
    councilSize: 17,
    status: 'active',
  },
];

export async function GET() {
  return NextResponse.json(SCRAPER_TARGETS);
}

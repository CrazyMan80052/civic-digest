import { NextResponse } from 'next/server';
import { CANONICAL_JURISDICTIONS } from '@/data/jurisdictions';

export const SCRAPER_TARGETS = CANONICAL_JURISDICTIONS.map((j) => ({
  id: j.id,
  city: j.name.replace(/^City of /, ''),
  state: j.state,
  clientName: j.clientIdentifier || j.legistarClient,
  system: j.provider === 'custom_portal' ? `${j.name} Legislative Portal` : 'Legistar OData v1',
  endpoint: j.endpoint || `https://webapi.legistar.com/v1/${j.clientIdentifier || j.legistarClient}/matters`,
  councilSize: j.councilSize || (j.divisions ? j.divisions.length : 9),
  status: 'active',
}));

export async function GET() {
  return NextResponse.json(SCRAPER_TARGETS);
}

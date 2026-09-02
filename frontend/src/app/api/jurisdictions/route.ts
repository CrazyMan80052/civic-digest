import { NextResponse } from 'next/server';
import { CivicRepository } from '@/db/repository';

export async function GET() {
  try {
    const jurisdictions = await CivicRepository.getJurisdictions();
    return NextResponse.json(jurisdictions);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to retrieve jurisdictions' }, { status: 500 });
  }
}

import { NextResponse, NextRequest } from 'next/server';
import { CivicRepository } from '@/db/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jurisdictionId = searchParams.get('jurisdictionId') || undefined;
    const bills = await CivicRepository.getBills(jurisdictionId);
    return NextResponse.json(bills);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to retrieve bills' }, { status: 500 });
  }
}

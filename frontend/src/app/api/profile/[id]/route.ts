import { NextResponse, NextRequest } from 'next/server';
import { USER_PROFILES_STORE } from '@/lib/store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const profile = USER_PROFILES_STORE.get(resolvedParams.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  return NextResponse.json(profile);
}

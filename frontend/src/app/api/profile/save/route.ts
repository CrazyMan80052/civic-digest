import { NextResponse, NextRequest } from 'next/server';
import { USER_PROFILES_STORE } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const profile = await req.json();
    if (!profile || !profile.id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }
    profile.updatedAt = new Date().toISOString();
    USER_PROFILES_STORE.set(profile.id, profile);
    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}

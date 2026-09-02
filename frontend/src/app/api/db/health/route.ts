import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/db/client';

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  return NextResponse.json(dbHealth);
}

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/db/client';

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    database: dbHealth,
  });
}

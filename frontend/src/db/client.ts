/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from 'pg';
const { Pool } = pg;

// Singleton pool instance with lazy initialization
let poolInstance: pg.Pool | null = null;
let isDbConnected: boolean | null = null;
let lastDbError: string | null = null;

/**
 * Returns the active PostgreSQL Pool if DATABASE_URL is configured.
 * Does not crash if DATABASE_URL is unset.
 */
export function getDbPool(): pg.Pool | null {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.trim() === '') {
    return null;
  }

  if (!poolInstance) {
    try {
      poolInstance = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      poolInstance.on('error', (err) => {
        console.warn('PostgreSQL Pool background client error:', err.message);
        lastDbError = err.message;
      });
    } catch (err: any) {
      console.warn('PostgreSQL pool creation failed:', err?.message);
      lastDbError = err?.message || 'Failed to initialize pool';
      return null;
    }
  }

  return poolInstance;
}

/**
 * Diagnostic helper to verify PostgreSQL connectivity status
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  configured: boolean;
  dialect: string;
  error?: string | null;
  timestamp: string;
}> {
  const pool = getDbPool();
  const configured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);

  if (!configured || !pool) {
    return {
      connected: false,
      configured: false,
      dialect: 'in-memory (Mock Open Civic Data)',
      error: 'DATABASE_URL environment variable is not configured. Falling back to local OCD-ID store.',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW() as now, version() as version;');
      isDbConnected = true;
      lastDbError = null;
      return {
        connected: true,
        configured: true,
        dialect: 'PostgreSQL 14+ (Live)',
        timestamp: res.rows[0]?.now?.toISOString() || new Date().toISOString(),
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    isDbConnected = false;
    lastDbError = err?.message || 'Database connection refused';
    return {
      connected: false,
      configured: true,
      dialect: 'PostgreSQL (Offline/Unreachable)',
      error: lastDbError,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Executes a parameter query with safe catch
 */
export async function queryDb<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const pool = getDbPool();
  if (!pool) {
    throw new Error('DATABASE_URL is not configured');
  }

  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

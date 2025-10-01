import { NextResponse } from 'next/server';
import { ensureDatabaseExists } from '@/lib/database-init';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-db
 *
 * Diagnostic endpoint to test database download and access
 */
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'local',
    databaseBlobUrl: process.env.DATABASE_BLOB_URL ? 'SET' : 'NOT SET',
    blobToken: process.env.BLOB_READ_WRITE_TOKEN ? 'SET' : 'NOT SET',
  };

  try {
    // Test 1: Check if DATABASE_BLOB_URL is set
    if (!process.env.DATABASE_BLOB_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_BLOB_URL environment variable is not set',
        diagnostics,
      }, { status: 500 });
    }

    diagnostics.databaseUrl = process.env.DATABASE_BLOB_URL;

    // Test 2: Try to download/access database
    console.log('[test-db] Attempting to ensure database exists...');
    const dbPath = await ensureDatabaseExists();
    diagnostics.dbPath = dbPath;
    diagnostics.dbDownloaded = 'SUCCESS';

    // Test 3: Try to open database
    const Database = require('better-sqlite3');
    const db = new Database(dbPath, { readonly: true });

    // Test 4: Try to query database
    const count = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE task_image IS NOT NULL AND solution_image IS NOT NULL').get();
    diagnostics.taskCount = count.count;

    db.close();

    return NextResponse.json({
      success: true,
      message: 'Database connection test passed',
      diagnostics,
    });
  } catch (error) {
    diagnostics.error = error instanceof Error ? error.message : 'Unknown error';
    diagnostics.errorStack = error instanceof Error ? error.stack : undefined;

    console.error('[test-db] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      diagnostics,
    }, { status: 500 });
  }
}

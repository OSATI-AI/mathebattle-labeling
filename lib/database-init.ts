import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const DB_PATH = 'data/database/mathebattle_tasks.db';
const DB_BLOB_NAME = 'mathebattle_tasks.db';
const VERCEL_ENV = process.env.VERCEL_ENV; // 'production', 'preview', or undefined for local

/**
 * Ensures database exists, downloading from Blob storage if in Vercel environment
 */
export async function ensureDatabaseExists(): Promise<string> {
  const dbPath = path.resolve(process.cwd(), DB_PATH);

  // In local development, database should already exist
  if (!VERCEL_ENV) {
    if (fs.existsSync(dbPath)) {
      return dbPath;
    }
    throw new Error(`Database not found at ${dbPath}. Please ensure it exists for local development.`);
  }

  // In Vercel environment, use /tmp directory
  const tmpDbPath = `/tmp/${DB_BLOB_NAME}`;

  // Check if database already exists in /tmp (cached from previous invocation)
  if (fs.existsSync(tmpDbPath)) {
    const stats = fs.statSync(tmpDbPath);
    // If file is larger than 100MB, assume it's valid
    if (stats.size > 100 * 1024 * 1024) {
      return tmpDbPath;
    }
  }

  try {
    // Get database URL from environment variable
    const dbUrl = process.env.DATABASE_BLOB_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_BLOB_URL environment variable not set');
    }

    // Download database from Vercel Blob
    console.log('Downloading database from Vercel Blob...');
    const response = await fetch(dbUrl);
    if (!response.ok) {
      throw new Error(`Failed to download database: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to /tmp directory
    fs.writeFileSync(tmpDbPath, buffer);
    console.log(`Database downloaded successfully to ${tmpDbPath} (${buffer.length} bytes)`);

    return tmpDbPath;
  } catch (error) {
    console.error('Error downloading database from Blob:', error);
    throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload database to Vercel Blob (for initial setup)
 * This should be run once to upload the database
 */
export async function uploadDatabaseToBlob(): Promise<string> {
  const dbPath = path.resolve(process.cwd(), DB_PATH);

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database not found at ${dbPath}`);
  }

  const fileBuffer = fs.readFileSync(dbPath);

  console.log(`Uploading database (${fileBuffer.length} bytes) to Vercel Blob...`);

  const blob = await put(DB_BLOB_NAME, fileBuffer, {
    access: 'public',
  });

  console.log(`Database uploaded successfully to: ${blob.url}`);
  return blob.url;
}

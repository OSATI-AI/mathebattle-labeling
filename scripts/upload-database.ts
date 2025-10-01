/**
 * Script to upload the database to Vercel Blob storage
 *
 * Usage: ts-node scripts/upload-database.ts
 *
 * Make sure BLOB_READ_WRITE_TOKEN environment variable is set
 */

import { uploadDatabaseToBlob } from '../lib/database-init';

async function main() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
      console.error('Please set it in your .env.local file or export it:');
      console.error('export BLOB_READ_WRITE_TOKEN=your_token_here');
      process.exit(1);
    }

    console.log('Starting database upload to Vercel Blob...');
    const url = await uploadDatabaseToBlob();
    console.log('\n✅ Success! Database uploaded to:');
    console.log(url);
    console.log('\nUpdate lib/database-init.ts with this URL in the ensureDatabaseExists() function.');
  } catch (error) {
    console.error('❌ Error uploading database:', error);
    process.exit(1);
  }
}

main();

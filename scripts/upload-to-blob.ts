/**
 * Upload script to upload extracted data to Vercel Blob storage
 *
 * This script:
 * 1. Uploads tasks.jsonl
 * 2. Uploads all images from the images/ directory
 */

import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

async function uploadToBlob() {
  console.log('\n📤 Uploading to Vercel Blob storage\n');

  // Check for token
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ ERROR: BLOB_READ_WRITE_TOKEN environment variable not set');
    console.error('Set it in .env.local or export it before running this script\n');
    process.exit(1);
  }

  const blobDir = path.join(process.cwd(), 'data/blob');
  const imagesDir = path.join(blobDir, 'images');
  const tasksJsonlPath = path.join(blobDir, 'tasks.jsonl');

  // Verify files exist
  if (!fs.existsSync(tasksJsonlPath)) {
    console.error('❌ ERROR: tasks.jsonl not found');
    console.error('Run migrate-to-blob.ts first\n');
    process.exit(1);
  }

  if (!fs.existsSync(imagesDir)) {
    console.error('❌ ERROR: images/ directory not found');
    console.error('Run migrate-to-blob.ts first\n');
    process.exit(1);
  }

  try {
    // Upload tasks.jsonl
    console.log('📝 Uploading tasks.jsonl...');
    const tasksJsonlContent = fs.readFileSync(tasksJsonlPath, 'utf-8');
    const tasksJsonlBlob = await put('tasks.jsonl', tasksJsonlContent, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(`✓ Uploaded tasks.jsonl: ${tasksJsonlBlob.url}\n`);

    // Upload all images
    const imageFiles = fs.readdirSync(imagesDir);
    console.log(`📦 Uploading ${imageFiles.length} images...`);

    let uploadedCount = 0;
    for (const file of imageFiles) {
      const filePath = path.join(imagesDir, file);
      const fileBuffer = fs.readFileSync(filePath);

      await put(`images/${file}`, fileBuffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      uploadedCount++;
      if (uploadedCount % 100 === 0) {
        console.log(`  Uploaded ${uploadedCount}/${imageFiles.length} images...`);
      }
    }

    console.log(`✓ Uploaded ${uploadedCount} images\n`);
    console.log('✅ All files uploaded successfully!\n');
    console.log('Blob URLs:');
    console.log(`  tasks.jsonl: ${tasksJsonlBlob.url}`);
    console.log(`  images: [blob-url]/images/task-{id}-{type}.png\n`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadToBlob();

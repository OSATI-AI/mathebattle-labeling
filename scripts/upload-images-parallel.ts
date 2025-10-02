/**
 * Parallel batch upload script for images to Vercel Blob storage
 */

import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const BATCH_SIZE = 50; // Upload 50 images at a time

async function uploadImagesBatch(files: string[], imagesDir: string, token: string) {
  const promises = files.map(async (file) => {
    const filePath = path.join(imagesDir, file);
    const fileBuffer = fs.readFileSync(filePath);

    return put(`images/${file}`, fileBuffer, {
      access: 'public',
      token: token,
    });
  });

  return Promise.all(promises);
}

async function uploadAllImages() {
  console.log('\n📤 Uploading images to Vercel Blob storage (parallel batches)\n');

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ ERROR: BLOB_READ_WRITE_TOKEN not set');
    process.exit(1);
  }

  const imagesDir = path.join(process.cwd(), 'public/images');

  if (!fs.existsSync(imagesDir)) {
    console.error('❌ ERROR: public/images/ directory not found');
    process.exit(1);
  }

  try {
    const allFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png'));
    console.log(`📦 Found ${allFiles.length} images to upload\n`);

    let uploaded = 0;

    // Process in batches
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      await uploadImagesBatch(batch, imagesDir, process.env.BLOB_READ_WRITE_TOKEN!);

      uploaded += batch.length;
      console.log(`  ✓ Uploaded ${uploaded}/${allFiles.length} images (${Math.round(uploaded/allFiles.length*100)}%)`);
    }

    console.log(`\n✅ Successfully uploaded ${uploaded} images!\n`);
    console.log('Images are available at:');
    console.log(`  ${process.env.NEXT_PUBLIC_IMAGES_BASE_URL}/images/task-{id}-{type}.png\n`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadAllImages();

/**
 * Migration script to extract data from SQLite and prepare for blob storage
 *
 * This script:
 * 1. Reads all tasks from the SQLite database
 * 2. Extracts images as individual PNG files
 * 3. Creates a tasks.jsonl file with metadata
 * 4. Saves everything to data/blob/ directory for upload
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

interface TaskRow {
  task_id: number;
  name: string;
  description: string;
  classname: string;
  sek1: number;
  sek2: number;
  task_image: Buffer;
  solution_image: Buffer;
}

interface TaskMetadata {
  task_id: number;
  name: string;
  description: string;
  classname: string;
  sek1: number;
  sek2: number;
}

async function migrateToBlob() {
  console.log('\n🔄 Starting migration from SQLite to blob storage format\n');

  // Paths
  const dbPath = path.join(process.cwd(), 'data/database/mathebattle_tasks.db');
  const blobDir = path.join(process.cwd(), 'data/blob');
  const imagesDir = path.join(blobDir, 'images');
  const tasksJsonlPath = path.join(blobDir, 'tasks.jsonl');

  // Create directories
  if (!fs.existsSync(blobDir)) {
    fs.mkdirSync(blobDir, { recursive: true });
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log(`📁 Database: ${dbPath}`);
  console.log(`📁 Output directory: ${blobDir}\n`);

  // Open database
  console.log('📖 Opening database...');
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });

  // Get all tasks with images
  const query = `
    SELECT
      task_id,
      name,
      description,
      classname,
      sek1,
      sek2,
      task_image,
      solution_image
    FROM tasks
    WHERE task_image IS NOT NULL
      AND solution_image IS NOT NULL
    ORDER BY task_id
  `;

  console.log('🔍 Querying tasks...');
  const tasks = db.prepare(query).all() as TaskRow[];
  console.log(`✓ Found ${tasks.length} tasks with images\n`);

  // Extract images and create metadata
  console.log('📦 Extracting images and metadata...');
  const metadata: TaskMetadata[] = [];
  let imageCount = 0;

  for (const task of tasks) {
    // Save task image
    const taskImagePath = path.join(imagesDir, `task-${task.task_id}-task.png`);
    fs.writeFileSync(taskImagePath, task.task_image);
    imageCount++;

    // Save solution image
    const solutionImagePath = path.join(imagesDir, `task-${task.task_id}-solution.png`);
    fs.writeFileSync(solutionImagePath, task.solution_image);
    imageCount++;

    // Add metadata (without images)
    metadata.push({
      task_id: task.task_id,
      name: task.name,
      description: task.description,
      classname: task.classname,
      sek1: task.sek1,
      sek2: task.sek2,
    });

    if (metadata.length % 100 === 0) {
      console.log(`  Processed ${metadata.length} tasks...`);
    }
  }

  console.log(`✓ Extracted ${imageCount} images (${metadata.length} tasks)\n`);

  // Write tasks.jsonl
  console.log('📝 Writing tasks.jsonl...');
  const jsonlLines = metadata.map(task => JSON.stringify(task)).join('\n');
  fs.writeFileSync(tasksJsonlPath, jsonlLines, 'utf-8');
  console.log(`✓ Wrote ${metadata.length} lines to tasks.jsonl\n`);

  // Close database
  db.close();

  // Calculate sizes
  const tasksJsonlSize = (fs.statSync(tasksJsonlPath).size / 1024).toFixed(2);
  const imageFiles = fs.readdirSync(imagesDir);
  const totalImageSize = imageFiles.reduce((sum, file) => {
    return sum + fs.statSync(path.join(imagesDir, file)).size;
  }, 0);
  const totalImageSizeMB = (totalImageSize / (1024 * 1024)).toFixed(2);

  console.log('📊 Summary:');
  console.log(`  Tasks: ${metadata.length}`);
  console.log(`  Images: ${imageCount}`);
  console.log(`  tasks.jsonl size: ${tasksJsonlSize} KB`);
  console.log(`  Total images size: ${totalImageSizeMB} MB`);
  console.log(`\n✅ Migration complete! Files ready in ${blobDir}/\n`);
  console.log('Next steps:');
  console.log('  1. Upload images/ folder to Vercel Blob');
  console.log('  2. Upload tasks.jsonl to Vercel Blob');
  console.log('  3. Update API to use blob storage\n');
}

migrateToBlob().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});

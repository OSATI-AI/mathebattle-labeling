import { NextResponse } from 'next/server';
import { TaskLoader } from '@/lib/data';
import { seededShuffle } from '@/lib/shuffle';
import { ensureDatabaseExists } from '@/lib/database-init';

// Force dynamic rendering - do not pre-render this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/tasks
 *
 * Returns all tasks with base64-encoded images in a randomized order
 * Uses a fixed seed (42) to ensure consistent ordering across all labelers
 */
export async function GET() {
  let loader: TaskLoader | null = null;

  try {
    // Ensure database exists (downloads from Blob if in Vercel environment)
    const dbPath = await ensureDatabaseExists();

    // Initialize TaskLoader with database path
    loader = new TaskLoader(dbPath);

    // Get all tasks
    const tasks = loader.getAllTasks();

    // Shuffle with fixed seed (42) - same order for all labelers
    const shuffledTasks = seededShuffle(tasks, 42);

    return NextResponse.json({
      success: true,
      tasks: shuffledTasks,
      count: shuffledTasks.length,
    });
  } catch (error) {
    console.error('Error loading tasks:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    // Always close the database connection
    if (loader) {
      loader.close();
    }
  }
}

import { NextResponse } from 'next/server';
import { loadTasksMetadata } from '@/lib/blob-data';
import { seededShuffle } from '@/lib/shuffle';

// Force dynamic rendering - do not pre-render this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/tasks
 *
 * Returns all tasks metadata in a randomized order
 * Uses a fixed seed (42) to ensure consistent ordering across all labelers
 *
 * Now using Vercel Blob storage instead of SQLite for better performance
 */
export async function GET() {
  try {
    // Load task metadata from blob storage
    const tasks = await loadTasksMetadata();

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
  }
}

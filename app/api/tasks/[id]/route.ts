import { NextRequest, NextResponse } from 'next/server';
import { loadTask } from '@/lib/blob-data';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/tasks/[id]
 *
 * Returns a specific task with base64-encoded images
 *
 * Now using Vercel Blob storage for better performance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid task ID',
        },
        { status: 400 }
      );
    }

    // Load task with images from blob storage
    const task = await loadTask(taskId);

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(`Error loading task ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

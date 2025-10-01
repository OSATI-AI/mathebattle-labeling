import { NextResponse } from 'next/server';
import { TaskLoader } from '@/lib/data';

/**
 * GET /api/tasks/[id]
 *
 * Returns a single task by ID with base64-encoded images
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let loader: TaskLoader | null = null;

  try {
    // Parse task ID
    const taskId = parseInt(params.id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid task ID',
          message: 'Task ID must be a number',
        },
        { status: 400 }
      );
    }

    // Initialize TaskLoader
    loader = new TaskLoader('../../02_mathebattle/mathebattle_tasks.db');

    // Get task by ID
    const task = loader.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
          message: `No task found with ID ${taskId}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Error loading task:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    if (loader) {
      loader.close();
    }
  }
}

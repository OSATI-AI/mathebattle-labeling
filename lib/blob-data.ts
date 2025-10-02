/**
 * Blob storage data loader
 *
 * Replaces SQLite database with Vercel Blob storage for better performance
 * and proper serverless architecture.
 */

interface TaskMetadata {
  task_id: number;
  name: string;
  description: string;
  classname: string;
  sek1: number;
  sek2: number;
}

interface TaskWithImages {
  task_id: number;
  name: string;
  description: string;
  classname: string;
  sek1: number;
  sek2: number;
  task_image_base64: string | null;
  solution_image_base64: string | null;
}

// Blob storage URLs - set from environment
const TASKS_JSONL_URL = process.env.NEXT_PUBLIC_TASKS_JSONL_URL || '';
const IMAGES_BASE_URL = process.env.NEXT_PUBLIC_IMAGES_BASE_URL || '';

// Cache for tasks.jsonl (loaded once on cold start)
let tasksCache: TaskMetadata[] | null = null;

/**
 * Load tasks metadata from blob storage
 */
export async function loadTasksMetadata(): Promise<TaskMetadata[]> {
  // Return cached data if available
  if (tasksCache) {
    return tasksCache;
  }

  try {
    // Download tasks.jsonl from blob storage
    const response = await fetch(TASKS_JSONL_URL, {
      // Cache for 1 hour in production
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks.jsonl: ${response.statusText}`);
    }

    const jsonlText = await response.text();
    const lines = jsonlText.trim().split('\n');

    // Parse JSONL (one JSON object per line)
    const tasks = lines.map(line => JSON.parse(line) as TaskMetadata);

    // Cache for subsequent requests
    tasksCache = tasks;

    return tasks;
  } catch (error) {
    console.error('Error loading tasks metadata:', error);
    throw error;
  }
}

/**
 * Get a specific task with images
 */
export async function loadTask(taskId: number): Promise<TaskWithImages | null> {
  try {
    // Load metadata
    const allTasks = await loadTasksMetadata();
    const taskMetadata = allTasks.find(t => t.task_id === taskId);

    if (!taskMetadata) {
      return null;
    }

    // Load images from blob storage
    const [taskImageResponse, solutionImageResponse] = await Promise.all([
      fetch(`${IMAGES_BASE_URL}/images/task-${taskId}-task.png`, {
        // Cache images for 24 hours
        next: { revalidate: 86400 },
      }),
      fetch(`${IMAGES_BASE_URL}/images/task-${taskId}-solution.png`, {
        // Cache images for 24 hours
        next: { revalidate: 86400 },
      }),
    ]);

    if (!taskImageResponse.ok || !solutionImageResponse.ok) {
      console.error(`Failed to load images for task ${taskId}`);
      return null;
    }

    // Convert to base64
    const [taskImageBuffer, solutionImageBuffer] = await Promise.all([
      taskImageResponse.arrayBuffer(),
      solutionImageResponse.arrayBuffer(),
    ]);

    const taskImageBase64 = Buffer.from(taskImageBuffer).toString('base64');
    const solutionImageBase64 = Buffer.from(solutionImageBuffer).toString('base64');

    return {
      ...taskMetadata,
      task_image_base64: `data:image/png;base64,${taskImageBase64}`,
      solution_image_base64: `data:image/png;base64,${solutionImageBase64}`,
    };
  } catch (error) {
    console.error(`Error loading task ${taskId}:`, error);
    return null;
  }
}

/**
 * Get task count
 */
export async function getTaskCount(): Promise<number> {
  const tasks = await loadTasksMetadata();
  return tasks.length;
}

/**
 * Invalidate cache (for development/testing)
 */
export function invalidateCache() {
  tasksCache = null;
}

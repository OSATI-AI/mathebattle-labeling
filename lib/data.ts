import Database from 'better-sqlite3';
import path from 'path';
import { Task, TaskWithImages } from './types';

/**
 * Convert buffer to base64 data URI for image display
 */
export function bufferToBase64(buffer: Buffer): string {
  const base64 = buffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

/**
 * TaskLoader class for loading tasks from SQLite database
 */
export class TaskLoader {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Resolve path relative to project root
    const resolvedPath = path.resolve(process.cwd(), dbPath);

    // Initialize SQLite connection in readonly mode for safety
    this.db = new Database(resolvedPath, {
      readonly: true,
      fileMustExist: true
    });

    // Note: WAL mode requires write access, so we skip it in readonly mode
    // The database will still work fine for concurrent reads
  }

  /**
   * Load all tasks with images from database
   * Returns tasks with base64-encoded images for display
   */
  getAllTasks(): TaskWithImages[] {
    const query = `
      SELECT
        task_id,
        name,
        description,
        task_image,
        solution_image,
        classname,
        sek1,
        sek2
      FROM tasks
      WHERE task_image IS NOT NULL
        AND solution_image IS NOT NULL
      ORDER BY task_id
    `;

    const rows = this.db.prepare(query).all() as Task[];

    return rows.map(row => ({
      task_id: row.task_id,
      name: row.name,
      description: row.description,
      task_image_base64: row.task_image ? bufferToBase64(row.task_image) : null,
      solution_image_base64: row.solution_image ? bufferToBase64(row.solution_image) : null,
      classname: row.classname,
      sek1: row.sek1,
      sek2: row.sek2,
    }));
  }

  /**
   * Get a specific task by ID
   */
  getTask(taskId: number): TaskWithImages | null {
    const query = `
      SELECT
        task_id,
        name,
        description,
        task_image,
        solution_image,
        classname,
        sek1,
        sek2
      FROM tasks
      WHERE task_id = ?
        AND task_image IS NOT NULL
        AND solution_image IS NOT NULL
    `;

    const row = this.db.prepare(query).get(taskId) as Task | undefined;

    if (!row) {
      return null;
    }

    return {
      task_id: row.task_id,
      name: row.name,
      description: row.description,
      task_image_base64: row.task_image ? bufferToBase64(row.task_image) : null,
      solution_image_base64: row.solution_image ? bufferToBase64(row.solution_image) : null,
      classname: row.classname,
      sek1: row.sek1,
      sek2: row.sek2,
    };
  }

  /**
   * Get task count for progress tracking
   */
  getTaskCount(): number {
    const query = `
      SELECT COUNT(*) as count
      FROM tasks
      WHERE task_image IS NOT NULL
        AND solution_image IS NOT NULL
    `;

    const result = this.db.prepare(query).get() as { count: number };
    return result.count;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

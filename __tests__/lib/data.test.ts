/**
 * Tests for lib/data.ts - TaskLoader class
 */

import { TaskLoader } from '@/lib/data';
import path from 'path';

describe('TaskLoader', () => {
  let taskLoader: TaskLoader;
  const dbPath = path.resolve(process.cwd(), '../../02_mathebattle/mathebattle_tasks.db');

  beforeAll(() => {
    taskLoader = new TaskLoader(dbPath);
  });

  afterAll(() => {
    taskLoader.close();
  });

  describe('constructor', () => {
    it('should initialize successfully with valid database path', () => {
      expect(taskLoader).toBeDefined();
    });

    it('should throw error with invalid database path', () => {
      expect(() => new TaskLoader('/invalid/path/to/db.db')).toThrow();
    });
  });

  describe('getAllTasks', () => {
    it('should return array of tasks', () => {
      const tasks = taskLoader.getAllTasks();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('should return tasks with required fields', () => {
      const tasks = taskLoader.getAllTasks();
      const task = tasks[0];

      expect(task).toHaveProperty('task_id');
      expect(task).toHaveProperty('name');
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('task_image_base64');
      expect(task).toHaveProperty('solution_image_base64');
      expect(task).toHaveProperty('classname');
    });

    it('should convert images to base64 strings', () => {
      const tasks = taskLoader.getAllTasks();
      const taskWithImage = tasks.find(t => t.task_image_base64 !== null);

      if (taskWithImage) {
        expect(typeof taskWithImage.task_image_base64).toBe('string');
        expect(taskWithImage.task_image_base64?.startsWith('data:image/')).toBe(true);
      }
    });

    it('should return exactly 1252 tasks', () => {
      const tasks = taskLoader.getAllTasks();
      expect(tasks.length).toBe(1252);
    });

    it('should only include tasks with both images', () => {
      const tasks = taskLoader.getAllTasks();
      tasks.forEach(task => {
        expect(task.task_image_base64).not.toBeNull();
        expect(task.solution_image_base64).not.toBeNull();
      });
    });
  });

  describe('getTask', () => {
    it('should return task for valid task_id', () => {
      const tasks = taskLoader.getAllTasks();
      const firstTaskId = tasks[0].task_id;
      const task = taskLoader.getTask(firstTaskId);

      expect(task).toBeDefined();
      expect(task?.task_id).toBe(firstTaskId);
    });

    it('should return null for invalid task_id', () => {
      const task = taskLoader.getTask(999999);
      expect(task).toBeNull();
    });

    it('should return task with base64 images', () => {
      const tasks = taskLoader.getAllTasks();
      const firstTaskId = tasks[0].task_id;
      const task = taskLoader.getTask(firstTaskId);

      expect(task?.task_image_base64).toBeTruthy();
      expect(task?.solution_image_base64).toBeTruthy();
    });
  });
});

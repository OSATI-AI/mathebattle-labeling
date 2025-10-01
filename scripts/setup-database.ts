/**
 * Database verification script
 *
 * This script verifies:
 * 1. Database connection works
 * 2. Tasks can be loaded
 * 3. Images are present and can be converted to base64
 * 4. Standards file can be loaded and parsed
 * 5. Standards hierarchy navigation works
 */

import { TaskLoader } from '../lib/data';
import { StandardsNavigator } from '../lib/standards';
import path from 'path';
import fs from 'fs';

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(colors.green, `✓ ${message}`);
}

function logError(message: string) {
  log(colors.red, `✗ ${message}`);
}

function logInfo(message: string) {
  log(colors.blue, `ℹ ${message}`);
}

function logWarning(message: string) {
  log(colors.yellow, `⚠ ${message}`);
}

async function verifyDatabase() {
  logInfo('Starting database verification...\n');

  let hasErrors = false;

  // 1. Verify database file exists
  const dbPath = '../../02_mathebattle/mathebattle_tasks.db';
  const resolvedDbPath = path.resolve(process.cwd(), dbPath);

  logInfo(`Checking database path: ${resolvedDbPath}`);

  if (!fs.existsSync(resolvedDbPath)) {
    logError(`Database file not found at: ${resolvedDbPath}`);
    hasErrors = true;
    return;
  }
  logSuccess('Database file exists');

  // 2. Test database connection
  let loader: TaskLoader;
  try {
    loader = new TaskLoader(dbPath);
    logSuccess('Database connection established');
  } catch (error) {
    logError(`Failed to connect to database: ${error}`);
    hasErrors = true;
    return;
  }

  // 3. Test task count
  try {
    const count = loader.getTaskCount();
    logSuccess(`Found ${count} tasks with images`);

    if (count === 0) {
      logWarning('No tasks found with both task_image and solution_image');
    }
  } catch (error) {
    logError(`Failed to get task count: ${error}`);
    hasErrors = true;
  }

  // 4. Test loading all tasks
  try {
    const tasks = loader.getAllTasks();
    logSuccess(`Successfully loaded ${tasks.length} tasks`);

    if (tasks.length > 0) {
      const firstTask = tasks[0];
      logInfo(`First task: ID=${firstTask.task_id}, name="${firstTask.name}"`);

      // Verify base64 images
      if (firstTask.task_image_base64 && firstTask.task_image_base64.startsWith('data:image/png;base64,')) {
        logSuccess('Task images converted to base64 format');
      } else {
        logError('Task images not in correct base64 format');
        hasErrors = true;
      }

      if (firstTask.solution_image_base64 && firstTask.solution_image_base64.startsWith('data:image/png;base64,')) {
        logSuccess('Solution images converted to base64 format');
      } else {
        logError('Solution images not in correct base64 format');
        hasErrors = true;
      }
    }
  } catch (error) {
    logError(`Failed to load tasks: ${error}`);
    hasErrors = true;
  }

  // 5. Test loading specific task
  try {
    const tasks = loader.getAllTasks();
    if (tasks.length > 0) {
      const firstTaskId = tasks[0].task_id;
      const task = loader.getTask(firstTaskId);

      if (task) {
        logSuccess(`Successfully loaded task by ID: ${firstTaskId}`);
      } else {
        logError(`Failed to load task by ID: ${firstTaskId}`);
        hasErrors = true;
      }
    }
  } catch (error) {
    logError(`Failed to load task by ID: ${error}`);
    hasErrors = true;
  }

  // Close database connection
  loader.close();
  logSuccess('Database connection closed');

  logInfo('\n---\n');

  // 6. Verify standards file
  const standardsPath = '../../01_US_common_core/ATC/standards.jsonl';
  const resolvedStandardsPath = path.resolve(process.cwd(), standardsPath);

  logInfo(`Checking standards path: ${resolvedStandardsPath}`);

  if (!fs.existsSync(resolvedStandardsPath)) {
    logError(`Standards file not found at: ${resolvedStandardsPath}`);
    hasErrors = true;
    return;
  }
  logSuccess('Standards file exists');

  // 7. Test standards loading
  let navigator: StandardsNavigator;
  try {
    navigator = new StandardsNavigator(standardsPath);
    logSuccess('Standards file loaded successfully');
  } catch (error) {
    logError(`Failed to load standards: ${error}`);
    hasErrors = true;
    return;
  }

  // 8. Test standards navigation - domains
  try {
    const domains = navigator.getDomains();
    logSuccess(`Found ${domains.length} domains`);

    if (domains.length > 0) {
      logInfo(`Sample domains: ${domains.slice(0, 3).map(d => d.name).join(', ')}`);
    } else {
      logWarning('No domains found');
      hasErrors = true;
    }
  } catch (error) {
    logError(`Failed to get domains: ${error}`);
    hasErrors = true;
  }

  // 9. Test standards navigation - clusters
  try {
    const domains = navigator.getDomains();
    if (domains.length > 0) {
      const firstDomain = domains[0];
      const clusters = navigator.getClusters(firstDomain.id);
      logSuccess(`Found ${clusters.length} clusters for domain ${firstDomain.name} (${firstDomain.id})`);

      if (clusters.length > 0) {
        logInfo(`Sample cluster: ${clusters[0].id} - ${clusters[0].description.substring(0, 50)}...`);
      }
    }
  } catch (error) {
    logError(`Failed to get clusters: ${error}`);
    hasErrors = true;
  }

  // 10. Test standards navigation - standards
  try {
    const domains = navigator.getDomains();
    if (domains.length > 0) {
      const firstDomain = domains[0];
      const clusters = navigator.getClusters(firstDomain.id);

      if (clusters.length > 0) {
        const firstCluster = clusters[0];
        const standards = navigator.getStandards(firstCluster.id);
        logSuccess(`Found ${standards.length} standards for cluster ${firstCluster.id}`);

        if (standards.length > 0) {
          logInfo(`Sample standard: ${standards[0].id} - ${standards[0].description.substring(0, 50)}...`);
        }
      }
    }
  } catch (error) {
    logError(`Failed to get standards: ${error}`);
    hasErrors = true;
  }

  // Summary
  logInfo('\n---\n');
  if (hasErrors) {
    logError('Verification completed with ERRORS');
    process.exit(1);
  } else {
    logSuccess('All verifications passed! ✨');
    logInfo('Database and standards are ready for use.');
  }
}

// Run verification
verifyDatabase().catch(error => {
  logError(`Unexpected error: ${error}`);
  process.exit(1);
});

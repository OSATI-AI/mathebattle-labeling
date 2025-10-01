import { TaskWithImages } from '@/lib/types';

interface TaskDisplayProps {
  task: TaskWithImages | null;
  loading?: boolean;
}

/**
 * TaskDisplay component
 *
 * Displays task and solution images side-by-side
 * Shows task metadata (name, description, classname)
 */
export default function TaskDisplay({ task, loading = false }: TaskDisplayProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">No task selected</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Task Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Task #{task.task_id}: {task.name}
        </h2>
        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {task.classname}
          </span>
          {task.sek1 && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
              {task.sek1}
            </span>
          )}
          {task.sek2 && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
              {task.sek2}
            </span>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Task Image */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Task Image</h3>
          {task.task_image_base64 ? (
            <img
              src={task.task_image_base64}
              alt="Task"
              className="w-full h-auto rounded border border-gray-300 shadow-sm"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-400">No task image</p>
            </div>
          )}
        </div>

        {/* Solution Image */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Solution Image</h3>
          {task.solution_image_base64 ? (
            <img
              src={task.solution_image_base64}
              alt="Solution"
              className="w-full h-auto rounded border border-gray-300 shadow-sm"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-400">No solution image</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

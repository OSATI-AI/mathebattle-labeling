interface ProgressBarProps {
  current: number;
  total: number;
  labeledCount?: number;
}

/**
 * ProgressBar component
 *
 * Shows current progress through tasks
 * Displays: current task / total tasks
 * Optionally shows number of labeled tasks
 */
export default function ProgressBar({ current, total, labeledCount }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const labeledPercentage = labeledCount !== undefined && total > 0
    ? Math.round((labeledCount / total) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Task {current} of {total}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Optional: Show labeled count */}
      {labeledCount !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-600">
              Labeled: {labeledCount} tasks
            </span>
            <span className="text-xs text-gray-600">
              {labeledPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${labeledPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

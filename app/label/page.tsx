'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TaskDisplay from '@/components/TaskDisplay';
import HierarchicalSelector from '@/components/HierarchicalSelector';
import ProgressBar from '@/components/ProgressBar';
import { TaskWithImages, Label } from '@/lib/types';

interface RankedStandard {
  standard_id: string;
  rank: number;
}

/**
 * Simplified labeling interface
 *
 * Flow:
 * 1. Load tasks list
 * 2. For each task: fetch task details + label from Supabase
 * 3. Submit: write to Supabase + navigate
 */
export default function LabelPage() {
  const router = useRouter();

  // User
  const [labelerId, setLabelerId] = useState<string>('');

  // Tasks
  const [tasks, setTasks] = useState<TaskWithImages[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [currentTask, setCurrentTask] = useState<TaskWithImages | null>(null);
  const [currentLabel, setCurrentLabel] = useState<Label | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTask, setLoadingTask] = useState(false);

  // Labeled task count (for progress display)
  const [labeledCount, setLabeledCount] = useState<number>(0);

  // Selection state
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [rankedStandards, setRankedStandards] = useState<RankedStandard[]>([]);

  // Time tracking
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);

  // Get labeler ID
  useEffect(() => {
    const id = localStorage.getItem('labeler_id');
    if (!id) {
      router.push('/');
      return;
    }
    setLabelerId(id);
  }, [router]);

  // Load tasks list and find first unlabeled
  useEffect(() => {
    if (!labelerId) return;

    const loadTasks = async () => {
      setLoading(true);
      try {
        // Get tasks
        const tasksRes = await fetch('/api/tasks');
        const tasksData = await tasksRes.json();

        if (!tasksData.success || !tasksData.tasks) {
          console.error('Failed to load tasks');
          return;
        }

        setTasks(tasksData.tasks);

        // Get all labels to find first unlabeled task
        const labelsRes = await fetch(`/api/labels?labeler_id=${labelerId}`);
        const labelsData = await labelsRes.json();

        let startIndex = 0;
        if (labelsData.success && labelsData.labeled_task_ids) {
          const labeledIds = new Set(labelsData.labeled_task_ids);
          setLabeledCount(labeledIds.size);

          // Find first unlabeled
          const firstUnlabeled = tasksData.tasks.findIndex(
            (t: TaskWithImages) => !labeledIds.has(t.task_id)
          );
          if (firstUnlabeled !== -1) {
            startIndex = firstUnlabeled;
          }
        }

        setCurrentTaskIndex(startIndex);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [labelerId]);

  // Load current task + its label when index changes
  useEffect(() => {
    if (tasks.length === 0 || currentTaskIndex >= tasks.length) return;

    const loadTaskAndLabel = async () => {
      setLoadingTask(true);
      const taskId = tasks[currentTaskIndex].task_id;

      try {
        // Load task details with images
        const taskRes = await fetch(`/api/tasks/${taskId}`);
        const taskData = await taskRes.json();

        if (taskData.success && taskData.task) {
          setCurrentTask(taskData.task);
        }

        // Load label for this specific task
        const labelRes = await fetch(`/api/labels?labeler_id=${labelerId}`);
        const labelData = await labelRes.json();

        if (labelData.success && labelData.labels) {
          const label = labelData.labels.find((l: Label) => l.task_id === taskId);
          setCurrentLabel(label || null);
        } else {
          setCurrentLabel(null);
        }
      } catch (error) {
        console.error('Error loading task/label:', error);
        setCurrentLabel(null);
      } finally {
        setLoadingTask(false);
      }
    };

    loadTaskAndLabel();
    setStartTime(Date.now()); // Reset timer
  }, [currentTaskIndex, tasks, labelerId]);

  const handleSelectionChange = useCallback((selection: {
    domains: string[];
    clusters: string[];
    rankedStandards: RankedStandard[];
  }) => {
    setSelectedDomains(selection.domains);
    setSelectedClusters(selection.clusters);
    setRankedStandards(selection.rankedStandards);
  }, []);

  const handleSubmit = async () => {
    if (rankedStandards.length === 0) {
      alert('Please select and rank at least one standard before submitting.');
      return;
    }

    if (!currentTask) {
      alert('No task selected.');
      return;
    }

    setSubmitting(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: currentTask.task_id,
          labeler_id: labelerId,
          selected_domains: selectedDomains,
          selected_clusters: selectedClusters,
          selected_standards: rankedStandards,
          time_spent_seconds: timeSpent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update labeled count
        setLabeledCount(prev => currentLabel ? prev : prev + 1);

        // Clear current state before navigation to prevent stale data
        setCurrentLabel(null);
        setCurrentTask(null);

        // Navigate to next task
        if (currentTaskIndex < tasks.length - 1) {
          setCurrentTaskIndex(currentTaskIndex + 1);
        }
      } else {
        alert('Error submitting label: ' + (data.message || data.error));
      }
    } catch (error) {
      console.error('Error submitting label:', error);
      alert('Error submitting label. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Tasks Available</h2>
          <p className="text-gray-600">There are no tasks to label at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1920px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Mathebattle Labeling Interface
          </h1>
          <div className="text-sm text-gray-600">
            Labeler: <span className="font-semibold">{labelerId}</span>
          </div>
        </div>

        {/* Split Screen Container */}
        <div className="flex gap-4 h-[calc(100vh-140px)]">
          {/* LEFT HALF: Task Images with own scrollbar */}
          <div className="w-1/2 bg-white rounded-lg shadow-md p-6 overflow-y-auto">
            <TaskDisplay task={currentTask} loading={loadingTask} />
          </div>

          {/* RIGHT HALF: All UI controls with own scrollbar */}
          <div className="w-1/2 space-y-4 overflow-y-auto pr-2">
            {/* Progress Bar */}
            <ProgressBar
              current={currentTaskIndex + 1}
              total={tasks.length}
              labeledCount={labeledCount}
            />

            {/* Top Navigation */}
            <div className="flex gap-4 items-center justify-between bg-white rounded-lg shadow-md p-4">
              <button
                onClick={handlePrevious}
                disabled={currentTaskIndex === 0}
                className="px-6 py-2 bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentTaskIndex === tasks.length - 1}
                className="px-6 py-2 bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>

            {/* Already Labeled Indicator */}
            {currentLabel && (
              <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded">
                ✓ This task has already been labeled by you.
              </div>
            )}

            {/* Hierarchical Selector */}
            <HierarchicalSelector
              key={currentTaskIndex}
              onSelectionComplete={handleSelectionChange}
              disabled={submitting || loadingTask}
              initialDomains={currentLabel?.selected_domains || []}
              initialClusters={currentLabel?.selected_clusters || []}
              initialStandards={currentLabel?.selected_standards || []}
            />

            {/* Combined Navigation + Submit */}
            <div className="flex gap-4 items-center justify-between bg-white rounded-lg shadow-md p-4">
              <button
                onClick={handlePrevious}
                disabled={currentTaskIndex === 0}
                className="px-6 py-2 bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>

              <button
                onClick={handleSubmit}
                disabled={submitting || rankedStandards.length === 0}
                className="px-8 py-3 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {submitting ? 'Submitting...' : 'Submit Label'}
              </button>

              <button
                onClick={handleNext}
                disabled={currentTaskIndex === tasks.length - 1}
                className="px-6 py-2 bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Review the task and solution images on the left</li>
                <li>Select applicable domain(s) from Common Core standards</li>
                <li>Choose specific cluster(s) within those domains</li>
                <li>Select the relevant standard(s)</li>
                <li>Rank the standards by relevance (1 = most relevant)</li>
                <li>Click "Submit Label" to save and move to the next task</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

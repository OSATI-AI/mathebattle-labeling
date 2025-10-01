'use client';

import { useState, useEffect } from 'react';
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
 * Main labeling interface
 *
 * Features:
 * - Display current task with images
 * - Hierarchical selection: domains → clusters → standards
 * - Ranking interface for multiple standards
 * - Submit button with validation
 * - Progress tracking with localStorage
 * - Navigation: Previous/Next task
 * - Time tracking per task
 */
export default function LabelPage() {
  const router = useRouter();

  // User state
  const [labelerId, setLabelerId] = useState<string>('');

  // Task state
  const [tasks, setTasks] = useState<TaskWithImages[]>([]);
  const [currentTask, setCurrentTask] = useState<TaskWithImages | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [labeledTaskIds, setLabeledTaskIds] = useState<Set<number>>(new Set());
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTaskImages, setLoadingTaskImages] = useState(false);

  // Time tracking
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Selection state
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [rankedStandards, setRankedStandards] = useState<RankedStandard[]>([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Load labeler ID and redirect if not set
  useEffect(() => {
    const id = localStorage.getItem('labeler_id');
    if (!id) {
      router.push('/');
      return;
    }
    setLabelerId(id);
  }, [router]);

  // Load tasks and progress
  useEffect(() => {
    if (!labelerId) return;

    const loadTasksAndProgress = async () => {
      setLoading(true);
      try {
        // Load all tasks
        const tasksResponse = await fetch('/api/tasks');
        const tasksData = await tasksResponse.json();

        if (tasksData.success && tasksData.tasks) {
          setTasks(tasksData.tasks);

          // Load labeler's progress
          const progressResponse = await fetch(`/api/labels?labeler_id=${labelerId}`);
          const progressData = await progressResponse.json();

          if (progressData.success && progressData.labeled_task_ids) {
            const labeledIds = new Set<number>(progressData.labeled_task_ids);
            setLabeledTaskIds(labeledIds);

            // Store all labels for retrieval
            if (progressData.labels) {
              setLabels(progressData.labels);
            }

            // Find first unlabeled task
            const firstUnlabeledIndex = tasksData.tasks.findIndex(
              (task: TaskWithImages) => !labeledIds.has(task.task_id)
            );

            if (firstUnlabeledIndex !== -1) {
              setCurrentTaskIndex(firstUnlabeledIndex);
            }
          }
        }
      } catch (error) {
        console.error('Error loading tasks and progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasksAndProgress();
  }, [labelerId]);

  // Load current task images when task index changes
  useEffect(() => {
    if (tasks.length === 0 || currentTaskIndex >= tasks.length) {
      setCurrentTask(null);
      return;
    }

    const loadCurrentTaskImages = async () => {
      setLoadingTaskImages(true);
      try {
        const taskId = tasks[currentTaskIndex].task_id;
        const response = await fetch(`/api/tasks/${taskId}`);
        const data = await response.json();

        if (data.success && data.task) {
          setCurrentTask(data.task);
        }
      } catch (error) {
        console.error('Error loading task images:', error);
      } finally {
        setLoadingTaskImages(false);
      }
    };

    loadCurrentTaskImages();
  }, [currentTaskIndex, tasks]);

  // Reset timer when task changes
  useEffect(() => {
    setStartTime(Date.now());
  }, [currentTaskIndex]);

  const handleSelectionChange = (selection: {
    domains: string[];
    clusters: string[];
    rankedStandards: RankedStandard[];
  }) => {
    setSelectedDomains(selection.domains);
    setSelectedClusters(selection.clusters);
    setRankedStandards(selection.rankedStandards);
  };

  const handleSubmit = async () => {
    // Validation
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
        // Refetch labels to get the updated list
        const progressResponse = await fetch(`/api/labels?labeler_id=${labelerId}`);
        const progressData = await progressResponse.json();

        if (progressData.success) {
          // Update labeled task IDs
          if (progressData.labeled_task_ids) {
            const newLabeledIds = new Set<number>(progressData.labeled_task_ids);
            setLabeledTaskIds(newLabeledIds);
          }

          // Update labels array
          if (progressData.labels) {
            setLabels(progressData.labels);
          }
        }

        // Reset selections
        setSelectedDomains([]);
        setSelectedClusters([]);
        setRankedStandards([]);

        // Move to next task
        handleNext();
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
      // Clear selections
      setSelectedDomains([]);
      setSelectedClusters([]);
      setRankedStandards([]);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      // Clear selections
      setSelectedDomains([]);
      setSelectedClusters([]);
      setRankedStandards([]);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isCurrentTaskLabeled = currentTask ? labeledTaskIds.has(currentTask.task_id) : false;

  // Get current task's existing label if it's already labeled
  const currentTaskLabel = currentTask && isCurrentTaskLabeled
    ? labels.find(label => label.task_id === currentTask.task_id)
    : undefined;

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Mathebattle Labeling Interface
          </h1>
          <div className="text-sm text-gray-600">
            Labeler: <span className="font-semibold">{labelerId}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          current={currentTaskIndex + 1}
          total={tasks.length}
          labeledCount={labeledTaskIds.size}
        />

        {/* Top Navigation Buttons */}
        <div className="flex gap-4 items-center justify-between bg-white rounded-lg shadow-md p-4">
          <button
            onClick={handlePrevious}
            disabled={currentTaskIndex === 0}
            className="px-6 py-2 bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-600 font-medium">
            Navigation
          </div>

          <button
            onClick={handleNext}
            disabled={currentTaskIndex === tasks.length - 1}
            className="px-6 py-2 bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Task Display */}
        <TaskDisplay task={currentTask} loading={loadingTaskImages} />

        {/* Status indicator */}
        {isCurrentTaskLabeled && (
          <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded">
            ✓ This task has already been labeled by you.
          </div>
        )}

        {/* Hierarchical Selector */}
        <HierarchicalSelector
          key={currentTaskIndex}
          onSelectionComplete={handleSelectionChange}
          disabled={submitting}
          initialDomains={currentTaskLabel?.selected_domains}
          initialClusters={currentTaskLabel?.selected_clusters}
          initialStandards={currentTaskLabel?.selected_standards}
        />

        {/* Action Buttons */}
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
            <li>Review the task and solution images above</li>
            <li>Select applicable domain(s) from Common Core standards</li>
            <li>Choose specific cluster(s) within those domains</li>
            <li>Select the relevant standard(s)</li>
            <li>Rank the standards by relevance (1 = most relevant)</li>
            <li>Click "Submit Label" to save and move to the next task</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * Tests for label submission and state clearing
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock next/navigation
const mockPush = jest.fn();
const mockRouter = jest.fn(() => ({
  push: mockPush,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter(),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn((key: string) => {
    if (key === 'labeler_id') return 'test_labeler';
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.alert
window.alert = jest.fn();

// Mock fetch
let labelSubmissionCount = 0;
const mockTasks = [
  { task_id: 1, name: 'Task 1', description: 'Desc 1', classname: '1', task_image_base64: 'data:image/png;base64,img1', solution_image_base64: 'data:image/png;base64,sol1' },
  { task_id: 2, name: 'Task 2', description: 'Desc 2', classname: '2', task_image_base64: 'data:image/png;base64,img2', solution_image_base64: 'data:image/png;base64,sol2' },
  { task_id: 3, name: 'Task 3', description: 'Desc 3', classname: '3', task_image_base64: 'data:image/png;base64,img3', solution_image_base64: 'data:image/png;base64,sol3' },
];

global.fetch = jest.fn((url: string, options?: any) => {
  // Match /api/tasks/:id (task details endpoint)
  const taskIdMatch = url.match(/\/api\/tasks\/(\d+)/);
  if (taskIdMatch) {
    const taskId = parseInt(taskIdMatch[1]);
    const task = mockTasks.find(t => t.task_id === taskId);
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        task: task,
      }),
    });
  }

  // Match /api/tasks (task list endpoint)
  if (url.includes('/api/tasks')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        tasks: mockTasks,
      }),
    });
  }
  if (url.includes('/api/labels') && options?.method === 'POST') {
    labelSubmissionCount++;
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        message: 'Label saved',
      }),
    });
  }
  if (url.includes('/api/labels')) {
    // Return labeled task IDs based on submission count
    const labeledIds = labelSubmissionCount > 0 ? [1] : [];
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        labeled_task_ids: labeledIds,
      }),
    });
  }
  if (url.includes('/api/standards/domains')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        domains: [
          { id: 'K.CC', name: 'CC', description: 'Counting & Cardinality' },
          { id: 'K.OA', name: 'OA', description: 'Operations & Algebraic' },
        ],
      }),
    });
  }
  if (url.includes('/api/standards/clusters')) {
    const domain = new URL(url, 'http://localhost').searchParams.get('domain');
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        clusters: [
          { id: `${domain}.A`, parent_domain: domain, description: 'Cluster A' },
          { id: `${domain}.B`, parent_domain: domain, description: 'Cluster B' },
        ],
      }),
    });
  }
  if (url.includes('/api/standards?')) {
    const cluster = new URL(url, 'http://localhost').searchParams.get('cluster');
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        standards: [
          { id: `${cluster}.1`, parent_cluster: cluster, description: 'Standard 1' },
          { id: `${cluster}.2`, parent_cluster: cluster, description: 'Standard 2' },
        ],
      }),
    });
  }
  return Promise.resolve({
    json: () => Promise.resolve({ success: true }),
  });
}) as jest.Mock;

describe('Label Page Submission and State Clearing', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (global.fetch as jest.Mock).mockClear();
    labelSubmissionCount = 0;
  });

  it('should clear all selections after successful label submission', async () => {
    const LabelPage = require('@/app/label/page').default;
    const { container } = render(<LabelPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText(/Task 1 of 3/)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Wait for domains to load
    await waitFor(() => {
      expect(screen.getByText('CC')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Step 1: Select a domain
    const ccButton = screen.getByText('CC').closest('button');
    await act(async () => {
      fireEvent.click(ccButton!);
    });

    // Wait for clusters to load
    await waitFor(() => {
      const clusters = screen.queryAllByText('Cluster A');
      expect(clusters.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Step 2: Select a cluster
    const clusterButton = screen.getAllByText('Cluster A')[0].closest('button');
    await act(async () => {
      fireEvent.click(clusterButton!);
    });

    // Wait for standards to load
    await waitFor(() => {
      const standards = screen.queryAllByText('Standard 1');
      expect(standards.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Step 3: Select a standard
    const standardButton = screen.getAllByText('Standard 1')[0].closest('button');
    await act(async () => {
      fireEvent.click(standardButton!);
    });

    // Wait for ranking interface to appear
    await waitFor(() => {
      expect(screen.getByText('4. Rank Standards by Relevance')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify the standard is selected (should see PRIMARY badge)
    await waitFor(() => {
      expect(screen.getByText('PRIMARY')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Step 4: Submit the label
    const submitButton = screen.getByRole('button', { name: /Submit Label/i });
    expect(submitButton).toBeEnabled();
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for submission to complete and navigation to next task
    await waitFor(() => {
      expect(screen.getByText(/Task 2 of 3/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // CRITICAL TEST: After submission and navigation, selections should be cleared
    // Check that the domain button is no longer selected (should not have selected styling)
    await waitFor(() => {
      const ccButtonAfter = screen.getByText('CC').closest('button');
      // If bug exists: button will have 'border-blue-500 bg-blue-50' classes (selected state)
      // If bug is fixed: button will have 'border-gray-200 bg-white' classes (unselected state)
      expect(ccButtonAfter?.className).not.toContain('border-blue-500');
      expect(ccButtonAfter?.className).not.toContain('bg-blue-50');
    }, { timeout: 2000 });

    // Check that no clusters are shown (domains not selected)
    const clusterText = screen.queryByText('Cluster A');
    if (clusterText) {
      // If clusters are still visible, check they're not selected
      const clusterButtonAfter = clusterText.closest('button');
      expect(clusterButtonAfter?.className).not.toContain('border-blue-500');
    }

    // Check that no standards are shown
    const standardText = screen.queryByText('Standard 1');
    expect(standardText).not.toBeInTheDocument();

    // Check that ranking interface shows "Please select at least one standard first"
    expect(screen.getByText(/Please select at least one standard first/)).toBeInTheDocument();
  });

  it('should not show PRIMARY/SECONDARY badges after submission', async () => {
    const LabelPage = require('@/app/label/page').default;
    render(<LabelPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText(/Task 1 of 3/)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Select domain, cluster, standard (shortened version)
    await waitFor(() => {
      expect(screen.getByText('CC')).toBeInTheDocument();
    }, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getByText('CC').closest('button')!);
    });

    await waitFor(() => {
      const clusters = screen.queryAllByText('Cluster A');
      expect(clusters.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getAllByText('Cluster A')[0].closest('button')!);
    });

    await waitFor(() => {
      const standards = screen.queryAllByText('Standard 1');
      expect(standards.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getAllByText('Standard 1')[0].closest('button')!);
    });

    // Verify PRIMARY badge exists
    await waitFor(() => {
      expect(screen.getByText('PRIMARY')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Submit
    const submitButton = screen.getByRole('button', { name: /Submit Label/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for next task
    await waitFor(() => {
      expect(screen.getByText(/Task 2 of 3/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // PRIMARY/SECONDARY badges should not exist after navigation
    expect(screen.queryByText('PRIMARY')).not.toBeInTheDocument();
    expect(screen.queryByText('SECONDARY')).not.toBeInTheDocument();
  });
});

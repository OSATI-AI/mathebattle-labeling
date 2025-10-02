/**
 * Tests for displaying previous selections on already-labeled tasks
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

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock window.alert
window.alert = jest.fn();

// Mock fetch with a labeled task
const mockTasks = [
  { task_id: 1, name: 'Task 1', description: 'Desc 1', classname: '1', task_image_base64: 'data:image/png;base64,img1', solution_image_base64: 'data:image/png;base64,sol1' },
  { task_id: 2, name: 'Task 2', description: 'Desc 2', classname: '2', task_image_base64: 'data:image/png;base64,img2', solution_image_base64: 'data:image/png;base64,sol2' },
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
  if (url.includes('/api/labels') && !options?.method) {
    // Return that task 1 is already labeled
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        labeled_task_ids: [1],
        labels: [
          {
            task_id: 1,
            labeler_id: 'test_labeler',
            selected_domains: ['K.CC'],
            selected_clusters: ['K.CC.A'],
            selected_standards: [
              { standard_id: 'K.CC.A.1', rank: 1 },
              { standard_id: 'K.CC.A.2', rank: 2 },
            ],
            timestamp: '2025-09-30T12:00:00Z',
            time_spent_seconds: 120,
          }
        ],
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

describe('Label Page - Previously Labeled Tasks', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should display previous selections for an already-labeled task', async () => {
    const LabelPage = require('@/app/label/page').default;
    render(<LabelPage />);

    // Wait for page to load (will start at Task 2 - first unlabeled)
    await waitFor(() => {
      expect(screen.getByText(/Task 2 of 2/)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Navigate back to Task 1 (the labeled task)
    const previousButtons = screen.getAllByRole('button', { name: /Previous/i });
    await act(async () => {
      fireEvent.click(previousButtons[0]);
    });

    // Wait for navigation to Task 1
    await waitFor(() => {
      expect(screen.getByText(/Task 1 of 2/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show the "already labeled" indicator
    await waitFor(() => {
      expect(screen.getByText(/This task has already been labeled by you/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for domains to load
    await waitFor(() => {
      expect(screen.getByText('CC')).toBeInTheDocument();
    }, { timeout: 3000 });

    // The previously selected domain should be shown as selected
    const ccButton = screen.getByText('CC').closest('button');
    await waitFor(() => {
      expect(ccButton?.className).toContain('border-blue-500');
      expect(ccButton?.className).toContain('bg-blue-50');
    }, { timeout: 3000 });

    // Wait for clusters to load
    await waitFor(() => {
      const clusterElements = screen.getAllByText('Cluster A');
      expect(clusterElements.length).toBeGreaterThan(0);
    }, { timeout: 10000 });

    // The previously selected cluster should be shown as selected
    const clusterButtons = screen.getAllByText('Cluster A')
      .map(el => el.closest('button'))
      .filter(btn => btn !== null);
    const clusterButton = clusterButtons[0];
    await waitFor(() => {
      expect(clusterButton?.className).toContain('border-blue-500');
      expect(clusterButton?.className).toContain('bg-blue-50');
    }, { timeout: 2000 });

    // Wait for standards to load in the StandardSelector
    await waitFor(() => {
      const standardButtons = screen.getAllByText('K.CC.A.1');
      expect(standardButtons.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // CRITICAL: The standard buttons in StandardSelector should be shown as SELECTED
    // Find the standard button in the StandardSelector (not the ranking interface)
    const allStandardButtons = screen.getAllByText('K.CC.A.1')
      .map(el => el.closest('button'))
      .filter(btn => btn !== null);

    // At least one button should have the selected styling
    const selectedButton = allStandardButtons.find(btn =>
      btn?.className.includes('border-blue-500') && btn?.className.includes('bg-blue-50')
    );

    // This should fail if the bug exists - standards don't show as selected
    expect(selectedButton).toBeDefined();
    expect(selectedButton?.className).toContain('border-blue-500');
    expect(selectedButton?.className).toContain('bg-blue-50');

    // Same check for the second standard
    const allStandardButtons2 = screen.getAllByText('K.CC.A.2')
      .map(el => el.closest('button'))
      .filter(btn => btn !== null);

    const selectedButton2 = allStandardButtons2.find(btn =>
      btn?.className.includes('border-blue-500') && btn?.className.includes('bg-blue-50')
    );

    expect(selectedButton2).toBeDefined();
    expect(selectedButton2?.className).toContain('border-blue-500');
    expect(selectedButton2?.className).toContain('bg-blue-50');

    // The previously selected standards should be visible in the ranking interface
    await waitFor(() => {
      expect(screen.getByText('PRIMARY')).toBeInTheDocument();
      expect(screen.getByText('SECONDARY')).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 15000);

  it('should show empty selections when navigating to an unlabeled task', async () => {
    const LabelPage = require('@/app/label/page').default;
    render(<LabelPage />);

    // Wait for page to load (will start at Task 2 - first unlabeled)
    await waitFor(() => {
      expect(screen.getByText(/Task 2 of 2/)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Should NOT show the "already labeled" indicator
    expect(screen.queryByText(/This task has already been labeled by you/)).not.toBeInTheDocument();

    // Wait for domains to load
    await waitFor(() => {
      expect(screen.getByText('CC')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Domain should NOT be selected
    const ccButton = screen.getByText('CC').closest('button');
    expect(ccButton?.className).not.toContain('border-blue-500');
    expect(ccButton?.className).not.toContain('bg-blue-50');

    // No PRIMARY/SECONDARY badges should be visible
    expect(screen.queryByText('PRIMARY')).not.toBeInTheDocument();
    expect(screen.queryByText('SECONDARY')).not.toBeInTheDocument();
  });
});

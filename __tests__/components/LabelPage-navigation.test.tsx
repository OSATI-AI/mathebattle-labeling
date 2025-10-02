/**
 * Tests for navigation behavior in label page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

// Mock window.scrollTo
const mockScrollTo = jest.fn();
global.scrollTo = mockScrollTo;

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

// Mock fetch
global.fetch = jest.fn((url: string) => {
  if (url.includes('/api/tasks')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        tasks: [
          { task_id: 1, name: 'Task 1', description: 'Desc 1', classname: '1', task_image_base64: 'img1', solution_image_base64: 'sol1' },
          { task_id: 2, name: 'Task 2', description: 'Desc 2', classname: '2', task_image_base64: 'img2', solution_image_base64: 'sol2' },
        ],
      }),
    });
  }
  if (url.includes('/api/labels')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        labeled_task_ids: [],
      }),
    });
  }
  return Promise.resolve({
    json: () => Promise.resolve({ success: true }),
  });
}) as jest.Mock;

describe('Label Page Navigation', () => {
  beforeEach(() => {
    mockScrollTo.mockClear();
    mockPush.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should navigate to next task when Next button is clicked', async () => {
    const LabelPage = require('@/app/label/page').default;
    render(<LabelPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText(/Task 1 of/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Find and click Next button
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Should navigate to task 2
    await waitFor(() => {
      expect(screen.getByText(/Task 2 of/)).toBeInTheDocument();
    });
  });

  it('should navigate to previous task when Previous button is clicked', async () => {
    const LabelPage = require('@/app/label/page').default;
    render(<LabelPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText(/Task 1 of/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Navigate to task 2 first
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Task 2 of/)).toBeInTheDocument();
    });

    // Click Previous button
    const prevButton = screen.getByRole('button', { name: /Previous/i });
    fireEvent.click(prevButton);

    // Should navigate back to task 1
    await waitFor(() => {
      expect(screen.getByText(/Task 1 of/)).toBeInTheDocument();
    });
  });

  it('should have a single set of navigation buttons', async () => {
    const LabelPage = require('@/app/label/page').default;
    render(<LabelPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText(/Task 1 of/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should have only 1 set of Previous and Next buttons (in split screen layout)
    const prevButtons = screen.getAllByRole('button', { name: /Previous/i });
    const nextButtons = screen.getAllByRole('button', { name: /Next/i });

    expect(prevButtons).toHaveLength(1);
    expect(nextButtons).toHaveLength(1);
  });
});

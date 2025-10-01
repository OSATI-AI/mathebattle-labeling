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

  it('should scroll to top when Next button is clicked', async () => {
    const LabelPage = require('@/app/label/page').default;
    render(<LabelPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText(/Task 1 of/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Find and click Next button (use first one - top button)
    const nextButtons = screen.getAllByRole('button', { name: /Next/i });
    fireEvent.click(nextButtons[0]);

    // Should scroll to top
    expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('should scroll to top when Previous button is clicked', async () => {
    const LabelPage = require('@/app/label/page').default;
    render(<LabelPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText(/Task 1 of/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Navigate to task 2 first
    const nextButtons = screen.getAllByRole('button', { name: /Next/i });
    fireEvent.click(nextButtons[0]);

    mockScrollTo.mockClear();

    // Click Previous button
    const prevButtons = screen.getAllByRole('button', { name: /Previous/i });
    fireEvent.click(prevButtons[0]);

    // Should scroll to top
    expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('should have navigation buttons at the top of the page', async () => {
    const LabelPage = require('@/app/label/page').default;
    render(<LabelPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText(/Task 1 of/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should have 2 sets of Previous and Next buttons (top and bottom)
    const prevButtons = screen.getAllByRole('button', { name: /Previous/i });
    const nextButtons = screen.getAllByRole('button', { name: /Next/i });

    expect(prevButtons).toHaveLength(2);
    expect(nextButtons).toHaveLength(2);
  });
});

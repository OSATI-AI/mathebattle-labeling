/**
 * Tests for TaskDisplay component
 */

import { render, screen } from '@testing-library/react';
import TaskDisplay from '@/components/TaskDisplay';
import { TaskWithImages } from '@/lib/types';

describe('TaskDisplay', () => {
  const mockTask: TaskWithImages = {
    task_id: 1,
    name: 'Test Task',
    description: 'This is a test task description',
    classname: '3',
    task_image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    solution_image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    sek1: 'Algebra',
    sek2: 'Geometry',
  };

  it('should render without crashing', () => {
    render(<TaskDisplay task={mockTask} loading={false} />);
  });

  it('should display task name', () => {
    render(<TaskDisplay task={mockTask} loading={false} />);

    expect(screen.getByText(/Test Task/)).toBeInTheDocument();
  });

  it('should display task description', () => {
    render(<TaskDisplay task={mockTask} loading={false} />);

    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
  });

  it('should display classname', () => {
    render(<TaskDisplay task={mockTask} loading={false} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display both images', () => {
    render(<TaskDisplay task={mockTask} loading={false} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('alt', 'Task');
    expect(images[1]).toHaveAttribute('alt', 'Solution');
  });

  it('should show loading skeleton when loading prop is true', () => {
    const { container } = render(<TaskDisplay task={null} loading={true} />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should handle null task when not loading', () => {
    render(<TaskDisplay task={null} loading={false} />);

    expect(screen.getByText(/No task selected/)).toBeInTheDocument();
  });

  it('should handle task without images', () => {
    const taskWithoutImages: TaskWithImages = {
      ...mockTask,
      task_image_base64: null,
      solution_image_base64: null,
    };

    render(<TaskDisplay task={taskWithoutImages} loading={false} />);

    expect(screen.getByText(/Test Task/)).toBeInTheDocument();
  });

  it('should display sek1 and sek2 when available', () => {
    render(<TaskDisplay task={mockTask} loading={false} />);

    expect(screen.getByText(/Algebra/)).toBeInTheDocument();
    expect(screen.getByText(/Geometry/)).toBeInTheDocument();
  });

  it('should handle missing sek1 and sek2', () => {
    const taskWithoutSek: TaskWithImages = {
      ...mockTask,
      sek1: undefined,
      sek2: undefined,
    };

    render(<TaskDisplay task={taskWithoutSek} loading={false} />);

    // Should still render without errors
    expect(screen.getByText(/Test Task/)).toBeInTheDocument();
  });
});

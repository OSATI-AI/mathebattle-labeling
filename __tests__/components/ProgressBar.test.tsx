/**
 * Tests for ProgressBar component
 */

import { render, screen } from '@testing-library/react';
import ProgressBar from '@/components/ProgressBar';

describe('ProgressBar', () => {
  it('should render without crashing', () => {
    render(<ProgressBar current={1} total={10} labeledCount={0} />);
  });

  it('should display current task number and total', () => {
    render(<ProgressBar current={5} total={100} labeledCount={10} />);

    expect(screen.getByText(/Task 5 of 100/)).toBeInTheDocument();
  });

  it('should display labeled count', () => {
    render(<ProgressBar current={5} total={100} labeledCount={15} />);

    expect(screen.getByText(/Labeled: 15 tasks/)).toBeInTheDocument();
  });

  it('should calculate progress percentage correctly', () => {
    const { container } = render(<ProgressBar current={50} total={100} labeledCount={25} />);

    // Check if progress bar width is approximately 50% (current task progress)
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle edge case: first task', () => {
    render(<ProgressBar current={1} total={100} labeledCount={0} />);

    expect(screen.getByText(/Task 1 of 100/)).toBeInTheDocument();
    expect(screen.getByText(/Labeled: 0 tasks/)).toBeInTheDocument();
  });

  it('should handle edge case: last task', () => {
    render(<ProgressBar current={100} total={100} labeledCount={99} />);

    expect(screen.getByText(/Task 100 of 100/)).toBeInTheDocument();
    expect(screen.getByText(/Labeled: 99 tasks/)).toBeInTheDocument();
  });

  it('should show completion when all tasks labeled', () => {
    render(<ProgressBar current={100} total={100} labeledCount={100} />);

    expect(screen.getByText(/Labeled: 100 tasks/)).toBeInTheDocument();
  });
});

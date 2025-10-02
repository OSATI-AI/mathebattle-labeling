/**
 * Tests for RankingInterface component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import RankingInterface from '@/components/RankingInterface';

describe('RankingInterface', () => {
  const mockOnRankingChange = jest.fn();
  const mockGetStandardDescription = jest.fn((id: string) => ({
    description: `Description for ${id}`,
    description_de: `Beschreibung für ${id}`
  }));

  beforeEach(() => {
    mockOnRankingChange.mockClear();
    mockGetStandardDescription.mockClear();
  });

  it('should render empty state when no standards selected', () => {
    render(
      <RankingInterface
        selectedStandards={[]}
        rankedStandards={[]}
        onRankingChange={mockOnRankingChange}
        getStandardDescription={mockGetStandardDescription}
      />
    );

    expect(screen.getByText(/Please select at least one standard first/)).toBeInTheDocument();
  });

  it('should initialize ranking when standards are selected', () => {
    const selectedStandards = ['CCSS.MATH.1.OA.A.1', 'CCSS.MATH.1.OA.A.2'];

    render(
      <RankingInterface
        selectedStandards={selectedStandards}
        rankedStandards={[]}
        onRankingChange={mockOnRankingChange}
        getStandardDescription={mockGetStandardDescription}
      />
    );

    // Should call onRankingChange to initialize ranking
    expect(mockOnRankingChange).toHaveBeenCalled();
  });

  it('should display ranked standards with rank numbers', () => {
    const rankedStandards = [
      { standard_id: 'CCSS.MATH.1.OA.A.1', rank: 1 },
      { standard_id: 'CCSS.MATH.1.OA.A.2', rank: 2 },
    ];

    render(
      <RankingInterface
        selectedStandards={['CCSS.MATH.1.OA.A.1', 'CCSS.MATH.1.OA.A.2']}
        rankedStandards={rankedStandards}
        onRankingChange={mockOnRankingChange}
        getStandardDescription={mockGetStandardDescription}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('CCSS.MATH.1.OA.A.1')).toBeInTheDocument();
    expect(screen.getByText('CCSS.MATH.1.OA.A.2')).toBeInTheDocument();
  });

  it('should display standard descriptions when provided', () => {
    const rankedStandards = [
      { standard_id: 'CCSS.MATH.1.OA.A.1', rank: 1 },
    ];

    render(
      <RankingInterface
        selectedStandards={['CCSS.MATH.1.OA.A.1']}
        rankedStandards={rankedStandards}
        onRankingChange={mockOnRankingChange}
        getStandardDescription={mockGetStandardDescription}
      />
    );

    // Check for both German and English descriptions with their labels
    expect(screen.getByText('DE:')).toBeInTheDocument();
    expect(screen.getByText('Beschreibung für CCSS.MATH.1.OA.A.1')).toBeInTheDocument();
    expect(screen.getByText('EN:')).toBeInTheDocument();
    expect(screen.getByText('Description for CCSS.MATH.1.OA.A.1')).toBeInTheDocument();
  });

  it('should have disabled up button for first item', () => {
    const rankedStandards = [
      { standard_id: 'CCSS.MATH.1.OA.A.1', rank: 1 },
      { standard_id: 'CCSS.MATH.1.OA.A.2', rank: 2 },
    ];

    const { container } = render(
      <RankingInterface
        selectedStandards={['CCSS.MATH.1.OA.A.1', 'CCSS.MATH.1.OA.A.2']}
        rankedStandards={rankedStandards}
        onRankingChange={mockOnRankingChange}
        getStandardDescription={mockGetStandardDescription}
      />
    );

    const upButtons = container.querySelectorAll('button[title="Move up"]');
    expect(upButtons[0]).toBeDisabled();
    expect(upButtons[1]).not.toBeDisabled();
  });

  it('should have disabled down button for last item', () => {
    const rankedStandards = [
      { standard_id: 'CCSS.MATH.1.OA.A.1', rank: 1 },
      { standard_id: 'CCSS.MATH.1.OA.A.2', rank: 2 },
    ];

    const { container } = render(
      <RankingInterface
        selectedStandards={['CCSS.MATH.1.OA.A.1', 'CCSS.MATH.1.OA.A.2']}
        rankedStandards={rankedStandards}
        onRankingChange={mockOnRankingChange}
        getStandardDescription={mockGetStandardDescription}
      />
    );

    const downButtons = container.querySelectorAll('button[title="Move down"]');
    expect(downButtons[0]).not.toBeDisabled();
    expect(downButtons[1]).toBeDisabled();
  });

  it('should be fully disabled when disabled prop is true', () => {
    const rankedStandards = [
      { standard_id: 'CCSS.MATH.1.OA.A.1', rank: 1 },
      { standard_id: 'CCSS.MATH.1.OA.A.2', rank: 2 },
    ];

    const { container } = render(
      <RankingInterface
        selectedStandards={['CCSS.MATH.1.OA.A.1', 'CCSS.MATH.1.OA.A.2']}
        rankedStandards={rankedStandards}
        onRankingChange={mockOnRankingChange}
        getStandardDescription={mockGetStandardDescription}
        disabled={true}
      />
    );

    const allButtons = container.querySelectorAll('button');
    allButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should label rank 1 as PRIMARY', () => {
    const rankedStandards = [
      { standard_id: 'CCSS.MATH.1.OA.A.1', rank: 1 },
      { standard_id: 'CCSS.MATH.1.OA.A.2', rank: 2 },
    ];

    render(
      <RankingInterface
        selectedStandards={['CCSS.MATH.1.OA.A.1', 'CCSS.MATH.1.OA.A.2']}
        rankedStandards={rankedStandards}
        onRankingChange={mockOnRankingChange}
        getStandardDescription={mockGetStandardDescription}
      />
    );

    expect(screen.getByText('PRIMARY')).toBeInTheDocument();
  });

  it('should label ranks > 1 as SECONDARY', () => {
    const rankedStandards = [
      { standard_id: 'CCSS.MATH.1.OA.A.1', rank: 1 },
      { standard_id: 'CCSS.MATH.1.OA.A.2', rank: 2 },
      { standard_id: 'CCSS.MATH.1.OA.A.3', rank: 3 },
    ];

    render(
      <RankingInterface
        selectedStandards={['CCSS.MATH.1.OA.A.1', 'CCSS.MATH.1.OA.A.2', 'CCSS.MATH.1.OA.A.3']}
        rankedStandards={rankedStandards}
        onRankingChange={mockOnRankingChange}
        getStandardDescription={mockGetStandardDescription}
      />
    );

    const secondaryBadges = screen.getAllByText('SECONDARY');
    expect(secondaryBadges).toHaveLength(2);
  });
});

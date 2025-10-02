/**
 * Tests for DomainSelector component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import DomainSelector from '@/components/DomainSelector';
import { DomainInfo } from '@/lib/types';

describe('DomainSelector', () => {
  const mockDomains: DomainInfo[] = [
    {
      id: 'CCSS.MATH.CONTENT.K.CC',
      name: 'CC',
      description: 'Counting and Cardinality',
    },
    {
      id: 'CCSS.MATH.CONTENT.K.OA',
      name: 'OA',
      description: 'Operations and Algebraic Thinking',
    },
    {
      id: 'CCSS.MATH.CONTENT.K.NBT',
      name: 'NBT',
      description: 'Number and Operations in Base Ten',
    },
  ];

  const mockOnDomainsChange = jest.fn();

  beforeEach(() => {
    mockOnDomainsChange.mockClear();
  });

  it('should render without crashing', () => {
    render(
      <DomainSelector
        domains={mockDomains}
        selectedDomains={[]}
        onDomainsChange={mockOnDomainsChange}
      />
    );
  });

  it('should display all domains', () => {
    render(
      <DomainSelector
        domains={mockDomains}
        selectedDomains={[]}
        onDomainsChange={mockOnDomainsChange}
      />
    );

    expect(screen.getByText('CC')).toBeInTheDocument();
    expect(screen.getByText('OA')).toBeInTheDocument();
    expect(screen.getByText('NBT')).toBeInTheDocument();
  });

  it('should display domain descriptions', () => {
    render(
      <DomainSelector
        domains={mockDomains}
        selectedDomains={[]}
        onDomainsChange={mockOnDomainsChange}
      />
    );

    // The component displays description twice (once for German/fallback, once for English)
    expect(screen.getAllByText('Counting and Cardinality').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Operations and Algebraic Thinking').length).toBeGreaterThan(0);
  });

  it('should highlight selected domains', () => {
    const { container } = render(
      <DomainSelector
        domains={mockDomains}
        selectedDomains={['CCSS.MATH.CONTENT.K.CC']}
        onDomainsChange={mockOnDomainsChange}
      />
    );

    const buttons = container.querySelectorAll('button');
    const selectedButton = Array.from(buttons).find(btn => btn.textContent?.includes('CC'));

    expect(selectedButton?.className).toContain('border-blue-500');
    expect(selectedButton?.className).toContain('bg-blue-50');
  });

  it('should call onDomainsChange when domain is clicked', () => {
    render(
      <DomainSelector
        domains={mockDomains}
        selectedDomains={[]}
        onDomainsChange={mockOnDomainsChange}
      />
    );

    const ccButton = screen.getByText('CC').closest('button');
    fireEvent.click(ccButton!);

    expect(mockOnDomainsChange).toHaveBeenCalledWith(['CCSS.MATH.CONTENT.K.CC']);
  });

  it('should add domain to selection when clicked', () => {
    render(
      <DomainSelector
        domains={mockDomains}
        selectedDomains={['CCSS.MATH.CONTENT.K.CC']}
        onDomainsChange={mockOnDomainsChange}
      />
    );

    const oaButton = screen.getByText('OA').closest('button');
    fireEvent.click(oaButton!);

    expect(mockOnDomainsChange).toHaveBeenCalledWith([
      'CCSS.MATH.CONTENT.K.CC',
      'CCSS.MATH.CONTENT.K.OA',
    ]);
  });

  it('should remove domain from selection when clicked again', () => {
    render(
      <DomainSelector
        domains={mockDomains}
        selectedDomains={['CCSS.MATH.CONTENT.K.CC', 'CCSS.MATH.CONTENT.K.OA']}
        onDomainsChange={mockOnDomainsChange}
      />
    );

    const ccButton = screen.getByText('CC').closest('button');
    fireEvent.click(ccButton!);

    expect(mockOnDomainsChange).toHaveBeenCalledWith(['CCSS.MATH.CONTENT.K.OA']);
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <DomainSelector
        domains={mockDomains}
        selectedDomains={[]}
        onDomainsChange={mockOnDomainsChange}
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should not call onDomainsChange when disabled', () => {
    render(
      <DomainSelector
        domains={mockDomains}
        selectedDomains={[]}
        onDomainsChange={mockOnDomainsChange}
        disabled={true}
      />
    );

    const ccButton = screen.getByText('CC').closest('button');
    fireEvent.click(ccButton!);

    expect(mockOnDomainsChange).not.toHaveBeenCalled();
  });
});

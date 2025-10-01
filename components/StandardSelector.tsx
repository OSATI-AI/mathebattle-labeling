import { useEffect, useState } from 'react';
import { StandardInfo } from '@/lib/types';

interface StandardSelectorProps {
  selectedClusters: string[];
  selectedStandards: string[];
  onStandardsChange: (standardIds: string[]) => void;
  disabled?: boolean;
}

/**
 * StandardSelector component
 *
 * Dynamically loads standards based on selected clusters
 * Multi-select standard picker
 * Shows standard description
 */
export default function StandardSelector({
  selectedClusters,
  selectedStandards,
  onStandardsChange,
  disabled = false
}: StandardSelectorProps) {
  const [standards, setStandards] = useState<StandardInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Load standards when selected clusters change
  useEffect(() => {
    if (selectedClusters.length === 0) {
      setStandards([]);
      onStandardsChange([]);
      return;
    }

    const loadStandards = async () => {
      setLoading(true);
      try {
        // Fetch standards for all selected clusters
        const allStandards: StandardInfo[] = [];

        for (const clusterId of selectedClusters) {
          const response = await fetch(`/api/standards?cluster=${encodeURIComponent(clusterId)}`);
          const data = await response.json();

          if (data.success && data.standards) {
            allStandards.push(...data.standards);
          }
        }

        setStandards(allStandards);

        // Remove any selected standards that are no longer valid
        const validStandardIds = new Set(allStandards.map(s => s.id));
        const newSelectedStandards = selectedStandards.filter(id => validStandardIds.has(id));
        if (newSelectedStandards.length !== selectedStandards.length) {
          onStandardsChange(newSelectedStandards);
        }
      } catch (error) {
        console.error('Error loading standards:', error);
        setStandards([]);
      } finally {
        setLoading(false);
      }
    };

    loadStandards();
  }, [selectedClusters]);

  const toggleStandard = (standardId: string) => {
    if (disabled) return;

    if (selectedStandards.includes(standardId)) {
      // Remove standard
      onStandardsChange(selectedStandards.filter(id => id !== standardId));
    } else {
      // Add standard
      onStandardsChange([...selectedStandards, standardId]);
    }
  };

  if (selectedClusters.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          3. Select Standard(s)
        </h3>
        <p className="text-sm text-gray-500">
          Please select at least one cluster first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        3. Select Standard(s)
        {selectedStandards.length > 0 && (
          <span className="ml-2 text-sm font-normal text-blue-600">
            ({selectedStandards.length} selected)
          </span>
        )}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose the specific standards that apply. You'll rank them in the next step.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : standards.length === 0 ? (
        <p className="text-sm text-gray-500">No standards found for selected clusters.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {standards.map((standard) => {
            const isSelected = selectedStandards.includes(standard.id);

            return (
              <button
                key={standard.id}
                onClick={() => toggleStandard(standard.id)}
                disabled={disabled}
                className={`
                  w-full p-3 rounded-md border-2 transition-all text-left
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="font-semibold text-sm">{standard.id}</div>
                <div className="text-xs mt-1">
                  <div>{standard.description_de || standard.description}</div>
                  <div className="italic text-gray-500 mt-0.5">{standard.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface RankedStandard {
  standard_id: string;
  rank: number;
}

interface RankingInterfaceProps {
  selectedStandards: string[];
  rankedStandards: RankedStandard[];
  onRankingChange: (ranked: RankedStandard[]) => void;
  getStandardDescription?: (standardId: string) => string;
  disabled?: boolean;
}

/**
 * RankingInterface component
 *
 * Allows users to rank selected standards
 * Up/down buttons to adjust ranking
 * Shows rank number (1 = most relevant)
 */
export default function RankingInterface({
  selectedStandards,
  rankedStandards,
  onRankingChange,
  getStandardDescription,
  disabled = false
}: RankingInterfaceProps) {
  // Initialize ranking when standards change
  if (selectedStandards.length > 0 && rankedStandards.length === 0) {
    const initialRanking = selectedStandards.map((id, index) => ({
      standard_id: id,
      rank: index + 1
    }));
    onRankingChange(initialRanking);
  }

  // Keep ranking in sync with selected standards
  if (selectedStandards.length !== rankedStandards.length) {
    // Add new standards or remove deselected ones
    const existingStandards = new Set(rankedStandards.map(r => r.standard_id));
    const selectedSet = new Set(selectedStandards);

    // Remove deselected standards
    let updatedRanking = rankedStandards.filter(r => selectedSet.has(r.standard_id));

    // Add new standards
    const newStandards = selectedStandards.filter(id => !existingStandards.has(id));
    const nextRank = updatedRanking.length + 1;
    newStandards.forEach((id, index) => {
      updatedRanking.push({
        standard_id: id,
        rank: nextRank + index
      });
    });

    // Re-rank to ensure continuous sequence
    updatedRanking = updatedRanking
      .sort((a, b) => a.rank - b.rank)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    onRankingChange(updatedRanking);
  }

  const moveUp = (index: number) => {
    if (index === 0 || disabled) return;

    const newRanking = [...rankedStandards];
    [newRanking[index - 1], newRanking[index]] = [newRanking[index], newRanking[index - 1]];

    // Update ranks
    newRanking.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    onRankingChange(newRanking);
  };

  const moveDown = (index: number) => {
    if (index === rankedStandards.length - 1 || disabled) return;

    const newRanking = [...rankedStandards];
    [newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]];

    // Update ranks
    newRanking.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    onRankingChange(newRanking);
  };

  if (selectedStandards.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          4. Rank Standards
        </h3>
        <p className="text-sm text-gray-500">
          Please select at least one standard first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        4. Rank Standards by Relevance
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Rank 1 = most relevant. Use arrows to reorder.
      </p>

      <div className="space-y-2">
        {rankedStandards.map((item, index) => (
          <div
            key={item.standard_id}
            className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200"
          >
            {/* Rank number */}
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded">
              {item.rank}
            </div>

            {/* Standard info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-sm text-gray-800">
                  {item.standard_id}
                </div>
                {item.rank === 1 ? (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">
                    PRIMARY
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded">
                    SECONDARY
                  </span>
                )}
              </div>
              {getStandardDescription && (
                <div className="text-xs text-gray-600 truncate">
                  {getStandardDescription(item.standard_id)}
                </div>
              )}
            </div>

            {/* Up/Down buttons */}
            <div className="flex-shrink-0 flex flex-col gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0 || disabled}
                className={`
                  p-1 rounded transition-colors
                  ${index === 0 || disabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'}
                `}
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === rankedStandards.length - 1 || disabled}
                className={`
                  p-1 rounded transition-colors
                  ${index === rankedStandards.length - 1 || disabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'}
                `}
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ClusterInfo } from '@/lib/types';

interface ClusterSelectorProps {
  selectedDomains: string[];
  selectedClusters: string[];
  onClustersChange: (clusterIds: string[]) => void;
  disabled?: boolean;
}

/**
 * ClusterSelector component
 *
 * Dynamically loads clusters based on selected domains
 * Multi-select cluster picker
 * Shows cluster description
 */
export default function ClusterSelector({
  selectedDomains,
  selectedClusters,
  onClustersChange,
  disabled = false
}: ClusterSelectorProps) {
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Load clusters when selected domains change
  useEffect(() => {
    if (selectedDomains.length === 0) {
      setClusters([]);
      onClustersChange([]);
      return;
    }

    const loadClusters = async () => {
      setLoading(true);
      try {
        // Fetch clusters for all selected domains
        const allClusters: ClusterInfo[] = [];

        for (const domainId of selectedDomains) {
          const response = await fetch(`/api/standards/clusters?domain=${encodeURIComponent(domainId)}`);
          const data = await response.json();

          if (data.success && data.clusters) {
            allClusters.push(...data.clusters);
          }
        }

        setClusters(allClusters);

        // Note: We don't validate selectedClusters here because:
        // 1. On initial load, selectedClusters from props are valid
        // 2. When domains change, the parent component handles clearing clusters
      } catch (error) {
        console.error('Error loading clusters:', error);
        setClusters([]);
      } finally {
        setLoading(false);
      }
    };

    loadClusters();
  }, [selectedDomains]);

  const toggleCluster = (clusterId: string) => {
    if (disabled) return;

    if (selectedClusters.includes(clusterId)) {
      // Remove cluster
      onClustersChange(selectedClusters.filter(id => id !== clusterId));
    } else {
      // Add cluster
      onClustersChange([...selectedClusters, clusterId]);
    }
  };

  if (selectedDomains.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          2. Select Cluster(s)
        </h3>
        <p className="text-sm text-gray-500">
          Please select at least one domain first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        2. Select Cluster(s)
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose the specific clusters within the selected domain(s).
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : clusters.length === 0 ? (
        <p className="text-sm text-gray-500">No clusters found for selected domains.</p>
      ) : (
        <>
          <div className="space-y-2">
            {clusters.map((cluster) => {
              const isSelected = selectedClusters.includes(cluster.id);

              return (
                <button
                  key={cluster.id}
                  onClick={() => toggleCluster(cluster.id)}
                  disabled={disabled}
                  className={`
                    w-full p-3 rounded-md border-2 transition-all text-left
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="font-semibold text-sm">{cluster.id}</div>
                  <div className="text-xs mt-1">
                    <div>{cluster.description_de || cluster.description}</div>
                    <div className="italic text-gray-500 mt-0.5">{cluster.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedClusters.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Selected: {selectedClusters.length} cluster{selectedClusters.length !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}
    </div>
  );
}

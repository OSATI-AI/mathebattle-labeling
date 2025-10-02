'use client';

import { useState, useEffect, useRef } from 'react';
import DomainSelector from './DomainSelector';
import ClusterSelector from './ClusterSelector';
import StandardSelector from './StandardSelector';
import RankingInterface from './RankingInterface';
import { DomainInfo } from '@/lib/types';

interface RankedStandard {
  standard_id: string;
  rank: number;
}

interface HierarchicalSelectorProps {
  onSelectionComplete: (selection: {
    domains: string[];
    clusters: string[];
    rankedStandards: RankedStandard[];
  }) => void;
  disabled?: boolean;
  initialDomains?: string[];
  initialClusters?: string[];
  initialStandards?: RankedStandard[];
}

/**
 * HierarchicalSelector orchestrator component
 *
 * Manages the entire hierarchical selection flow:
 * 1. Domain selection
 * 2. Cluster selection (based on domains)
 * 3. Standard selection (based on clusters)
 * 4. Standard ranking
 *
 * Handles all cascading logic and state management
 */
export default function HierarchicalSelector({
  onSelectionComplete,
  disabled = false,
  initialDomains = [],
  initialClusters = [],
  initialStandards = []
}: HierarchicalSelectorProps) {
  // Domain data
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);

  // Selection state
  const [selectedDomains, setSelectedDomains] = useState<string[]>(initialDomains || []);
  const [selectedClusters, setSelectedClusters] = useState<string[]>(initialClusters || []);
  const [selectedStandards, setSelectedStandards] = useState<string[]>(
    (initialStandards || []).map(s => s.standard_id)
  );
  const [rankedStandards, setRankedStandards] = useState<RankedStandard[]>(initialStandards || []);

  // Standard descriptions for ranking interface (storing both German and English)
  const [standardDescriptions, setStandardDescriptions] = useState<Map<string, { description?: string; description_de?: string }>>(new Map());

  // Track previous prop values to detect genuine prop changes
  const prevPropsRef = useRef({
    domains: initialDomains,
    clusters: initialClusters,
    standards: initialStandards
  });

  // Sync state when initial props change (important for navigating between tasks)
  // Only update if the PROPS themselves changed, not if user made manual selections
  useEffect(() => {
    const newDomains = initialDomains || [];
    const newClusters = initialClusters || [];
    const newStandardIds = (initialStandards || []).map(s => s.standard_id);
    const newRankedStandards = initialStandards || [];

    // Check if props actually changed from their previous values
    const domainsChanged = JSON.stringify(prevPropsRef.current.domains) !== JSON.stringify(newDomains);
    const clustersChanged = JSON.stringify(prevPropsRef.current.clusters) !== JSON.stringify(newClusters);
    const standardsChanged = JSON.stringify(prevPropsRef.current.standards) !== JSON.stringify(newRankedStandards);

    // Only sync state if props genuinely changed (e.g., navigated to different task)
    if (domainsChanged) {
      setSelectedDomains(newDomains);
    }

    if (clustersChanged) {
      setSelectedClusters(newClusters);
    }

    if (standardsChanged) {
      setSelectedStandards(newStandardIds);
      setRankedStandards(newRankedStandards);
    }

    // Update ref for next comparison
    prevPropsRef.current = {
      domains: newDomains,
      clusters: newClusters,
      standards: newRankedStandards
    };
  }, [initialDomains, initialClusters, initialStandards]); // Don't include state in dependencies to avoid loops

  // Load domains on mount
  useEffect(() => {
    const loadDomains = async () => {
      try {
        const response = await fetch('/api/standards/domains');
        const data = await response.json();

        if (data.success && data.domains) {
          setDomains(data.domains);
        }
      } catch (error) {
        console.error('Error loading domains:', error);
      } finally {
        setLoadingDomains(false);
      }
    };

    loadDomains();
  }, []);

  // Update parent component when selection changes
  useEffect(() => {
    onSelectionComplete({
      domains: selectedDomains,
      clusters: selectedClusters,
      rankedStandards,
    });
  }, [selectedDomains, selectedClusters, rankedStandards, onSelectionComplete]);

  // Load standard descriptions when standards are selected
  useEffect(() => {
    const loadStandardDescriptions = async () => {
      if (selectedClusters.length === 0) return;

      const newDescriptions = new Map<string, { description?: string; description_de?: string }>();

      for (const clusterId of selectedClusters) {
        try {
          const response = await fetch(`/api/standards?cluster=${encodeURIComponent(clusterId)}`);
          const data = await response.json();

          if (data.success && data.standards) {
            data.standards.forEach((standard: any) => {
              newDescriptions.set(standard.id, {
                description: standard.description,
                description_de: standard.description_de
              });
            });
          }
        } catch (error) {
          console.error('Error loading standard descriptions:', error);
        }
      }

      setStandardDescriptions(newDescriptions);
    };

    loadStandardDescriptions();
  }, [selectedClusters]);

  const getStandardDescription = (standardId: string): { description?: string; description_de?: string } => {
    return standardDescriptions.get(standardId) || {};
  };

  if (loadingDomains) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Domain Selection */}
      <DomainSelector
        domains={domains}
        selectedDomains={selectedDomains}
        onDomainsChange={setSelectedDomains}
        disabled={disabled}
      />

      {/* Step 2: Cluster Selection */}
      <ClusterSelector
        selectedDomains={selectedDomains}
        selectedClusters={selectedClusters}
        onClustersChange={setSelectedClusters}
        disabled={disabled}
      />

      {/* Step 3: Standard Selection */}
      <StandardSelector
        selectedClusters={selectedClusters}
        selectedStandards={selectedStandards}
        onStandardsChange={setSelectedStandards}
        disabled={disabled}
      />

      {/* Step 4: Ranking */}
      <RankingInterface
        selectedStandards={selectedStandards}
        rankedStandards={rankedStandards}
        onRankingChange={setRankedStandards}
        getStandardDescription={getStandardDescription}
        disabled={disabled}
      />
    </div>
  );
}

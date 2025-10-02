/**
 * Tests for the domain deduplication bug
 *
 * BUG: The getDomains() method deduplicates domains by their abbreviation name
 * (e.g., "NBT", "OA") instead of their full ID (e.g., "K.NBT", "1.NBT").
 * This causes all but the first domain with a given abbreviation to be hidden
 * from users.
 *
 * Example: Only K.NBT is shown, hiding 1.NBT, 2.NBT, 3.NBT, 4.NBT, 5.NBT
 */

import { loadStandards } from '@/lib/standards';

describe('Domain Deduplication Bug', () => {
  let navigator: ReturnType<typeof loadStandards>;

  beforeAll(() => {
    navigator = loadStandards();
  });

  describe('getDomains() - NBT domain bug', () => {
    it('should return ALL NBT domains for different grade levels', () => {
      const domains = navigator.getDomains();
      const nbtDomains = domains.filter(d => d.name === 'NBT');

      // BUG: This test FAILS because only 1 NBT domain is returned
      // Expected: 6 (K.NBT, 1.NBT, 2.NBT, 3.NBT, 4.NBT, 5.NBT)
      // Actual: 1 (K.NBT)
      expect(nbtDomains.length).toBeGreaterThan(1);
    });

    it('should return K.NBT domain', () => {
      const domains = navigator.getDomains();
      const kNbtDomain = domains.find(d => d.id === 'K.NBT');

      expect(kNbtDomain).toBeDefined();
      expect(kNbtDomain?.name).toBe('NBT');
      expect(kNbtDomain?.description).toContain('Number & Operations in Base Ten');
    });

    it('should return 1.NBT domain', () => {
      const domains = navigator.getDomains();
      const firstGradeNbtDomain = domains.find(d => d.id === '1.NBT');

      // BUG: This test FAILS because 1.NBT is filtered out
      expect(firstGradeNbtDomain).toBeDefined();
      expect(firstGradeNbtDomain?.name).toBe('NBT');
    });

    it('should return 2.NBT domain', () => {
      const domains = navigator.getDomains();
      const secondGradeNbtDomain = domains.find(d => d.id === '2.NBT');

      // BUG: This test FAILS because 2.NBT is filtered out
      expect(secondGradeNbtDomain).toBeDefined();
      expect(secondGradeNbtDomain?.name).toBe('NBT');
    });

    it('should return all 6 NBT domains (K, 1, 2, 3, 4, 5)', () => {
      const domains = navigator.getDomains();
      const nbtDomainIds = domains
        .filter(d => d.name === 'NBT')
        .map(d => d.id)
        .sort();

      // BUG: This test FAILS
      // Expected: ['1.NBT', '2.NBT', '3.NBT', '4.NBT', '5.NBT', 'K.NBT']
      // Actual: ['K.NBT']
      expect(nbtDomainIds).toEqual(['1.NBT', '2.NBT', '3.NBT', '4.NBT', '5.NBT', 'K.NBT']);
    });
  });

  describe('getDomains() - Other domains affected by same bug', () => {
    it('should return multiple OA domains for different grade levels', () => {
      const domains = navigator.getDomains();
      const oaDomains = domains.filter(d => d.name === 'OA');

      // BUG: This test FAILS - only 1 OA domain is returned
      // OA exists for K, 1, 2, 3, 4, 5
      expect(oaDomains.length).toBeGreaterThan(1);
    });

    it('should return multiple NF domains for different grade levels', () => {
      const domains = navigator.getDomains();
      const nfDomains = domains.filter(d => d.name === 'NF');

      // BUG: This test FAILS - only 1 NF domain is returned
      // NF exists for grades 3, 4, 5
      expect(nfDomains.length).toBeGreaterThan(1);
    });

    it('should have unique domain IDs (not just unique names)', () => {
      const domains = navigator.getDomains();
      const ids = domains.map(d => d.id);
      const uniqueIds = new Set(ids);

      // This passes because IDs ARE unique
      expect(uniqueIds.size).toBe(ids.length);

      // But the problem is there should be MORE domains
      // Current: ~11 domains (one per abbreviation)
      // Expected: 50+ domains (one per grade-domain combination)
      expect(domains.length).toBeGreaterThan(30);
    });
  });

  describe('Clusters and standards are correctly scoped to specific domain IDs', () => {
    it('K.NBT should have 1 cluster (K.NBT.A)', () => {
      const clusters = navigator.getClusters('K.NBT');
      expect(clusters).toHaveLength(1);
      expect(clusters[0].id).toBe('K.NBT.A');
    });

    it('1.NBT should have 3 clusters', () => {
      const clusters = navigator.getClusters('1.NBT');

      // This works correctly because getClusters uses the full domain ID
      expect(clusters).toHaveLength(3);
      const clusterIds = clusters.map(c => c.id).sort();
      expect(clusterIds).toEqual(['1.NBT.A', '1.NBT.B', '1.NBT.C']);
    });

    it('2.NBT should have 2 clusters', () => {
      const clusters = navigator.getClusters('2.NBT');

      expect(clusters).toHaveLength(2);
      const clusterIds = clusters.map(c => c.id).sort();
      expect(clusterIds).toEqual(['2.NBT.A', '2.NBT.B']);
    });

    it('K.NBT.A should have 1 standard (K.NBT.A.1)', () => {
      const standards = navigator.getStandards('K.NBT.A');
      expect(standards).toHaveLength(1);
      expect(standards[0].id).toBe('K.NBT.A.1');
    });

    it('1.NBT.A should have 1 standard', () => {
      const standards = navigator.getStandards('1.NBT.A');
      expect(standards.length).toBeGreaterThan(0);
    });
  });

  describe('User experience impact', () => {
    it('verifies the user CAN now access all NBT domains through the domain selector', () => {
      // Step 1: User sees domains list
      const domains = navigator.getDomains();
      const nbtDomains = domains.filter(d => d.name === 'NBT');

      // User now sees ALL NBT options (bug is fixed!)
      expect(nbtDomains.length).toBeGreaterThan(1);

      // Step 2: User can specifically select 1.NBT
      const firstGradeNbt = nbtDomains.find(d => d.id === '1.NBT');
      expect(firstGradeNbt).toBeDefined();
      expect(firstGradeNbt?.id).toBe('1.NBT');

      // Step 3: System loads clusters for 1.NBT
      const clusters = navigator.getClusters('1.NBT');

      // User can now see all 1.NBT clusters
      expect(clusters.length).toBe(3);
      expect(clusters.every(c => c.parent_domain === '1.NBT')).toBe(true);

      // Step 4: Verify all expected 1.NBT clusters are present
      const clusterIds = clusters.map(c => c.id).sort();
      expect(clusterIds).toEqual(['1.NBT.A', '1.NBT.B', '1.NBT.C']);

      // Bug is FIXED: User now has full access to all grade-level specific domains
    });
  });

  describe('Data integrity - verify raw data contains all domains', () => {
    it('should have NBT domains in the raw data', () => {
      const allStandards = navigator.getAllStandards();
      const nbtDomains = allStandards.filter(
        s => (s.level === 'Domain' || s.level === 'domain') &&
             s.id.includes('.NBT')
      );

      // Raw data contains all NBT domains
      expect(nbtDomains.length).toBe(6);

      const domainIds = nbtDomains.map(d => d.id).sort();
      expect(domainIds).toEqual(['1.NBT', '2.NBT', '3.NBT', '4.NBT', '5.NBT', 'K.NBT']);
    });

    it('should have OA domains in the raw data', () => {
      const allStandards = navigator.getAllStandards();
      const oaDomains = allStandards.filter(
        s => (s.level === 'Domain' || s.level === 'domain') &&
             s.id.includes('.OA')
      );

      // Raw data contains all OA domains
      expect(oaDomains.length).toBeGreaterThan(1);
    });
  });
});

describe('Root cause analysis', () => {
  it('documents the bug in getDomains() implementation', () => {
    /**
     * LOCATION: lib/standards.ts, lines 35-62, getDomains() method
     *
     * PROBLEM CODE:
     * ```typescript
     * getDomains(): DomainInfo[] {
     *   const domains: DomainInfo[] = [];
     *   const seenNames = new Set<string>();  // <-- BUG: deduplicates by name only
     *
     *   for (const [id, standard] of this.standards.entries()) {
     *     if (standard.level === 'Domain' || standard.level === 'domain') {
     *       const parts = id.split('.');
     *       if (parts.length >= 2) {
     *         const name = parts[1];  // <-- Extracts "NBT" from "K.NBT"
     *
     *         if (!seenNames.has(name)) {  // <-- Only keeps first occurrence
     *           seenNames.add(name);
     *           domains.push({...});
     *         }
     *       }
     *     }
     *   }
     * }
     * ```
     *
     * ISSUE: The method deduplicates by abbreviation (e.g., "NBT") instead of
     * full ID (e.g., "K.NBT"). This causes all grade-specific domains after
     * the first one to be filtered out.
     *
     * IMPACT:
     * - Users can only access K.NBT, not 1.NBT, 2.NBT, 3.NBT, 4.NBT, 5.NBT
     * - Same issue affects all other domain abbreviations (OA, NF, etc.)
     * - Approximately 40+ domains are hidden from users
     *
     * EXPECTED BEHAVIOR:
     * getDomains() should return ALL domains from the data, not deduplicate them.
     * Each grade-domain combination (K.NBT, 1.NBT, etc.) should be a separate
     * selectable option in the UI.
     *
     * FIX STRATEGY:
     * Option 1: Remove deduplication entirely - return all domains
     * Option 2: Group domains by abbreviation and let users select grade level
     * Option 3: Return domains with full grade prefix in the name display
     */

    // This test just documents the analysis
    expect(true).toBe(true);
  });
});

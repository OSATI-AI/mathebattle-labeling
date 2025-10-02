/**
 * Tests for ensuring domains are properly deduplicated
 *
 * Each domain abbreviation (like "G", "NBT", "OA") should appear ONLY ONCE
 * in the domain list, and selecting it should give access to ALL clusters
 * from ALL grade levels.
 */

import { loadStandards } from '@/lib/standards';

describe('Domain Deduplication Requirements', () => {
  let navigator: ReturnType<typeof loadStandards>;

  beforeAll(() => {
    navigator = loadStandards();
  });

  describe('Domain uniqueness', () => {
    it('should have only ONE domain per abbreviation (e.g., only one "G", not multiple)', () => {
      const domains = navigator.getDomains();

      // Count domains by abbreviation
      const domainCounts = new Map<string, number>();
      for (const domain of domains) {
        const count = domainCounts.get(domain.name) || 0;
        domainCounts.set(domain.name, count + 1);
      }

      // Check for any duplicates
      const duplicates = Array.from(domainCounts.entries())
        .filter(([name, count]) => count > 1)
        .map(([name, count]) => `${name}: ${count} times`);

      if (duplicates.length > 0) {
        console.error('Duplicate domain abbreviations found:', duplicates);
      }

      // EVERY abbreviation should appear EXACTLY ONCE
      for (const [name, count] of domainCounts.entries()) {
        expect(count).toBe(1);
      }
    });

    it('should have exactly one "G" domain', () => {
      const domains = navigator.getDomains();
      const gDomains = domains.filter(d => d.name === 'G');

      expect(gDomains).toHaveLength(1);
      expect(gDomains[0].name).toBe('G');
    });

    it('should have exactly one "NBT" domain', () => {
      const domains = navigator.getDomains();
      const nbtDomains = domains.filter(d => d.name === 'NBT');

      expect(nbtDomains).toHaveLength(1);
      expect(nbtDomains[0].name).toBe('NBT');
    });

    it('should have exactly one "OA" domain', () => {
      const domains = navigator.getDomains();
      const oaDomains = domains.filter(d => d.name === 'OA');

      expect(oaDomains).toHaveLength(1);
      expect(oaDomains[0].name).toBe('OA');
    });

    it('should have a reasonable number of unique domains (10-35)', () => {
      const domains = navigator.getDomains();

      // Elementary/Middle School domains + High School domains
      // Should be around 10-35 unique domain abbreviations total
      expect(domains.length).toBeGreaterThan(10);
      expect(domains.length).toBeLessThan(35);
    });
  });

  describe('Clusters should include all grade levels', () => {
    it('selecting "G" should return clusters from ALL grade levels', () => {
      const domains = navigator.getDomains();
      const gDomain = domains.find(d => d.name === 'G');

      expect(gDomain).toBeDefined();

      const clusters = navigator.getClusters(gDomain!.id);

      // Should include clusters from K.G, 1.G, 2.G, etc.
      const clusterIds = clusters.map(c => c.id);

      // Check that we have clusters from multiple grade levels
      const hasKindergarten = clusterIds.some(id => id.startsWith('K.G'));
      const hasGrade1 = clusterIds.some(id => id.startsWith('1.G'));
      const hasGrade2 = clusterIds.some(id => id.startsWith('2.G'));

      expect(hasKindergarten).toBe(true);
      expect(hasGrade1).toBe(true);
      expect(hasGrade2).toBe(true);

      // Should have many clusters (from all grades combined)
      expect(clusters.length).toBeGreaterThan(10);
    });

    it('selecting "NBT" should return clusters from ALL grade levels', () => {
      const domains = navigator.getDomains();
      const nbtDomain = domains.find(d => d.name === 'NBT');

      expect(nbtDomain).toBeDefined();

      const clusters = navigator.getClusters(nbtDomain!.id);

      // Should include clusters from K.NBT, 1.NBT, 2.NBT, etc.
      const clusterIds = clusters.map(c => c.id);

      // Check specific clusters from different grades
      expect(clusterIds).toContain('K.NBT.A'); // Kindergarten
      expect(clusterIds).toContain('1.NBT.A'); // Grade 1
      expect(clusterIds).toContain('2.NBT.A'); // Grade 2

      // Should have many clusters total
      expect(clusters.length).toBeGreaterThan(5);
    });
  });

  describe('Domain ID format', () => {
    it('domain IDs should be the abbreviation only (not grade-specific)', () => {
      const domains = navigator.getDomains();

      for (const domain of domains) {
        // Domain IDs should NOT contain grade prefixes
        // Should be "G", "NBT", "OA" etc., not "K.G", "1.NBT"
        expect(domain.id).not.toMatch(/^[K12345678]\./);

        // For elementary/middle, should just be the abbreviation
        // For high school, might be like "G-CO" which is fine
        if (!domain.id.includes('-')) {
          expect(domain.id).toBe(domain.name);
        }
      }
    });
  });

  describe('User experience', () => {
    it('user selects "G" and sees ALL geometry clusters from ALL grades', () => {
      // Step 1: User sees domain list
      const domains = navigator.getDomains();

      // Step 2: Only ONE "G" option should be visible
      const gDomains = domains.filter(d => d.name === 'G');
      expect(gDomains).toHaveLength(1);

      // Step 3: User selects "G"
      const gDomain = gDomains[0];

      // Step 4: System loads ALL clusters for geometry across all grades
      const clusters = navigator.getClusters(gDomain.id);

      // Step 5: User sees clusters from multiple grades
      const gradeKClusters = clusters.filter(c => c.id.startsWith('K.G'));
      const grade1Clusters = clusters.filter(c => c.id.startsWith('1.G'));
      const grade2Clusters = clusters.filter(c => c.id.startsWith('2.G'));

      expect(gradeKClusters.length).toBeGreaterThan(0);
      expect(grade1Clusters.length).toBeGreaterThan(0);
      expect(grade2Clusters.length).toBeGreaterThan(0);

      console.log(`Total G clusters across all grades: ${clusters.length}`);
      console.log(`K.G clusters: ${gradeKClusters.length}`);
      console.log(`1.G clusters: ${grade1Clusters.length}`);
      console.log(`2.G clusters: ${grade2Clusters.length}`);
    });
  });
});
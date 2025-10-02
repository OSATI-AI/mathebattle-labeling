/**
 * Tests for lib/standards-static.ts - StandardsNavigator class
 */

import { loadStandards } from '@/lib/standards-static';

describe('StandardsNavigator', () => {
  let navigator: ReturnType<typeof loadStandards>;

  beforeAll(() => {
    navigator = loadStandards();
  });

  describe('getDomains', () => {
    it('should return array of domains', () => {
      const domains = navigator.getDomains();
      expect(Array.isArray(domains)).toBe(true);
      expect(domains.length).toBeGreaterThan(0);
    });

    it('should return all grade-specific domains (not deduplicated)', () => {
      const domains = navigator.getDomains();
      // After fixing the deduplication bug, we should have 60+ domains
      // (one for each grade-domain combination, not just one per abbreviation)
      expect(domains.length).toBeGreaterThan(30);
    });

    it('should return domains with required fields', () => {
      const domains = navigator.getDomains();
      const domain = domains[0];

      expect(domain).toHaveProperty('id');
      expect(domain).toHaveProperty('name');
      expect(domain).toHaveProperty('description');
    });

    it('should have unique domain IDs', () => {
      const domains = navigator.getDomains();
      const ids = domains.map(d => d.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include common domains like CC, OA, NBT', () => {
      const domains = navigator.getDomains();
      const names = domains.map(d => d.name);

      expect(names).toContain('CC');
      expect(names).toContain('OA');
      expect(names).toContain('NBT');
    });
  });

  describe('getClusters', () => {
    it('should return clusters for valid domain', () => {
      const domains = navigator.getDomains();
      const firstDomain = domains[0];
      const clusters = navigator.getClusters(firstDomain.id);

      expect(Array.isArray(clusters)).toBe(true);
      expect(clusters.length).toBeGreaterThan(0);
    });

    it('should return clusters with required fields', () => {
      const domains = navigator.getDomains();
      const firstDomain = domains[0];
      const clusters = navigator.getClusters(firstDomain.id);
      const cluster = clusters[0];

      expect(cluster).toHaveProperty('id');
      expect(cluster).toHaveProperty('parent_domain');
      expect(cluster).toHaveProperty('description');
    });

    it('should return empty array for invalid domain', () => {
      const clusters = navigator.getClusters('INVALID_DOMAIN');
      expect(clusters).toEqual([]);
    });

    it('should return clusters that belong to the requested domain', () => {
      const domains = navigator.getDomains();
      const firstDomain = domains[0];
      const clusters = navigator.getClusters(firstDomain.id);

      // Each cluster's parent_domain should contain the requested domain abbreviation
      clusters.forEach(cluster => {
        expect(cluster.parent_domain).toContain(firstDomain.id);
      });
    });
  });

  describe('getStandards', () => {
    it('should return standards for valid cluster', () => {
      const domains = navigator.getDomains();
      const firstDomain = domains[0];
      const clusters = navigator.getClusters(firstDomain.id);
      const firstCluster = clusters[0];
      const standards = navigator.getStandards(firstCluster.id);

      expect(Array.isArray(standards)).toBe(true);
      expect(standards.length).toBeGreaterThan(0);
    });

    it('should return standards with required fields', () => {
      const domains = navigator.getDomains();
      const firstDomain = domains[0];
      const clusters = navigator.getClusters(firstDomain.id);
      const firstCluster = clusters[0];
      const standards = navigator.getStandards(firstCluster.id);
      const standard = standards[0];

      expect(standard).toHaveProperty('id');
      expect(standard).toHaveProperty('parent_cluster');
      expect(standard).toHaveProperty('description');
    });

    it('should return empty array for invalid cluster', () => {
      const standards = navigator.getStandards('INVALID_CLUSTER');
      expect(standards).toEqual([]);
    });

    it('should return standards that belong to the requested cluster', () => {
      const domains = navigator.getDomains();
      const firstDomain = domains[0];
      const clusters = navigator.getClusters(firstDomain.id);
      const firstCluster = clusters[0];
      const standards = navigator.getStandards(firstCluster.id);

      standards.forEach(standard => {
        expect(standard.parent_cluster).toBe(firstCluster.id);
      });
    });
  });

  describe('hierarchy integrity', () => {
    it('should maintain proper domain -> cluster -> standard hierarchy', () => {
      const domains = navigator.getDomains();

      domains.forEach(domain => {
        const clusters = navigator.getClusters(domain.id);

        clusters.forEach(cluster => {
          // Cluster's parent_domain should contain the requested domain abbreviation
          expect(cluster.parent_domain).toContain(domain.id);

          const standards = navigator.getStandards(cluster.id);

          standards.forEach(standard => {
            expect(standard.parent_cluster).toBe(cluster.id);
          });
        });
      });
    });

    it('should have at least one standard for each cluster', () => {
      const domains = navigator.getDomains();

      domains.forEach(domain => {
        const clusters = navigator.getClusters(domain.id);

        clusters.forEach(cluster => {
          const standards = navigator.getStandards(cluster.id);
          expect(standards.length).toBeGreaterThan(0);
        });
      });
    });
  });
});

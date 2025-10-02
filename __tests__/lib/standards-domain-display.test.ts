/**
 * Tests for domain display and potential duplicate issues
 *
 * Testing specifically for domains like 'G' that appear multiple times
 * and ensuring they're properly labeled with grade levels
 */

import { loadStandards } from '@/lib/standards';

describe('Domain Display and Duplicate Detection', () => {
  let navigator: ReturnType<typeof loadStandards>;

  beforeAll(() => {
    navigator = loadStandards();
  });

  describe('Geometry (G) domains', () => {
    it('should have multiple G domains for different grade levels', () => {
      const domains = navigator.getDomains();
      const gDomains = domains.filter(d => d.name === 'G');

      console.log('G Domains found:', gDomains.map(d => ({ id: d.id, name: d.name })));

      // G exists for grades K, 1, 2, 3, 4, 5, 6, 7, 8 and high school
      expect(gDomains.length).toBeGreaterThan(1);
    });

    it('should have distinct IDs for all G domains', () => {
      const domains = navigator.getDomains();
      const gDomains = domains.filter(d => d.name === 'G');

      const ids = gDomains.map(d => d.id);
      const uniqueIds = new Set(ids);

      // All IDs should be unique
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include grade level in domain ID', () => {
      const domains = navigator.getDomains();
      const gDomains = domains.filter(d => d.name === 'G');

      // Check that each G domain has a grade prefix
      for (const domain of gDomains) {
        // Should be like K.G, 1.G, 2.G, etc. or G-CO, G-SRT for high school
        expect(domain.id).toMatch(/^([K12345678]\.G|G-[A-Z]+)$/);
      }
    });

    it('should not have duplicate domain IDs', () => {
      const domains = navigator.getDomains();
      const ids = domains.map(d => d.id);
      const idCounts = new Map<string, number>();

      // Count occurrences of each ID
      for (const id of ids) {
        idCounts.set(id, (idCounts.get(id) || 0) + 1);
      }

      // Find any duplicates
      const duplicates = Array.from(idCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([id, count]) => ({ id, count }));

      if (duplicates.length > 0) {
        console.error('Duplicate domain IDs found:', duplicates);
      }

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('All domains display check', () => {
    it('should not have any duplicate domain IDs in entire dataset', () => {
      const domains = navigator.getDomains();
      const ids = domains.map(d => d.id);
      const uniqueIds = new Set(ids);

      if (uniqueIds.size !== ids.length) {
        // Find duplicates
        const idCounts = new Map<string, number>();
        for (const id of ids) {
          idCounts.set(id, (idCounts.get(id) || 0) + 1);
        }

        const duplicates = Array.from(idCounts.entries())
          .filter(([, count]) => count > 1);

        console.error('Duplicate IDs found:', duplicates);
      }

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have proper display names for all domains', () => {
      const domains = navigator.getDomains();

      for (const domain of domains) {
        // Each domain should have both ID and name
        expect(domain.id).toBeDefined();
        expect(domain.name).toBeDefined();
        expect(domain.id).not.toBe('');
        expect(domain.name).not.toBe('');
      }
    });

    it('should display grade level clearly for domains with same abbreviation', () => {
      const domains = navigator.getDomains();

      // Group domains by abbreviation name
      const domainsByAbbreviation = new Map<string, typeof domains>();

      for (const domain of domains) {
        const abbr = domain.name;
        if (!domainsByAbbreviation.has(abbr)) {
          domainsByAbbreviation.set(abbr, []);
        }
        domainsByAbbreviation.get(abbr)!.push(domain);
      }

      // For each group with multiple domains, check they have distinct IDs
      for (const [abbr, domainGroup] of domainsByAbbreviation.entries()) {
        if (domainGroup.length > 1) {
          const ids = domainGroup.map(d => d.id);
          const uniqueIds = new Set(ids);

          if (uniqueIds.size !== ids.length) {
            console.error(`Duplicate IDs for abbreviation ${abbr}:`, ids);
          }

          expect(uniqueIds.size).toBe(ids.length);
        }
      }
    });
  });

  describe('User Interface Display Requirements', () => {
    it('domains with same abbreviation should be distinguishable in UI', () => {
      const domains = navigator.getDomains();

      // Find all domains with abbreviation 'G'
      const gDomains = domains.filter(d => d.name === 'G');

      // Each should have a unique ID that includes grade information
      const displayInfo = gDomains.map(d => ({
        id: d.id,
        name: d.name,
        display: `${d.id} - ${d.name}`, // How it might be displayed in UI
      }));

      console.log('G Domains display info:', displayInfo);

      // All display strings should be unique
      const displayStrings = displayInfo.map(d => d.display);
      const uniqueDisplays = new Set(displayStrings);

      expect(uniqueDisplays.size).toBe(displayStrings.length);
    });

    it('should provide grade level information for proper UI display', () => {
      const domains = navigator.getDomains();
      const gDomains = domains.filter(d => d.name === 'G');

      for (const domain of gDomains) {
        // The ID should contain grade information
        // Format: grade.domain (e.g., K.G, 1.G) or domain-subdomain (e.g., G-CO)
        const gradeMatch = domain.id.match(/^([K12345678])\.G$/);
        const hsMatch = domain.id.match(/^G-([A-Z]+)$/);

        expect(gradeMatch || hsMatch).toBeTruthy();

        if (gradeMatch) {
          const grade = gradeMatch[1];
          console.log(`Grade ${grade} Geometry: ${domain.id}`);
        } else if (hsMatch) {
          const subDomain = hsMatch[1];
          console.log(`High School Geometry - ${subDomain}: ${domain.id}`);
        }
      }
    });
  });
});
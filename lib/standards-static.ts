import standardsData from '../data/standards_de.json';
import { Standard, DomainInfo, ClusterInfo, StandardInfo } from './types';

/**
 * StandardsNavigator class for navigating Common Core standards hierarchy
 * This version loads standards from a static JSON import for Vercel compatibility
 */
export class StandardsNavigator {
  private standards: Map<string, Standard>;

  constructor() {
    this.standards = new Map();

    // Load standards from imported JSON data
    for (const standard of standardsData as Standard[]) {
      this.standards.set(standard.id, standard);
    }
  }

  /**
   * Get all unique domains across all grades
   */
  getDomains(): DomainInfo[] {
    const domains: DomainInfo[] = [];
    const seenIds = new Set<string>();

    for (const [id, standard] of this.standards.entries()) {
      if ((standard.level === 'Domain' || standard.level === 'domain') && !seenIds.has(id)) {
        seenIds.add(id);

        // Extract abbreviation from ID
        let abbreviation = id;
        if (id.includes('.')) {
          const parts = id.split('.');
          abbreviation = parts[parts.length - 1];
        } else if (id.includes('-')) {
          const parts = id.split('-');
          abbreviation = parts.length >= 2 ? parts[1] : id;
        } else {
          abbreviation = id;
        }

        domains.push({
          id: id,  // Use full domain ID (e.g., "K.NBT", "1.NBT")
          name: abbreviation,  // Display name (e.g., "NBT")
          description: standard.description,
          description_de: standard.description_de,
        });
      }
    }

    // Sort by ID (this will group by grade level, then domain)
    return domains.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Get all clusters for a given domain ID or abbreviation
   * Args: domainIdOrAbbr - Full domain ID (e.g., "K.NBT") or abbreviation (e.g., "NBT")
   * Returns clusters for the specific domain if full ID, or all matching domains if abbreviation
   */
  getClusters(domainIdOrAbbr: string): ClusterInfo[] {
    const clusters: ClusterInfo[] = [];

    // Check if this is a full domain ID or just an abbreviation
    const isFullId = domainIdOrAbbr.includes('.') || domainIdOrAbbr.includes('-');

    if (isFullId) {
      // Use the exact domain ID
      for (const [id, standard] of this.standards.entries()) {
        if ((standard.level === 'Cluster' || standard.level === 'cluster') &&
            standard.parent === domainIdOrAbbr) {
          clusters.push({
            id,
            description: standard.description,
            description_de: standard.description_de,
            parent_domain: domainIdOrAbbr,
          });
        }
      }
    } else {
      // Find all domains with this abbreviation and get their clusters
      const matchingDomains = this.getDomains().filter(d => {
        const abbr = d.id.includes('.') ? d.id.split('.').pop() : d.id;
        return abbr === domainIdOrAbbr;
      });

      for (const domain of matchingDomains) {
        for (const [id, standard] of this.standards.entries()) {
          if ((standard.level === 'Cluster' || standard.level === 'cluster') &&
              standard.parent === domain.id) {
            clusters.push({
              id,
              description: standard.description,
              description_de: standard.description_de,
              parent_domain: domain.id,
            });
          }
        }
      }
    }

    // Sort by ID
    return clusters.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Get all standards for a given cluster
   */
  getStandards(clusterId: string): StandardInfo[] {
    const standards: StandardInfo[] = [];

    // First, check if this cluster has sub-standards (e.g., K.CC.A.1, K.CC.A.2)
    const mainStandard = this.standards.get(clusterId);
    if (mainStandard && mainStandard.children && mainStandard.children.length > 0) {
      // Has sub-standards, use them
      for (const childId of mainStandard.children) {
        const child = this.standards.get(childId);
        if (child && (child.level === 'Standard' || child.level === 'standard')) {
          standards.push({
            id: childId,
            description: child.description,
            description_de: child.description_de,
            parent_cluster: clusterId,
          });
        }
      }
    } else {
      // Use main standard
      standards.push({
        id: mainStandard.id,
        description: mainStandard.description,
        description_de: mainStandard.description_de,
        parent_cluster: clusterId,
      });
    }

    return standards;
  }

  /**
   * Get a standard by ID
   */
  getStandard(standardId: string): Standard | null {
    return this.standards.get(standardId) || null;
  }

  /**
   * Get all standards (for debugging/testing)
   */
  getAllStandards(): Standard[] {
    return Array.from(this.standards.values());
  }
}

// Singleton instance
let navigatorInstance: StandardsNavigator | null = null;

/**
 * Load standards from static JSON (works in both server and serverless environments)
 * Uses singleton pattern to cache the navigator
 */
export function loadStandards(): StandardsNavigator {
  if (!navigatorInstance) {
    navigatorInstance = new StandardsNavigator();
  }
  return navigatorInstance;
}
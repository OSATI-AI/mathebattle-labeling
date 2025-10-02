import fs from 'fs';
import path from 'path';
import { Standard, DomainInfo, ClusterInfo, StandardInfo } from './types';

/**
 * StandardsNavigator class for navigating Common Core standards hierarchy
 */
export class StandardsNavigator {
  private standards: Map<string, Standard>;

  constructor(jsonlPath: string) {
    this.standards = new Map();

    // Try multiple paths for Vercel compatibility
    // First try public directory (for Vercel deployment)
    let resolvedPath = path.resolve(process.cwd(), 'public', jsonlPath);

    if (!fs.existsSync(resolvedPath)) {
      // Try direct path
      resolvedPath = path.resolve(process.cwd(), jsonlPath);

      if (!fs.existsSync(resolvedPath)) {
        // Try public/standards directory
        const publicStandardsPath = path.resolve(process.cwd(), 'public/standards', path.basename(jsonlPath));
        if (fs.existsSync(publicStandardsPath)) {
          resolvedPath = publicStandardsPath;
        } else {
          // Try .next/server path (where we copy files during build)
          const serverPath = path.resolve(process.cwd(), '.next/server', jsonlPath);
          if (fs.existsSync(serverPath)) {
            resolvedPath = serverPath;
          } else {
            // Try looking in parent directory (for Vercel serverless)
            const parentPath = path.resolve(process.cwd(), '..', jsonlPath);
            if (fs.existsSync(parentPath)) {
              resolvedPath = parentPath;
            }
          }
        }
      }
    }

    // Read and parse JSONL file
    const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const standard = JSON.parse(line) as Standard;
        this.standards.set(standard.id, standard);
      } catch (error) {
        console.error('Error parsing standard:', line, error);
      }
    }
  }

  /**
   * Get all unique domains with their descriptions
   * Returns array of { id, name, description, description_de }
   * Returns each domain abbreviation only once (e.g., one "NBT" for all grades)
   * id and name are the same abbreviation
   */
  getDomains(): DomainInfo[] {
    const domainsMap = new Map<string, DomainInfo>();

    for (const [id, standard] of this.standards.entries()) {
      if (standard.level === 'Domain' || standard.level === 'domain') {
        // Extract domain abbreviation
        // Elementary/Middle: "K.NBT" → "NBT", "1.NBT" → "NBT"
        // High School: "A-APR" → "APR", "F-BF" → "BF"
        let abbreviation: string;
        if (id.includes('.')) {
          const parts = id.split('.');
          abbreviation = parts.length >= 2 ? parts[1] : id;
        } else if (id.includes('-')) {
          const parts = id.split('-');
          abbreviation = parts.length >= 2 ? parts[1] : id;
        } else {
          abbreviation = id;
        }

        // Only add if we haven't seen this abbreviation yet
        if (!domainsMap.has(abbreviation)) {
          domainsMap.set(abbreviation, {
            id: abbreviation,  // Use abbreviation as ID
            name: abbreviation,  // Display name is also abbreviation
            description: standard.description,
            description_de: standard.description_de,
          });
        }
      }
    }

    // Convert to array and sort by abbreviation
    return Array.from(domainsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
            parent_domain: standard.parent,
          });
        }
      }
    } else {
      // Find all full domain IDs that match this abbreviation
      const matchingDomainIds: string[] = [];
      for (const [id, standard] of this.standards.entries()) {
        if (standard.level === 'Domain' || standard.level === 'domain') {
          let abbreviation: string;
          if (id.includes('.')) {
            const parts = id.split('.');
            abbreviation = parts.length >= 2 ? parts[1] : id;
          } else if (id.includes('-')) {
            const parts = id.split('-');
            abbreviation = parts.length >= 2 ? parts[1] : id;
          } else {
            abbreviation = id;
          }

          if (abbreviation === domainIdOrAbbr) {
            matchingDomainIds.push(id);
          }
        }
      }

      // Get all clusters for these domains
      for (const [id, standard] of this.standards.entries()) {
        if ((standard.level === 'Cluster' || standard.level === 'cluster') &&
            standard.parent && matchingDomainIds.includes(standard.parent)) {
          clusters.push({
            id,
            description: standard.description,
            description_de: standard.description_de,
            parent_domain: standard.parent,
          });
        }
      }
    }

    return clusters;
  }

  /**
   * Get all standards (most granular level) for a given cluster
   * Returns sub-standards if they exist, otherwise main standards
   * Args: clusterId - Full cluster ID (e.g., "4.NF.A")
   */
  getStandards(clusterId: string): StandardInfo[] {
    const standards: StandardInfo[] = [];

    // First, find all standards that belong to this cluster
    const mainStandards: Standard[] = [];

    for (const [id, standard] of this.standards.entries()) {
      if ((standard.level === 'Standard' || standard.level === 'standard') && standard.parent === clusterId) {
        mainStandards.push(standard);
      }
    }

    // For each main standard, check if it has sub-standards
    for (const mainStandard of mainStandards) {
      const subStandards: Standard[] = [];

      // Look for sub-standards
      for (const [id, standard] of this.standards.entries()) {
        const level = standard.level.toLowerCase();
        if (level === 'sub-standard' && standard.parent === mainStandard.id) {
          subStandards.push(standard);
        }
      }

      if (subStandards.length > 0) {
        // Use sub-standards instead of main standard
        for (const subStandard of subStandards) {
          standards.push({
            id: subStandard.id,
            description: subStandard.description,
            description_de: subStandard.description_de,
            parent_cluster: clusterId,
          });
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
 * Load standards from JSONL file (server-side only)
 * Uses singleton pattern to cache the navigator
 */
export function loadStandards(): StandardsNavigator {
  if (!navigatorInstance) {
    const standardsPath = 'data/standards/standards_de.jsonl';
    navigatorInstance = new StandardsNavigator(standardsPath);
  }
  return navigatorInstance;
}

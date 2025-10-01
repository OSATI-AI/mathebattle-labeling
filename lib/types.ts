// Type definitions for the labeling interface

export interface Task {
  task_id: number;
  name: string;
  description: string;
  task_image: Buffer | null;
  solution_image: Buffer | null;
  classname: string;
  sek1?: string;
  sek2?: string;
}

export interface TaskWithImages extends Omit<Task, 'task_image' | 'solution_image'> {
  task_image_base64: string | null;
  solution_image_base64: string | null;
}

export interface Label {
  task_id: number;
  labeler_id: string;
  timestamp: string;
  selected_domains: string[];
  selected_clusters: string[];
  selected_standards: Array<{
    standard_id: string;
    rank: number;
  }>;
  time_spent_seconds: number;
}

export interface Standard {
  id: string;
  description: string;
  description_de?: string;
  level: 'Domain' | 'Cluster' | 'Standard' | 'Sub-Standard' | 'domain' | 'cluster' | 'standard' | 'sub-standard';
  parent?: string;
  children?: string[];
}

export interface DomainInfo {
  id: string;
  name: string;
  description: string;
  description_de?: string;
}

export interface ClusterInfo {
  id: string;
  description: string;
  description_de?: string;
  parent_domain: string;
}

export interface StandardInfo {
  id: string;
  description: string;
  description_de?: string;
  parent_cluster: string;
}

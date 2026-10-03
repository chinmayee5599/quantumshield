/**
 * QuantumShield — Attack Graph Engine Type Definitions
 * Models directed attack graphs, edge exploitability metadata, path discovery,
 * cycle avoidance, multi-entry/multi-target configurations, and visualization schemas.
 */

import { CriticalityLevel } from '../../data/dataTypes';

export type AttackGraphNodeType =
  | 'endpoint'
  | 'server'
  | 'database'
  | 'identity'
  | 'service'
  | 'critical_asset';

export interface AttackGraphNode {
  id: string;
  name: string;
  label: string;
  nodeType: AttackGraphNodeType;
  tier: string;
  networkZone: string;
  criticality: CriticalityLevel;
  assetValue: number; // 1 - 100 numerical importance
  isEntryPoint: boolean;
  isCrownJewel: boolean;
  assignedCves: string[];
  ipAddress: string;
  operatingEnv: string;
  description: string;
  x?: number;
  y?: number;
}

export interface EdgeVulnerabilityMetadata {
  cveId: string;
  cvssBaseScore: number;
  severity: string;
  attackVector: string;
  privilegesRequired: string;
  exploitabilitySubscore: number;
  description: string;
}

export interface AttackGraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  service: string;
  protocol: string;
  port: number;
  trustTransition?: string;
  vulnerability: EdgeVulnerabilityMetadata | null;
  exploitLikelihood: number; // 0.05 to 1.0 probability
  privilegeRequirement: 'NONE' | 'LOW' | 'HIGH';
  riskContribution: number; // Numerical risk contribution to the path
  controlOpportunities: string[]; // Control IDs that can disrupt this edge
  controlNames: string[]; // Human readable names of mitigating controls
  description: string;
}

export interface AttackGraph {
  id: string;
  name: string;
  nodes: AttackGraphNode[];
  edges: AttackGraphEdge[];
  entryPointIds: string[];
  crownJewelIds: string[];
  metadata: {
    generatedAt: string;
    scenarioCategory?: string;
    totalAssets: number;
    totalTransitions: number;
  };
}

export interface AttackPathStep {
  stepNumber: number;
  sourceNodeId: string;
  sourceNodeName: string;
  targetNodeId: string;
  targetNodeName: string;
  edgeId: string;
  service: string;
  protocol: string;
  cveId?: string;
  cvssScore?: number;
  exploitLikelihood: number;
  controlOpportunities: string[];
}

export interface AttackPathResult {
  pathId: string;
  name: string;
  entryPointId: string;
  crownJewelId: string;
  nodeSequence: string[];
  edgeSequence: string[];
  length: number;
  cumulativeProbability: number;
  maxCvssScore: number;
  avgCvssScore: number;
  compositeRiskScore: number; // 1 - 100 normalized
  mitigatingControls: string[]; // Union of all controls that sever any edge in this path
  chokePoints: string[]; // Edge IDs where a single control severs multiple paths
  steps: AttackPathStep[];
}

export interface PathFinderOptions {
  entryPointIds?: string[];
  crownJewelIds?: string[];
  maxPathLength?: number; // Configurable max path length (default 8)
  maxPaths?: number; // Cap on total discovered paths (default 100)
}

export interface GraphValidationResult {
  isValid: boolean;
  hasCycles: boolean;
  cycleCount: number;
  detectedCycleSamples: string[][];
  reachableTargets: string[];
  unreachableTargets: string[];
  orphanedNodes: string[];
  errors: string[];
  warnings: string[];
  metrics: {
    nodeCount: number;
    edgeCount: number;
    entryPointCount: number;
    targetCount: number;
    density: number;
  };
}

export interface GraphVisualizationData {
  nodes: Array<AttackGraphNode & { x: number; y: number; colorTheme: string }>;
  edges: Array<AttackGraphEdge & { isSevered?: boolean; isHighlighted?: boolean }>;
  paths: AttackPathResult[];
  viewport: { width: number; height: number };
}

export interface GraphAnalysisResult {
  graph: AttackGraph;
  validation: GraphValidationResult;
  paths: AttackPathResult[];
  visualization: GraphVisualizationData;
}

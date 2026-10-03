/**
 * QuantumShield — Cybersecurity Domain Types
 * Models enterprise attack graphs, vulnerabilities, attack paths, and defensive controls.
 */

export type AssetTier = 'perimeter' | 'dmz' | 'internal' | 'identity' | 'core_server' | 'crown_jewel';

export type NodeStatus = 'compromised_entry' | 'exposed' | 'protected' | 'crown_jewel';

export type AttackTechnique = 
  | 'Initial Exploit'
  | 'Privilege Escalation'
  | 'Credential Access'
  | 'Lateral Movement'
  | 'Defense Evasion'
  | 'Data Exfiltration'
  | 'Command & Control';

export interface NetworkNode {
  id: string;
  name: string;
  label: string;
  tier: AssetTier;
  status: NodeStatus;
  ip: string;
  assetValue: number; // 1 - 100 importance scale
  description: string;
  x: number; // Layout coordinates for canvas/svg
  y: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  protocol: string;
  port: number;
  cveId?: string;
  technique: AttackTechnique;
  mitreId: string;
  exploitLikelihood: number; // 0.0 - 1.0 probability
  cvssBaseScore: number;     // 0.0 - 10.0
  description: string;
}

export interface AttackPath {
  id: string;
  name: string;
  nodes: string[];           // Sequence of node IDs from entry to crown jewel
  edges: string[];           // Sequence of edge IDs
  cumulativeProbability: number;
  riskScore: number;         // Calculated risk metric
  targetAssetValue: number;
  mitreTechniques: string[];
  severed: boolean;
  severedByControls: string[];
}

export interface DefensiveControl {
  id: string;
  name: string;
  shortCode: string;
  category: 'Network' | 'Identity' | 'Endpoint' | 'Patch' | 'ZeroTrust';
  description: string;
  mitigatesEdges: string[];  // Edge IDs severed by this control
  mitigatesNodes?: string[]; // Node IDs hardened
  implementationCost: number; // 1 - 20 normalized scale
  operationalFriction: number; // 1 - 10 operational disruption penalty
  efficacy: number;          // 0.0 - 1.0 mitigation certainty (usually 1.0 for binary cuts)
  selected?: boolean;        // In active solution
}

export interface CyberScenario {
  id: string;
  name: string;
  sector: string;
  threatActor: string;
  entryPointNodeId: string;
  crownJewelNodeId: string;
  description: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  defensiveControls: DefensiveControl[];
  defaultRiskThreshold: number;
}

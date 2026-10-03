/**
 * QuantumShield — Attack Path Risk Engine Types
 * Transparent, explainable risk scoring factors, configurable weights, and analyst reports.
 */

import { CriticalityLevel } from '../../data/dataTypes';

export type RiskSeverityCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskWeightConfig {
  weightTargetCriticality: number; // Default: 0.30
  weightVulnerability: number;     // Default: 0.25
  weightExploitability: number;    // Default: 0.20
  weightPrivilege: number;         // Default: 0.15
  weightBoundaries: number;        // Default: 0.10
}

export const DEFAULT_RISK_WEIGHTS: RiskWeightConfig = {
  weightTargetCriticality: 0.30,
  weightVulnerability: 0.25,
  weightExploitability: 0.20,
  weightPrivilege: 0.15,
  weightBoundaries: 0.10,
};

export interface EdgeRiskContribution {
  stepNumber: number;
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  cveId: string | null;
  cvssBaseScore: number;
  exploitLikelihood: number;
  privilegeRequirement: string;
  trustTransition: string;
  edgeRiskScore: number; // 0 - 100
  mitigatingControls: string[];
  justification: string;
}

export interface FactorBreakdown {
  targetCriticality: {
    rawLevel: CriticalityLevel;
    assetValue: number;
    factor: number; // 0.0 - 1.0
    weightedContribution: number;
    explanation: string;
  };
  vulnerabilitySeverity: {
    maxCvss: number;
    avgCvss: number;
    factor: number; // 0.0 - 1.0
    weightedContribution: number;
    explanation: string;
  };
  exploitability: {
    cumulativeLikelihood: number;
    geometricMeanLikelihood: number;
    factor: number; // 0.0 - 1.0
    weightedContribution: number;
    explanation: string;
  };
  privilegeEscalation: {
    escalationStepsCount: number;
    highestPrivilegeAttained: string;
    factor: number; // 0.0 - 1.0
    weightedContribution: number;
    explanation: string;
  };
  boundaryCrossings: {
    boundariesCrossedCount: number;
    zonesTraversed: string[];
    factor: number; // 0.0 - 1.0
    weightedContribution: number;
    explanation: string;
  };
  pathLength: {
    hopCount: number;
    multiplier: number; // 0.65 - 1.0
    explanation: string;
  };
}

export interface DetailedPathRiskReport {
  pathId: string;
  pathName: string;
  sourceNodeId: string;
  targetNodeId: string;
  totalRiskScore: number; // 0.0 - 100.0 (1 decimal place)
  severityCategory: RiskSeverityCategory;
  factorBreakdown: FactorBreakdown;
  individualEdgeRisks: EdgeRiskContribution[];
  analystExplanation: string[];
  chokePoints: string[];
  weightsUsed: RiskWeightConfig;
}

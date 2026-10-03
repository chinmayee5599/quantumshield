/**
 * QuantumShield — Defensive Control Model Types
 * Defines the defensive control catalog, explicit control-to-edge-to-path mappings,
 * and deterministic intervention simulation schemas.
 */

import { AttackPathResult } from '../attackGraph/types';
import { DetailedPathRiskReport } from '../risk/types';

export type DefensiveControlCategory =
  | 'Multi_Factor_Authentication'
  | 'Network_Segmentation'
  | 'Patch_Vulnerability'
  | 'Disable_Vulnerable_Service'
  | 'Restrict_Privilege'
  | 'Firewall_Rule'
  | 'Access_Policy'
  | 'Account_Hardening';

export interface DefensiveControl {
  controlId: string;
  name: string;
  category: DefensiveControlCategory;
  description: string;
  deploymentCost: number; // Synthetic relative optimization weight (1 - 20)
  operationalFriction: number; // Disruption penalty to business workflow (1 - 10)
  affectedAssetIds: string[];
  affectedEdgeIds: string[];
  implementationAssumptions: string;
  mitigationType: 'complete_severance' | 'risk_attenuation';
  attenuationFactor: number; // 1.0 = completely severs edge; 0.20 = lowers risk by 80%
}

export interface ControlToPathMapping {
  controlId: string;
  controlName: string;
  category: DefensiveControlCategory;
  cost: number;
  severedEdgeIds: string[];
  blockedPathIds: string[];
  partiallyMitigatedPathIds: string[];
  blockedPathsSummary: Array<{
    pathId: string;
    pathName: string;
    entryPoint: string;
    targetAsset: string;
    initialRisk: number;
    severedAtStep: number;
    severedEdgeId: string;
  }>;
}

export interface ControlInterventionImpact {
  selectedControlIds: string[];
  totalDeploymentCost: number;
  totalOperationalFriction: number;
  severedEdgeIds: string[];
  blockedPathIds: string[];
  unmitigatedPathIds: string[];
  initialPathCount: number;
  residualPathCount: number;
  initialTotalRisk: number;
  residualTotalRisk: number;
  absoluteRiskReduction: number;
  riskReductionPercentage: number;
  costEfficiencyRatio: number; // Risk reduced per unit of deployment cost
  isCrownJewelProtected: boolean; // True if ALL paths to Crown Jewel are severed
  blockedPaths: AttackPathResult[];
  residualPaths: AttackPathResult[];
  residualRiskReports: DetailedPathRiskReport[];
  analystSummary: string[];
}

/**
 * QuantumShield — QUBO Mathematical Optimization Layer Types
 * Defines the QUBO decision variables, coefficient matrices, objective breakdowns,
 * and solver result structures.
 */

export interface QuboVariable {
  index: number;
  controlId: string;
  controlName: string;
  category: string;
  cost: number;
  operationalFriction: number;
  mitigatedPathIds: string[];
}

export interface QuboWeightConfig {
  costWeight: number; // alpha: controls weight on deployment & friction cost (default: 1.0)
  pathPenaltyWeight: number; // beta: controls penalty weight on unblocked risk (default: 2.0)
  budgetPenaltyWeight?: number; // gamma: penalty weight for exceeding budget (default: 5.0)
}

export const DEFAULT_QUBO_WEIGHTS: QuboWeightConfig = {
  costWeight: 1.0,
  pathPenaltyWeight: 2.0,
  budgetPenaltyWeight: 5.0,
};

export interface QuboInstance {
  id: string;
  name: string;
  numVariables: number;
  variables: QuboVariable[];
  matrix: number[][]; // N x N upper-triangular QUBO matrix Q
  linearCoefficients: number[]; // Q_ii diagonal entries
  quadraticCoefficients: Array<{ i: number; j: number; weight: number }>; // Q_ij off-diagonal interaction terms
  constantOffset: number; // const in x^T Q x + const
  weights: QuboWeightConfig;
  budgetConstraint?: {
    maxBudget: number;
    penaltyWeight: number;
  };
  mathematicalFormulation: string;
}

export interface ControlSelectionDetail {
  controlId: string;
  name: string;
  category: string;
  cost: number;
  selectionReason: string;
  blockedPaths: string[];
}

export interface QuboSolution {
  bitstring: string; // e.g. "101000"
  selectedIndices: number[];
  selectedControlIds: string[];
  selectedControls: ControlSelectionDetail[];
  objectiveValue: number; // H(x) = x^T Q x + const
  breakdown: {
    deploymentCostTerm: number;
    unblockedPathPenaltyTerm: number;
    budgetPenaltyTerm: number;
    redundancyPenaltyTerm: number;
    constantOffset: number;
  };
  blockedPathsCount: number;
  totalPathsCount: number;
  allPathsBlocked: boolean;
  residualPathIds: string[];
  analystExplanation: string[];
  solverMethod: 'exhaustive_classical' | 'greedy_heuristic' | 'simulated_annealing';
  executionTimeMs: number;
}

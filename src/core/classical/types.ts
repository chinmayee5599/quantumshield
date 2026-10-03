/**
 * QuantumShield — Classical Optimization Baseline Types
 * Defines the standard output schemas for exact enumeration, greedy heuristics,
 * and simulated annealing benchmarks on the QUBO problem.
 */

import { DefensiveControl } from '../controls/types';

export type ClassicalSolverType =
  | 'exact_enumeration'
  | 'greedy_heuristic'
  | 'simulated_annealing';

export interface ClassicalSelectedControl {
  controlId: string;
  name: string;
  category: string;
  cost: number;
  friction: number;
}

export interface ClassicalOptimizationResult {
  solverType: ClassicalSolverType;
  solverName: string;
  bitstring: string;
  selectedIndices: number[];
  selectedControlIds: string[];
  selectedControls: ClassicalSelectedControl[];
  objectiveValue: number; // H(x) = x^T Q x + C_0
  totalCost: number; // Sum of deployment costs of selected controls
  totalFriction: number;
  initialRisk: number; // Baseline unmitigated path risk
  remainingRisk: number; // Risk of attack paths left unblocked
  riskReductionPercentage: number;
  blockedHighRiskPathsCount: number;
  totalPathsCount: number;
  allPathsBlocked: boolean;
  runtimeMs: number;
  statesEvaluated: number;
  isGlobalOptimumVerified: boolean;
}

export interface ClassicalComparisonReport {
  problemId: string;
  numVariables: number;
  numPaths: number;
  exactResult?: ClassicalOptimizationResult;
  greedyResult: ClassicalOptimizationResult;
  simulatedAnnealingResult: ClassicalOptimizationResult;
  bestMethod: ClassicalSolverType;
  optimalityGaps: {
    greedyGapPercentage: number | null; // (H_greedy - H_exact) / |H_exact| * 100
    saGapPercentage: number | null;     // (H_sa - H_exact) / |H_exact| * 100
  };
  runtimeComparison: {
    exactMs?: number;
    greedyMs: number;
    saMs: number;
  };
}

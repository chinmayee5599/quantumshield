/**
 * QuantumShield — Quantum Optimization Engine Types
 * Defines data structures for Ising Spin Hamiltonians, QAOA circuits,
 * measurement sampling, convergence telemetry, and Classical-vs-QAOA comparisons.
 */

import { ClassicalOptimizationResult } from '../classical/types';
import { DefensiveControl } from '../controls/types';

export interface IsingHamiltonian {
  numQubits: number;
  qubitLabels: string[];
  singleZCoefficients: number[]; // h_i longitudinal field terms on Z_i
  pairZzCoefficients: Array<{ i: number; j: number; weight: number }>; // J_ij coupling terms on Z_i Z_j
  constantOffset: number; // Constant scalar energy offset
  pauliStringRepresentation: string[]; // e.g. ["h0 * Z0", "J01 * Z0 Z1", ...]
}

export interface QaoaCircuitConfig {
  p: number; // QAOA depth (number of layers, default: 2)
  shots: number; // Number of measurement shots (default: 1024)
  seed?: number; // Reproducible PRNG seed
  maxIterations?: number; // Classical optimizer iterations for gamma, beta (default: 30)
  learningRate?: number;
  initialGamma?: number[];
  initialBeta?: number[];
}

export interface QaoaConvergenceStep {
  iteration: number;
  gamma: number[];
  beta: number[];
  expectationValue: number;
}

export interface QaoaCandidateSolution {
  bitstring: string;
  measuredCounts: number;
  probability: number;
  objectiveValue: number; // QUBO H(x)
  selectedControlIds: string[];
  totalCost: number;
  remainingRisk: number;
  blockedPathsCount: number;
}

export interface QaoaOptimizationResult {
  success: boolean;
  errorMessage?: string;
  executionMode: 'statevector_simulator' | 'hardware_qpu';
  numQubits: number;
  depthP: number;
  shots: number;
  optimalParameters: {
    gamma: number[];
    beta: number[];
  };
  expectationValue: number;
  bestBitstring: string;
  objectiveValue: number;
  selectedControls: Array<{
    controlId: string;
    name: string;
    category: string;
    cost: number;
  }>;
  selectedControlIds: string[];
  totalCost: number;
  totalFriction: number;
  initialRisk: number;
  remainingRisk: number;
  riskReductionPercentage: number;
  blockedHighRiskPathsCount: number;
  totalPathsCount: number;
  allPathsBlocked: boolean;
  runtimeMs: number;
  candidateBitstrings: QaoaCandidateSolution[];
  convergenceHistory: QaoaConvergenceStep[];
  analystSummary: string[];
}

export interface ClassicalVsQaoaComparison {
  problemId: string;
  numVariables: number;
  numPaths: number;
  evaluationDisclaimer: string; // "Experimental comparison only. No quantum advantage claimed."
  classicalBaseline: ClassicalOptimizationResult;
  qaoaResult: QaoaOptimizationResult;
  metrics: {
    objectiveDifference: number; // H_qaoa - H_classical
    costDifference: number; // Cost_qaoa - Cost_classical
    remainingRiskDifference: number; // Risk_qaoa - Risk_classical
    runtimeRatio: number; // Runtime_qaoa / Runtime_classical
    approximationRatio: number; // Theoretical QAOA quality metric
    matchExactSolution: boolean;
  };
  analystAssessment: string[];
}

/**
 * QuantumShield — Quantum & Optimization Types
 * Models QUBO matrix, Ising Hamiltonian, QAOA state, and benchmark comparisons.
 */

export interface QuboProblem {
  numVariables: number;
  variableNames: string[];
  variableIds: string[];
  // Symmetric or upper-triangular Q matrix: E(x) = x^T Q x
  matrix: number[][];
  linearTerms: number[];     // Diagonal Q_ii
  quadraticTerms: { i: number; j: number; weight: number }[]; // Off-diagonal Q_ij
  constantOffset: number;
  // Penalty multipliers used during construction
  costWeight: number;
  riskPenaltyWeight: number;
}

export interface IsingHamiltonian {
  numSpins: number;
  // H = sum h_i Z_i + sum J_ij Z_i Z_j + offset
  h: number[];               // Local magnetic fields
  J: number[][];             // Spin-spin coupling interaction matrix
  offset: number;            // Ground energy shift
}

export interface QaoaConfig {
  p: number;                 // QAOA depth / number of layers (1, 2, or 3)
  optimizer: 'cobyla' | 'nelder-mead' | 'grid';
  maxIterations: number;
  shots: number;             // Quantum measurement samples
  initialGamma?: number[];
  initialBeta?: number[];
}

export interface QaoaStateVectorStep {
  iteration: number;
  gamma: number[];
  beta: number[];
  costExpectation: number;
}

export interface QuantumMeasurementDistribution {
  bitstring: string;
  decodedControls: string[];
  probability: number;
  count: number;
  quboEnergy: number;
  isValid: boolean;          // Satisfies minimum attack path coverage
  cost: number;
  riskMitigatedPercent: number;
}

export interface SolverResult {
  solverName: string;
  solverType: 'quantum_qaoa' | 'classical_exact' | 'classical_greedy' | 'classical_annealing';
  selectedBitstring: string;
  selectedControlIds: string[];
  quboEnergy: number;
  executionTimeMs: number;
  totalCost: number;
  operationalFriction: number;
  pathsSeveredCount: number;
  totalPathsCount: number;
  residualRiskScore: number;
  riskMitigatedPercent: number;
  // Quantum-specific metadata (optional if classical)
  qaoaDetails?: {
    optimalGamma: number[];
    optimalBeta: number[];
    expectationEnergy: number;
    depth: number;
    convergenceHistory: QaoaStateVectorStep[];
    topMeasurements: QuantumMeasurementDistribution[];
    groundStateOverlap: number; // Probability of sampling true global minimum
    approximationRatio: number; // <H_C> / E_min
  };
}

export interface BenchmarkComparison {
  qaoa: SolverResult;
  exact: SolverResult;
  greedy: SolverResult;
  annealing: SolverResult;
  summary: {
    quantumFoundGlobalOpt: boolean;
    approximationRatio: number;
    speedComparison: string;
    scientificVerdict: string;
  };
}

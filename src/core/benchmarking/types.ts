/**
 * QuantumShield — Quantum vs Classical Benchmarking Types
 * Standardized schema for experiment records, multi-solver comparative evaluations,
 * and chart-ready visualization metrics.
 */

import { ClassicalOptimizationResult } from '../classical/types';
import { QaoaOptimizationResult } from '../quantum/types';
import { QuboWeightConfig } from '../qubo/types';

export interface ExperimentParameters {
  quboWeights: QuboWeightConfig;
  qaoaDepthP: number;
  qaoaShots: number;
  maxIterations?: number;
  budgetConstraint?: number;
}

export interface ChartDataPoint {
  label: string;
  classicalExact?: number | null;
  classicalGreedy: number;
  classicalSA: number;
  qaoa: number;
  unit: string;
}

export interface ExperimentChartDataset {
  objectiveComparison: ChartDataPoint;
  riskReductionComparison: ChartDataPoint;
  costComparison: ChartDataPoint;
  pathCoverageComparison: ChartDataPoint;
  runtimeComparison: ChartDataPoint;
  controlsSelectedComparison: ChartDataPoint;
  convergenceSeries: Array<{ iteration: number; expectationValue: number }>;
  measurementHistogram: Array<{ bitstring: string; count: number; probability: number }>;
}

export interface ExperimentRecord {
  experimentId: string;
  datasetId: string; // e.g. 'small-enterprise', 'financial-enterprise', 'large-telecom'
  scenarioName: string;
  numNodes: number;
  numEdges: number;
  numAttackPaths: number;
  numControls: number;
  timestamp: string; // ISO 8601
  randomSeed: number;
  parameters: ExperimentParameters;

  // Raw measured solver results
  classicalExactResult?: ClassicalOptimizationResult;
  classicalGreedyResult: ClassicalOptimizationResult;
  classicalSaResult: ClassicalOptimizationResult;
  qaoaResult: QaoaOptimizationResult;

  // Direct raw metric comparisons (QAOA vs best Classical baseline)
  comparisonMetrics: {
    objectiveDifference: number; // H_qaoa - H_classical_best
    costDifference: number; // Cost_qaoa - Cost_classical_best
    remainingRiskDifference: number; // Risk_qaoa - Risk_classical_best
    blockedPathsDifference: number; // Blocked_qaoa - Blocked_classical_best
    controlsSelectedCountDiff: number;
    runtimeRatio: number; // Runtime_qaoa / Runtime_classical_best
    exactMatch: boolean;
    solutionFeasible: boolean; // Satisfies budget constraint if set
  };

  // Human-readable, impartial objective narrative
  objectiveNarrative: string;
  evaluationDisclaimer: string;

  // Ready-to-render chart data
  charts: ExperimentChartDataset;
}

export interface BenchmarkSuiteSummary {
  suiteId: string;
  timestamp: string;
  experiments: ExperimentRecord[];
  aggregatedMetrics: {
    totalExperiments: number;
    exactMatchesCount: number;
    exactMatchRatePercentage: number;
    avgRuntimeRatio: number;
    avgPathCoverageQaoa: number;
    avgPathCoverageClassical: number;
  };
}

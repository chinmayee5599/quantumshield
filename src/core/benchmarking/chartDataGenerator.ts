/**
 * QuantumShield — Chart Data Generator
 * Transforms raw solver measurements into structured, ready-to-render chart series
 * without bias or exaggerated visual scaling.
 */

import { ClassicalOptimizationResult } from '../classical/types';
import { QaoaOptimizationResult } from '../quantum/types';
import { ExperimentChartDataset } from './types';

export class ChartDataGenerator {
  /**
   * Generates chart-ready comparative datasets for all key evaluation axes.
   */
  public static generateCharts(
    classicalExact: ClassicalOptimizationResult | undefined,
    classicalGreedy: ClassicalOptimizationResult,
    classicalSA: ClassicalOptimizationResult,
    qaoa: QaoaOptimizationResult
  ): ExperimentChartDataset {
    // 1. Objective Value Comparison
    const objectiveComparison = {
      label: 'QUBO Objective Energy (Lower is better)',
      classicalExact: classicalExact ? classicalExact.objectiveValue : null,
      classicalGreedy: classicalGreedy.objectiveValue,
      classicalSA: classicalSA.objectiveValue,
      qaoa: qaoa.objectiveValue,
      unit: 'Energy',
    };

    // 2. Risk Reduction %
    const riskReductionComparison = {
      label: 'Risk Reduction % (Higher is better)',
      classicalExact: classicalExact ? classicalExact.riskReductionPercentage : null,
      classicalGreedy: classicalGreedy.riskReductionPercentage,
      classicalSA: classicalSA.riskReductionPercentage,
      qaoa: qaoa.riskReductionPercentage,
      unit: '%',
    };

    // 3. Control Deployment Cost
    const costComparison = {
      label: 'Control Deployment Cost (Lower is better)',
      classicalExact: classicalExact ? classicalExact.totalCost : null,
      classicalGreedy: classicalGreedy.totalCost,
      classicalSA: classicalSA.totalCost,
      qaoa: qaoa.totalCost,
      unit: 'Cost Units',
    };

    // 4. Attack Path Coverage %
    const calcPathCoverage = (blocked: number, total: number) =>
      total > 0 ? Number(((blocked / total) * 100.0).toFixed(1)) : 100.0;

    const pathCoverageComparison = {
      label: 'High-Risk Path Coverage % (Higher is better)',
      classicalExact: classicalExact
        ? calcPathCoverage(classicalExact.blockedHighRiskPathsCount, classicalExact.totalPathsCount)
        : null,
      classicalGreedy: calcPathCoverage(classicalGreedy.blockedHighRiskPathsCount, classicalGreedy.totalPathsCount),
      classicalSA: calcPathCoverage(classicalSA.blockedHighRiskPathsCount, classicalSA.totalPathsCount),
      qaoa: calcPathCoverage(qaoa.blockedHighRiskPathsCount, qaoa.totalPathsCount),
      unit: '%',
    };

    // 5. Wall-Clock Runtime (ms)
    const runtimeComparison = {
      label: 'Execution Runtime (ms)',
      classicalExact: classicalExact ? classicalExact.runtimeMs : null,
      classicalGreedy: classicalGreedy.runtimeMs,
      classicalSA: classicalSA.runtimeMs,
      qaoa: qaoa.runtimeMs,
      unit: 'ms',
    };

    // 6. Controls Selected Count
    const controlsSelectedComparison = {
      label: 'Selected Controls Count',
      classicalExact: classicalExact ? classicalExact.selectedControlIds.length : null,
      classicalGreedy: classicalGreedy.selectedControlIds.length,
      classicalSA: classicalSA.selectedControlIds.length,
      qaoa: qaoa.selectedControlIds.length,
      unit: 'Controls',
    };

    // 7. Convergence Trajectory
    const convergenceSeries = qaoa.convergenceHistory.map(step => ({
      iteration: step.iteration,
      expectationValue: step.expectationValue,
    }));

    // 8. Measurement Histogram (Top states)
    const measurementHistogram = qaoa.candidateBitstrings.map(c => ({
      bitstring: c.bitstring,
      count: c.measuredCounts,
      probability: c.probability,
    }));

    return {
      objectiveComparison,
      riskReductionComparison,
      costComparison,
      pathCoverageComparison,
      runtimeComparison,
      controlsSelectedComparison,
      convergenceSeries,
      measurementHistogram,
    };
  }
}

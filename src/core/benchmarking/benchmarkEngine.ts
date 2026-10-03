/**
 * QuantumShield — Quantum vs Classical Benchmark Engine
 * Orchestrates side-by-side empirical evaluations between Classical optimizers and QAOA.
 * Strictly adheres to empirical reporting standards without marketing hype or false supremacy claims.
 */

import { analyzeScenarioGraph } from '../attackGraph';
import { ClassicalOptimizerBaseline } from '../classical';
import { DefensiveControl } from '../controls/types';
import { QaoaEngine } from '../quantum';
import { DEFAULT_QUBO_WEIGHTS, QuboBuilder } from '../qubo';
import { getScenario } from '../../data/dataAccess';
import { ChartDataGenerator } from './chartDataGenerator';
import {
  BenchmarkSuiteSummary,
  ExperimentParameters,
  ExperimentRecord,
} from './types';

export class BenchmarkEngine {
  private static storedExperiments: Map<string, ExperimentRecord> = new Map();

  /**
   * Executes a rigorous side-by-side benchmark experiment on a specified cyber scenario.
   */
  public static runExperiment(
    scenarioId: 'small' | 'financial' | 'large',
    parameters: Partial<ExperimentParameters> = {},
    seed: number = 42
  ): ExperimentRecord {
    const scenario = getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario '${scenarioId}' not found.`);
    }

    const graphAnalysis = analyzeScenarioGraph(scenario);

    const controls: DefensiveControl[] = scenario.controls.map(c => ({
      controlId: c.control_id,
      name: c.control_name,
      category: c.control_category as any,
      description: c.description,
      deploymentCost: c.deployment_cost,
      operationalFriction: c.operational_friction,
      affectedAssetIds: c.affected_asset_types,
      affectedEdgeIds: c.affected_edges,
      implementationAssumptions: c.implementation_assumption,
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    }));

    const weights = parameters.quboWeights || DEFAULT_QUBO_WEIGHTS;
    const depthP = parameters.qaoaDepthP || 2;
    const shots = parameters.qaoaShots || 1024;
    const maxIters = parameters.maxIterations || 20;
    const budget = parameters.budgetConstraint;

    // 1. Construct identical QUBO instance
    const qubo = QuboBuilder.buildQubo(controls, graphAnalysis.paths, weights, budget);

    // 2. Execute Classical Solvers
    const classicalExact =
      controls.length <= 18
        ? ClassicalOptimizerBaseline.solve(qubo, controls, graphAnalysis.paths, 'exact_enumeration')
        : undefined;

    const classicalGreedy = ClassicalOptimizerBaseline.solve(
      qubo,
      controls,
      graphAnalysis.paths,
      'greedy_heuristic'
    );

    const classicalSA = ClassicalOptimizerBaseline.solve(
      qubo,
      controls,
      graphAnalysis.paths,
      'simulated_annealing'
    );

    // 3. Execute QAOA Simulator on the exact same problem
    const qaoaResult = QaoaEngine.solve(qubo, controls, graphAnalysis.paths, {
      p: depthP,
      shots,
      seed,
      maxIterations: maxIters,
    });

    // 4. Reference baseline for comparisons (prefer exact ground truth if available)
    const baseline = classicalExact || classicalSA;

    // 5. Compute Direct Raw Metric Comparisons
    const objDiff = Number((qaoaResult.objectiveValue - baseline.objectiveValue).toFixed(4));
    const costDiff = qaoaResult.totalCost - baseline.totalCost;
    const riskDiff = Number((qaoaResult.remainingRisk - baseline.remainingRisk).toFixed(2));
    const blockedDiff = qaoaResult.blockedHighRiskPathsCount - baseline.blockedHighRiskPathsCount;
    const controlsCountDiff = qaoaResult.selectedControlIds.length - baseline.selectedControlIds.length;
    const runtimeRatio =
      baseline.runtimeMs > 0 ? Number((qaoaResult.runtimeMs / baseline.runtimeMs).toFixed(2)) : 1.0;
    const exactMatch = qaoaResult.bestBitstring === baseline.bitstring;

    // Feasibility: Check budget constraint if set
    let solutionFeasible = true;
    if (budget !== undefined && budget > 0) {
      solutionFeasible = qaoaResult.totalCost <= budget;
    }

    // 6. Generate Objective Narrative (Strictly empirical)
    const objectiveNarrative = `On this problem instance (${scenario.scenario_name}, ${controls.length} controls, ${graphAnalysis.paths.length} attack paths), QAOA with depth p=${depthP} and ${shots} shots produced an objective energy of ${qaoaResult.objectiveValue.toFixed(2)}, selecting ${qaoaResult.selectedControlIds.length} controls at cost ${qaoaResult.totalCost}, neutralizing ${qaoaResult.blockedHighRiskPathsCount} of ${graphAnalysis.paths.length} attack paths (${qaoaResult.riskReductionPercentage}% risk reduction). The classical ${baseline.solverType} baseline achieved an objective energy of ${baseline.objectiveValue.toFixed(2)} in ${baseline.runtimeMs}ms versus ${qaoaResult.runtimeMs}ms for the QAOA simulator.`;

    const evaluationDisclaimer =
      'EXPERIMENTAL BENCHMARK ONLY. Results reflect classical simulation of NISQ circuits under idealized noise-free assumptions. No quantum advantage or superiority is claimed.';

    // 7. Format Chart Ready Series
    const charts = ChartDataGenerator.generateCharts(
      classicalExact,
      classicalGreedy,
      classicalSA,
      qaoaResult
    );

    const experimentRecord: ExperimentRecord = {
      experimentId: `exp_${scenarioId}_${Date.now()}_${seed}`,
      datasetId: scenarioId,
      scenarioName: scenario.scenario_name,
      numNodes: scenario.assets.length,
      numEdges: scenario.network_edges.length,
      numAttackPaths: graphAnalysis.paths.length,
      numControls: controls.length,
      timestamp: new Date().toISOString(),
      randomSeed: seed,
      parameters: {
        quboWeights: weights,
        qaoaDepthP: depthP,
        qaoaShots: shots,
        maxIterations: maxIters,
        budgetConstraint: budget,
      },
      classicalExactResult: classicalExact,
      classicalGreedyResult: classicalGreedy,
      classicalSaResult: classicalSA,
      qaoaResult,
      comparisonMetrics: {
        objectiveDifference: objDiff,
        costDifference: costDiff,
        remainingRiskDifference: riskDiff,
        blockedPathsDifference: blockedDiff,
        controlsSelectedCountDiff: controlsCountDiff,
        runtimeRatio,
        exactMatch,
        solutionFeasible,
      },
      objectiveNarrative,
      evaluationDisclaimer,
      charts,
    };

    // Store record
    this.storedExperiments.set(experimentRecord.experimentId, experimentRecord);

    return experimentRecord;
  }

  /**
   * Retrieves all stored experiment records.
   */
  public static getStoredExperiments(): ExperimentRecord[] {
    return Array.from(this.storedExperiments.values());
  }

  /**
   * Executes a multi-scenario benchmarking suite across all available scenarios.
   */
  public static runSuite(
    scenarios: Array<'small' | 'financial' | 'large'> = ['small', 'financial'],
    config: Partial<ExperimentParameters> = {}
  ): BenchmarkSuiteSummary {
    const experiments = scenarios.map((scId, idx) => this.runExperiment(scId, config, 42 + idx));

    const total = experiments.length;
    const exactMatches = experiments.filter(e => e.comparisonMetrics.exactMatch).length;
    const avgRatio =
      experiments.reduce((sum, e) => sum + e.comparisonMetrics.runtimeRatio, 0) / Math.max(1, total);
    const avgQaoaCoverage =
      experiments.reduce((sum, e) => sum + e.qaoaResult.riskReductionPercentage, 0) / Math.max(1, total);
    const avgClassicalCoverage =
      experiments.reduce(
        (sum, e) => sum + (e.classicalExactResult?.riskReductionPercentage || e.classicalSaResult.riskReductionPercentage),
        0
      ) / Math.max(1, total);

    return {
      suiteId: `suite_${Date.now()}`,
      timestamp: new Date().toISOString(),
      experiments,
      aggregatedMetrics: {
        totalExperiments: total,
        exactMatchesCount: exactMatches,
        exactMatchRatePercentage: Number(((exactMatches / total) * 100.0).toFixed(1)),
        avgRuntimeRatio: Number(avgRatio.toFixed(2)),
        avgPathCoverageQaoa: Number(avgQaoaCoverage.toFixed(1)),
        avgPathCoverageClassical: Number(avgClassicalCoverage.toFixed(1)),
      },
    };
  }
}

/**
 * QuantumShield — Classical Optimizer Baseline Engine
 * Provides a unified interface to benchmark and execute classical solvers (Exact, Greedy, SA)
 * against the QUBO defensive control formulation.
 */

import { AttackPathResult } from '../attackGraph/types';
import { DefensiveControl } from '../controls/types';
import { QuboInstance } from '../qubo/types';
import { ExactBruteForceSolver } from './exactSolver';
import { GreedyHeuristicSolver } from './greedySolver';
import { SimulatedAnnealingSolver } from './simulatedAnnealingSolver';
import { ClassicalComparisonReport, ClassicalOptimizationResult, ClassicalSolverType } from './types';

export class ClassicalOptimizerBaseline {
  /**
   * Executes the most suitable classical solver based on problem dimensionality.
   */
  public static solve(
    qubo: QuboInstance,
    controls: DefensiveControl[],
    paths: AttackPathResult[],
    method?: ClassicalSolverType
  ): ClassicalOptimizationResult {
    const N = qubo.numVariables;

    if (method === 'exact_enumeration') {
      return ExactBruteForceSolver.solve(qubo, controls, paths);
    }
    if (method === 'greedy_heuristic') {
      return GreedyHeuristicSolver.solve(qubo, controls, paths);
    }
    if (method === 'simulated_annealing') {
      return SimulatedAnnealingSolver.solve(qubo, controls, paths);
    }

    // Default auto-routing:
    // If N <= 18 (2^18 = 262,144 states), exact binary enumeration finishes in < 50ms.
    // For N > 18, use Simulated Annealing.
    if (N <= 18) {
      return ExactBruteForceSolver.solve(qubo, controls, paths);
    }
    return SimulatedAnnealingSolver.solve(qubo, controls, paths);
  }

  /**
   * Runs all classical baseline solvers on the exact same QUBO instance
   * and produces a structured comparative benchmark report.
   */
  public static benchmarkAll(
    qubo: QuboInstance,
    controls: DefensiveControl[],
    paths: AttackPathResult[]
  ): ClassicalComparisonReport {
    const N = qubo.numVariables;

    // 1. Exact Enumeration (if N <= 18)
    let exactResult: ClassicalOptimizationResult | undefined;
    if (N <= 18) {
      exactResult = ExactBruteForceSolver.solve(qubo, controls, paths);
    }

    // 2. Greedy Heuristic
    const greedyResult = GreedyHeuristicSolver.solve(qubo, controls, paths);

    // 3. Simulated Annealing
    const simulatedAnnealingResult = SimulatedAnnealingSolver.solve(qubo, controls, paths);

    // Calculate optimality gaps if exact ground truth is available
    let greedyGapPercentage: number | null = null;
    let saGapPercentage: number | null = null;

    if (exactResult) {
      const denom = Math.abs(exactResult.objectiveValue) > 1e-4 ? Math.abs(exactResult.objectiveValue) : 1.0;
      greedyGapPercentage = Number(
        (((greedyResult.objectiveValue - exactResult.objectiveValue) / denom) * 100.0).toFixed(2)
      );
      saGapPercentage = Number(
        (((simulatedAnnealingResult.objectiveValue - exactResult.objectiveValue) / denom) * 100.0).toFixed(2)
      );
    }

    // Determine best performing solver
    const candidates = [greedyResult, simulatedAnnealingResult];
    if (exactResult) candidates.push(exactResult);
    candidates.sort((a, b) => a.objectiveValue - b.objectiveValue);
    const bestMethod = candidates[0].solverType;

    return {
      problemId: qubo.id,
      numVariables: N,
      numPaths: paths.length,
      exactResult,
      greedyResult,
      simulatedAnnealingResult,
      bestMethod,
      optimalityGaps: {
        greedyGapPercentage,
        saGapPercentage,
      },
      runtimeComparison: {
        exactMs: exactResult?.runtimeMs,
        greedyMs: greedyResult.runtimeMs,
        saMs: simulatedAnnealingResult.runtimeMs,
      },
    };
  }
}

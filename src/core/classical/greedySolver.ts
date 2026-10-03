/**
 * QuantumShield — Scalable Classical Greedy Heuristic Solver
 * Rapidly navigates the QUBO energy surface using steepest descent local search.
 * Scales in O(N^2) to hundreds of variables.
 */

import { AttackPathResult } from '../attackGraph/types';
import { DefensiveControl } from '../controls/types';
import { QuboInstance } from '../qubo/types';
import { ClassicalEvaluator } from './evaluator';
import { ClassicalOptimizationResult } from './types';

export class GreedyHeuristicSolver {
  /**
   * Solves the QUBO instance using greedy steepest coordinate descent.
   */
  public static solve(
    qubo: QuboInstance,
    controls: DefensiveControl[],
    paths: AttackPathResult[],
    maxIterations: number = 100
  ): ClassicalOptimizationResult {
    const startTime = performance.now();
    const N = qubo.numVariables;

    // Start with all controls deactivated: x = [0, ..., 0]
    let x = new Array(N).fill(0);
    let currentEnergy = ClassicalEvaluator.evaluateEnergy(qubo, x);
    let statesEvaluated = 1;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      let bestDelta = 0;
      let bestFlipIndex = -1;

      // Evaluate the impact of flipping each coordinate
      for (let i = 0; i < N; i++) {
        const delta = ClassicalEvaluator.evaluateFlipDelta(qubo, x, i);
        statesEvaluated++;

        if (delta < bestDelta) {
          bestDelta = delta;
          bestFlipIndex = i;
        }
      }

      // If no improvement can be made, we have reached a local optimum
      if (bestFlipIndex === -1 || bestDelta >= -1e-6) {
        break;
      }

      // Apply the best single-bit flip
      x[bestFlipIndex] = x[bestFlipIndex] === 0 ? 1 : 0;
      currentEnergy += bestDelta;
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return ClassicalEvaluator.buildResult(
      qubo,
      controls,
      paths,
      x,
      'greedy_heuristic',
      `Greedy Steepest Coordinate Descent (${iteration} iterations)`,
      durationMs,
      statesEvaluated,
      false // Heuristic cannot guarantee global optimum
    );
  }
}

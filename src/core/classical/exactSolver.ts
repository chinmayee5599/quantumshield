/**
 * QuantumShield — Exact Exhaustive Classical Solver
 * Exhaustively evaluates all 2^N binary assignments for small-to-medium QUBO instances (N <= 20).
 * Guaranteed to find the true mathematical global minimum.
 */

import { AttackPathResult } from '../attackGraph/types';
import { DefensiveControl } from '../controls/types';
import { QuboInstance } from '../qubo/types';
import { ClassicalEvaluator } from './evaluator';
import { ClassicalOptimizationResult } from './types';

export class ExactBruteForceSolver {
  /**
   * Solves the QUBO instance by evaluating all 2^N states.
   */
  public static solve(
    qubo: QuboInstance,
    controls: DefensiveControl[],
    paths: AttackPathResult[]
  ): ClassicalOptimizationResult {
    const startTime = performance.now();
    const N = qubo.numVariables;

    if (N > 21) {
      throw new Error(
        `Exact enumeration requires evaluating 2^${N} states (${(1 << N).toLocaleString()}), exceeding safety threshold N <= 21.`
      );
    }

    const totalStates = 1 << N;
    let bestEnergy = Infinity;
    let bestX: number[] = new Array(N).fill(0);

    for (let state = 0; state < totalStates; state++) {
      // Decode integer to binary vector
      const x: number[] = new Array(N);
      for (let i = 0; i < N; i++) {
        x[i] = (state >> i) & 1;
      }

      // Fast energy calculation
      let energy = qubo.constantOffset;
      for (let i = 0; i < N; i++) {
        if (x[i] === 1) {
          energy += qubo.matrix[i][i];
          for (let j = i + 1; j < N; j++) {
            if (x[j] === 1) {
              energy += qubo.matrix[i][j];
            }
          }
        }
      }

      if (energy < bestEnergy) {
        bestEnergy = energy;
        bestX = x;
      }
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return ClassicalEvaluator.buildResult(
      qubo,
      controls,
      paths,
      bestX,
      'exact_enumeration',
      `Exact Binary Enumeration (2^${N} = ${totalStates} states)`,
      durationMs,
      totalStates,
      true // Mathematically verified global optimum
    );
  }
}

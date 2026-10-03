/**
 * QuantumShield — Classical Simulated Annealing Solver
 * Escapes local minima via thermal fluctuations governed by the Metropolis-Hastings criterion.
 * Serves as an advanced classical metaheuristic baseline for QUBO problems.
 */

import { AttackPathResult } from '../attackGraph/types';
import { DefensiveControl } from '../controls/types';
import { QuboInstance } from '../qubo/types';
import { ClassicalEvaluator } from './evaluator';
import { ClassicalOptimizationResult } from './types';

export interface SimulatedAnnealingConfig {
  initialTemperature?: number;
  coolingRate?: number;
  stepsPerTemperature?: number;
  minTemperature?: number;
  restarts?: number;
  seed?: number;
}

export class SimulatedAnnealingSolver {
  /**
   * Solves the QUBO instance using multi-start simulated annealing.
   */
  public static solve(
    qubo: QuboInstance,
    controls: DefensiveControl[],
    paths: AttackPathResult[],
    config: SimulatedAnnealingConfig = {}
  ): ClassicalOptimizationResult {
    const startTime = performance.now();
    const N = qubo.numVariables;

    const initialT = config.initialTemperature || 50.0;
    const coolingRate = config.coolingRate || 0.95;
    const stepsPerT = config.stepsPerTemperature || 20;
    const minT = config.minTemperature || 0.05;
    const restarts = config.restarts || 3;

    // Pseudo-random generator (LCG) for reproducible runs if seed provided
    let randSeed = config.seed || 12345;
    const pseudoRandom = () => {
      randSeed = (randSeed * 1664525 + 1013904223) % 4294967296;
      return randSeed / 4294967296;
    };

    let globalBestEnergy = Infinity;
    let globalBestX = new Array(N).fill(0);
    let totalStatesEvaluated = 0;

    for (let restart = 0; restart < restarts; restart++) {
      // Initialize state (first restart starts with greedy or zeros, subsequent random)
      let currentX: number[];
      if (restart === 0) {
        currentX = new Array(N).fill(0);
      } else {
        currentX = Array.from({ length: N }, () => (pseudoRandom() > 0.5 ? 1 : 0));
      }

      let currentEnergy = ClassicalEvaluator.evaluateEnergy(qubo, currentX);
      totalStatesEvaluated++;

      let localBestEnergy = currentEnergy;
      let localBestX = [...currentX];

      let T = initialT;

      while (T > minT) {
        for (let step = 0; step < stepsPerT; step++) {
          // Choose a random coordinate to flip
          const flipIdx = Math.floor(pseudoRandom() * N);
          const delta = ClassicalEvaluator.evaluateFlipDelta(qubo, currentX, flipIdx);
          totalStatesEvaluated++;

          // Metropolis-Hastings acceptance condition
          let accept = false;
          if (delta < 0) {
            accept = true;
          } else {
            const acceptanceProb = Math.exp(-delta / T);
            if (pseudoRandom() < acceptanceProb) {
              accept = true;
            }
          }

          if (accept) {
            currentX[flipIdx] = currentX[flipIdx] === 0 ? 1 : 0;
            currentEnergy += delta;

            if (currentEnergy < localBestEnergy) {
              localBestEnergy = currentEnergy;
              localBestX = [...currentX];
            }
          }
        }
        T *= coolingRate;
      }

      if (localBestEnergy < globalBestEnergy) {
        globalBestEnergy = localBestEnergy;
        globalBestX = [...localBestX];
      }
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return ClassicalEvaluator.buildResult(
      qubo,
      controls,
      paths,
      globalBestX,
      'simulated_annealing',
      `Classical Simulated Annealing (${restarts} restarts, T_0=${initialT})`,
      durationMs,
      totalStatesEvaluated,
      false
    );
  }
}

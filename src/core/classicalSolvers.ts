/**
 * QuantumShield — Classical Solvers Baseline
 * Exact Brute-Force, Greedy Heuristic, and Simulated Annealing.
 */

import { AttackPath, DefensiveControl } from '../types/cyber';
import { QuboProblem, SolverResult } from '../types/quantum';
import { GraphAnalyzer } from './graphAnalyzer';
import { QuboEngine } from './quboEngine';

export class ClassicalSolvers {
  /**
   * Exact Exhaustive Search Solver (Brute Force over 2^n states)
   * Guaranteed global minimum ground truth.
   */
  public static solveExact(
    qubo: QuboProblem,
    controls: DefensiveControl[],
    paths: AttackPath[],
    graphAnalyzer: GraphAnalyzer
  ): SolverResult {
    const startTime = performance.now();
    const n = qubo.numVariables;
    const totalStates = 1 << n;

    let bestBitstring = '0'.repeat(n);
    let bestEnergy = Infinity;

    for (let x = 0; x < totalStates; x++) {
      const bitstring = x.toString(2).padStart(n, '0');
      const energy = QuboEngine.evaluateQuboEnergy(qubo, bitstring);
      if (energy < bestEnergy) {
        bestEnergy = energy;
        bestBitstring = bitstring;
      }
    }

    const duration = performance.now() - startTime;
    return this.packageResult(
      'Exact Ground Truth (Exhaustive)',
      'classical_exact',
      bestBitstring,
      bestEnergy,
      duration,
      controls,
      paths,
      graphAnalyzer
    );
  }

  /**
   * Greedy Heuristic Solver
   * Iteratively selects the control with maximum risk reduction per cost unit.
   */
  public static solveGreedy(
    qubo: QuboProblem,
    controls: DefensiveControl[],
    paths: AttackPath[],
    graphAnalyzer: GraphAnalyzer
  ): SolverResult {
    const startTime = performance.now();
    const n = qubo.numVariables;
    const currentBits = new Array(n).fill(0);
    let currentEnergy = QuboEngine.evaluateQuboEnergy(qubo, currentBits.join(''));

    let improved = true;
    while (improved) {
      improved = false;
      let bestCandidate = -1;
      let bestCandidateEnergy = currentEnergy;

      for (let i = 0; i < n; i++) {
        if (currentBits[i] === 0) {
          currentBits[i] = 1;
          const candidateEnergy = QuboEngine.evaluateQuboEnergy(qubo, currentBits.join(''));
          if (candidateEnergy < bestCandidateEnergy) {
            bestCandidateEnergy = candidateEnergy;
            bestCandidate = i;
          }
          currentBits[i] = 0; // Revert
        }
      }

      if (bestCandidate !== -1 && bestCandidateEnergy < currentEnergy - 1e-4) {
        currentBits[bestCandidate] = 1;
        currentEnergy = bestCandidateEnergy;
        improved = true;
      }
    }

    const duration = performance.now() - startTime;
    return this.packageResult(
      'Greedy Heuristic (Marginal Gain)',
      'classical_greedy',
      currentBits.join(''),
      currentEnergy,
      duration,
      controls,
      paths,
      graphAnalyzer
    );
  }

  /**
   * Simulated Annealing Solver
   * Classical thermal sampling with Metropolis-Hastings criterion.
   */
  public static solveSimulatedAnnealing(
    qubo: QuboProblem,
    controls: DefensiveControl[],
    paths: AttackPath[],
    graphAnalyzer: GraphAnalyzer,
    initialTemp: number = 10.0,
    coolingRate: number = 0.95,
    stepsPerTemp: number = 20,
    minTemp: number = 0.01
  ): SolverResult {
    const startTime = performance.now();
    const n = qubo.numVariables;

    // Random initial state
    const state: number[] = Array.from({ length: n }, () => (Math.random() > 0.5 ? 1 : 0));
    let currentEnergy = QuboEngine.evaluateQuboEnergy(qubo, state.join(''));

    let bestState = [...state];
    let bestEnergy = currentEnergy;

    let T = initialTemp;
    while (T > minTemp) {
      for (let s = 0; s < stepsPerTemp; s++) {
        // Flip one random bit
        const flipIdx = Math.floor(Math.random() * n);
        state[flipIdx] = state[flipIdx] === 1 ? 0 : 1;
        const nextEnergy = QuboEngine.evaluateQuboEnergy(qubo, state.join(''));
        const delta = nextEnergy - currentEnergy;

        if (delta < 0 || Math.random() < Math.exp(-delta / T)) {
          currentEnergy = nextEnergy;
          if (currentEnergy < bestEnergy) {
            bestEnergy = currentEnergy;
            bestState = [...state];
          }
        } else {
          // Reject flip
          state[flipIdx] = state[flipIdx] === 1 ? 0 : 1;
        }
      }
      T *= coolingRate;
    }

    const duration = performance.now() - startTime;
    return this.packageResult(
      'Simulated Annealing (Thermal MCMC)',
      'classical_annealing',
      bestState.join(''),
      bestEnergy,
      duration,
      controls,
      paths,
      graphAnalyzer
    );
  }

  private static packageResult(
    solverName: string,
    solverType: SolverResult['solverType'],
    bitstring: string,
    quboEnergy: number,
    durationMs: number,
    controls: DefensiveControl[],
    paths: AttackPath[],
    graphAnalyzer: GraphAnalyzer
  ): SolverResult {
    const selectedControlIds: string[] = [];
    let totalCost = 0;
    let operationalFriction = 0;

    for (let i = 0; i < bitstring.length; i++) {
      if (bitstring[i] === '1') {
        const ctrl = controls[i];
        if (ctrl) {
          selectedControlIds.push(ctrl.id);
          totalCost += ctrl.implementationCost;
          operationalFriction += ctrl.operationalFriction;
        }
      }
    }

    const evalResult = graphAnalyzer.evaluatePathMitigation(paths, selectedControlIds, controls);

    return {
      solverName,
      solverType,
      selectedBitstring: bitstring,
      selectedControlIds,
      quboEnergy: Number(quboEnergy.toFixed(4)),
      executionTimeMs: Number(durationMs.toFixed(2)),
      totalCost,
      operationalFriction,
      pathsSeveredCount: evalResult.severedCount,
      totalPathsCount: paths.length,
      residualRiskScore: evalResult.residualRisk,
      riskMitigatedPercent: evalResult.mitigatedRiskPercent,
    };
  }
}

/**
 * QuantumShield — QAOA Quantum Optimization Engine
 * Orchestrates the full pipeline:
 * QUBO -> Ising Hamiltonian -> QAOA Circuit -> Parameter Optimization -> Measurement -> Control Selection
 *
 * Implements strict experimental benchmarking against classical baselines with zero false advantage claims.
 */

import { AttackPathResult } from '../attackGraph/types';
import { ClassicalOptimizationResult } from '../classical/types';
import { ClassicalEvaluator } from '../classical/evaluator';
import { DefensiveControl } from '../controls/types';
import { QuboInstance } from '../qubo/types';
import { IsingConverter } from './isingConverter';
import { QaoaQuantumSimulator } from './qaoaSimulator';
import {
  ClassicalVsQaoaComparison,
  QaoaCandidateSolution,
  QaoaCircuitConfig,
  QaoaOptimizationResult,
} from './types';

export class QaoaEngine {
  /**
   * Executes the QAOA quantum optimization pipeline on the given QUBO problem.
   */
  public static solve(
    qubo: QuboInstance,
    controls: DefensiveControl[],
    paths: AttackPathResult[],
    config: QaoaCircuitConfig = { p: 2, shots: 1024, seed: 42 }
  ): QaoaOptimizationResult {
    const startTime = performance.now();
    const N = qubo.numVariables;

    if (N > 18) {
      return {
        success: false,
        errorMessage: `Quantum statevector simulator limited to N <= 18 qubits (problem has N = ${N}). For larger topologies, classical heuristics or QPU cloud execution should be used.`,
        executionMode: 'statevector_simulator',
        numQubits: N,
        depthP: config.p,
        shots: config.shots,
        optimalParameters: { gamma: [], beta: [] },
        expectationValue: 0,
        bestBitstring: '0'.repeat(N),
        objectiveValue: qubo.constantOffset,
        selectedControls: [],
        selectedControlIds: [],
        totalCost: 0,
        totalFriction: 0,
        initialRisk: 0,
        remainingRisk: 0,
        riskReductionPercentage: 0,
        blockedHighRiskPathsCount: 0,
        totalPathsCount: paths.length,
        allPathsBlocked: false,
        runtimeMs: 0,
        candidateBitstrings: [],
        convergenceHistory: [],
        analystSummary: ['Execution halted: Problem dimensionality exceeds simulator qubit threshold.'],
      };
    }

    const p = Math.max(1, config.p || 2);
    const shots = config.shots || 1024;
    const seed = config.seed ?? 42;
    const maxIters = config.maxIterations || 20;

    // 1. Transform QUBO to Ising Spin Hamiltonian
    const ising = IsingConverter.fromQubo(qubo);

    // 2. Precompute QUBO diagonal energies E(x) for all 2^N basis states
    const dim = 1 << N;
    const diagonalEnergies = new Array<number>(dim);
    for (let x = 0; x < dim; x++) {
      const bitVec: number[] = new Array(N);
      for (let i = 0; i < N; i++) {
        bitVec[i] = (x >> i) & 1;
      }
      diagonalEnergies[x] = ClassicalEvaluator.evaluateEnergy(qubo, bitVec);
    }

    // 3. Classical parameter optimization for (gamma, beta)
    const optimization = QaoaQuantumSimulator.optimizeParameters(
      N,
      diagonalEnergies,
      p,
      maxIters
    );

    // 4. Compute final optimized quantum statevector
    const { real, imag } = QaoaQuantumSimulator.computeStatevector(
      N,
      diagonalEnergies,
      p,
      optimization.bestGamma,
      optimization.bestBeta
    );

    // 5. Simulate projective measurement shots (Born's rule)
    const measurementSamples = QaoaQuantumSimulator.sampleMeasurements(
      N,
      real,
      imag,
      shots,
      seed
    );

    // 6. Decode candidate bitstrings and evaluate against the original QUBO objective
    const candidates: QaoaCandidateSolution[] = [];

    measurementSamples.forEach((sample, bitstring) => {
      const x = bitstring.split('').map(Number);
      const evalResult = ClassicalEvaluator.buildResult(
        qubo,
        controls,
        paths,
        x,
        'exact_enumeration',
        'QAOA Measurement Sample',
        0,
        1,
        false
      );

      candidates.push({
        bitstring,
        measuredCounts: sample.count,
        probability: sample.probability,
        objectiveValue: evalResult.objectiveValue,
        selectedControlIds: evalResult.selectedControlIds,
        totalCost: evalResult.totalCost,
        remainingRisk: evalResult.remainingRisk,
        blockedPathsCount: evalResult.blockedHighRiskPathsCount,
      });
    });

    // Sort candidates primarily by lowest objective value, secondarily by shot frequency
    candidates.sort((a, b) => {
      if (a.objectiveValue !== b.objectiveValue) {
        return a.objectiveValue - b.objectiveValue;
      }
      return b.measuredCounts - a.measuredCounts;
    });

    const bestCandidate = candidates[0];
    const bestBitVec = bestCandidate.bitstring.split('').map(Number);

    const fullEvaluation = ClassicalEvaluator.buildResult(
      qubo,
      controls,
      paths,
      bestBitVec,
      'exact_enumeration',
      'QAOA Best Candidate',
      0,
      shots,
      false
    );

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    const analystSummary: string[] = [
      `QAOA Circuit Configuration: p=${p} layers, ${shots} measurement shots, N=${N} qubits`,
      `Optimal Variational Parameters: gamma=[${optimization.bestGamma.join(', ')}], beta=[${optimization.bestBeta.join(', ')}]`,
      `Final Energy Expectation <H_C>: ${optimization.bestExpectation.toFixed(2)} (Convergence achieved in ${optimization.history.length - 1} steps)`,
      `Sampled Bitstring: [${bestCandidate.bitstring}] (Observed ${bestCandidate.measuredCounts} times / ${(bestCandidate.probability * 100).toFixed(2)}% probability)`,
      `Defensive Outcome: ${fullEvaluation.blockedHighRiskPathsCount} of ${paths.length} attack paths neutralized with cost of ${fullEvaluation.totalCost}`,
      `Crown Jewel Defense: ${fullEvaluation.allPathsBlocked ? 'FORTIFIED (100% paths severed)' : `EXPOSED (${paths.length - fullEvaluation.blockedHighRiskPathsCount} residual paths remain)`}`,
    ];

    return {
      success: true,
      executionMode: 'statevector_simulator',
      numQubits: N,
      depthP: p,
      shots,
      optimalParameters: {
        gamma: optimization.bestGamma,
        beta: optimization.bestBeta,
      },
      expectationValue: optimization.bestExpectation,
      bestBitstring: bestCandidate.bitstring,
      objectiveValue: fullEvaluation.objectiveValue,
      selectedControls: fullEvaluation.selectedControls,
      selectedControlIds: fullEvaluation.selectedControlIds,
      totalCost: fullEvaluation.totalCost,
      totalFriction: fullEvaluation.totalFriction,
      initialRisk: fullEvaluation.initialRisk,
      remainingRisk: fullEvaluation.remainingRisk,
      riskReductionPercentage: fullEvaluation.riskReductionPercentage,
      blockedHighRiskPathsCount: fullEvaluation.blockedHighRiskPathsCount,
      totalPathsCount: paths.length,
      allPathsBlocked: fullEvaluation.allPathsBlocked,
      runtimeMs: durationMs,
      candidateBitstrings: candidates.slice(0, 10),
      convergenceHistory: optimization.history,
      analystSummary,
    };
  }

  /**
   * Compares the classical baseline against the QAOA solution.
   * Strictly reports measured empirical results without false claims of quantum advantage.
   */
  public static compareClassicalVsQaoa(
    classical: ClassicalOptimizationResult,
    qaoa: QaoaOptimizationResult,
    qubo: QuboInstance
  ): ClassicalVsQaoaComparison {
    const objDiff = Number((qaoa.objectiveValue - classical.objectiveValue).toFixed(4));
    const costDiff = qaoa.totalCost - classical.totalCost;
    const riskDiff = Number((qaoa.remainingRisk - classical.remainingRisk).toFixed(2));
    const runtimeRatio =
      classical.runtimeMs > 0 ? Number((qaoa.runtimeMs / classical.runtimeMs).toFixed(2)) : 1.0;

    // Approximation ratio: H_exact / H_qaoa (or normalized bounded ratio)
    let approxRatio = 1.0;
    if (Math.abs(classical.objectiveValue) > 1e-4) {
      approxRatio = Number((classical.objectiveValue / qaoa.objectiveValue).toFixed(3));
    }

    const matchExact = qaoa.bestBitstring === classical.bitstring;

    const analystAssessment: string[] = [
      `Objective Difference (H_QAOA - H_Classical): ${objDiff > 0 ? '+' : ''}${objDiff}`,
      `Solution Bitstring Match: ${matchExact ? 'EXACT MATCH (QAOA discovered the global mathematical optimum)' : 'APPROXIMATE (QAOA discovered a near-optimal local state)'}`,
      `Risk Elimination: Classical removed ${(100 - (classical.remainingRisk / (classical.initialRisk || 1)) * 100).toFixed(1)}% vs QAOA removed ${(100 - (qaoa.remainingRisk / (qaoa.initialRisk || 1)) * 100).toFixed(1)}%`,
      `Runtime Comparison: Classical ${classical.runtimeMs}ms vs QAOA Simulator ${qaoa.runtimeMs}ms (Ratio: ${runtimeRatio}x)`,
      `Experimental Assessment: This comparison is conducted under NISQ statevector simulation constraints. No quantum supremacy or advantage is claimed over state-of-the-art classical algorithms.`,
    ];

    return {
      problemId: qubo.id,
      numVariables: qubo.numVariables,
      numPaths: qaoa.totalPathsCount,
      evaluationDisclaimer:
        'Experimental NISQ comparison for cybersecurity optimization research. No claim of quantum advantage.',
      classicalBaseline: classical,
      qaoaResult: qaoa,
      metrics: {
        objectiveDifference: objDiff,
        costDifference: costDiff,
        remainingRiskDifference: riskDiff,
        runtimeRatio,
        approximationRatio: approxRatio,
        matchExactSolution: matchExact,
      },
      analystAssessment,
    };
  }
}

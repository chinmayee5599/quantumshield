/**
 * QuantumShield — Classical QUBO State Evaluator
 * Evaluates binary assignment vectors against the QUBO Hamiltonian and cyber graph metrics.
 */

import { AttackPathResult } from '../attackGraph/types';
import { DefensiveControl } from '../controls/types';
import { QuboInstance } from '../qubo/types';
import { ClassicalOptimizationResult, ClassicalSolverType } from './types';

export class ClassicalEvaluator {
  /**
   * Computes the exact QUBO objective energy for a given binary bitstring:
   * H(x) = sum_i Q_ii x_i + sum_{i < j} Q_ij x_i x_j + const
   */
  public static evaluateEnergy(qubo: QuboInstance, x: number[]): number {
    let energy = qubo.constantOffset;
    const N = qubo.numVariables;

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
    return Number(energy.toFixed(4));
  }

  /**
   * Computes the fast delta energy if bit k is flipped:
   * Delta H = H(x with bit k flipped) - H(x)
   */
  public static evaluateFlipDelta(qubo: QuboInstance, x: number[], k: number): number {
    const currentVal = x[k];
    const sign = currentVal === 0 ? 1 : -1;
    let delta = qubo.matrix[k][k];

    for (let j = 0; j < qubo.numVariables; j++) {
      if (j !== k && x[j] === 1) {
        const row = Math.min(j, k);
        const col = Math.max(j, k);
        delta += qubo.matrix[row][col];
      }
    }

    return sign * delta;
  }

  /**
   * Synthesizes a structured ClassicalOptimizationResult from a selected binary assignment.
   */
  public static buildResult(
    qubo: QuboInstance,
    controls: DefensiveControl[],
    paths: AttackPathResult[],
    x: number[],
    solverType: ClassicalSolverType,
    solverName: string,
    runtimeMs: number,
    statesEvaluated: number,
    isGlobalOptimumVerified: boolean
  ): ClassicalOptimizationResult {
    const N = qubo.numVariables;
    const selectedIndices: number[] = [];
    const bitstring = x.join('');

    for (let i = 0; i < N; i++) {
      if (x[i] === 1) selectedIndices.push(i);
    }

    const selectedControls = selectedIndices.map(i => ({
      controlId: controls[i].controlId,
      name: controls[i].name,
      category: controls[i].category,
      cost: controls[i].deploymentCost,
      friction: controls[i].operationalFriction,
    }));

    const totalCost = selectedControls.reduce((sum, c) => sum + c.cost, 0);
    const totalFriction = selectedControls.reduce((sum, c) => sum + c.friction, 0);

    // Collect all severed edge IDs
    const severedEdgeSet = new Set<string>();
    for (const idx of selectedIndices) {
      for (const eId of controls[idx].affectedEdgeIds) {
        severedEdgeSet.add(eId);
      }
    }

    // Determine blocked vs residual paths
    let initialRisk = 0;
    let remainingRisk = 0;
    let blockedCount = 0;

    paths.forEach(p => {
      initialRisk += p.compositeRiskScore;
      const isBlocked = p.edgeSequence.some(eId => severedEdgeSet.has(eId));
      if (isBlocked) {
        blockedCount++;
      } else {
        remainingRisk += p.compositeRiskScore;
      }
    });

    initialRisk = Number(initialRisk.toFixed(1));
    remainingRisk = Number(remainingRisk.toFixed(1));
    const riskReductionPercentage =
      initialRisk > 0 ? Number((((initialRisk - remainingRisk) / initialRisk) * 100.0).toFixed(1)) : 100.0;

    const objectiveValue = this.evaluateEnergy(qubo, x);

    return {
      solverType,
      solverName,
      bitstring,
      selectedIndices,
      selectedControlIds: selectedControls.map(c => c.controlId),
      selectedControls,
      objectiveValue,
      totalCost,
      totalFriction,
      initialRisk,
      remainingRisk,
      riskReductionPercentage,
      blockedHighRiskPathsCount: blockedCount,
      totalPathsCount: paths.length,
      allPathsBlocked: blockedCount === paths.length,
      runtimeMs: Math.max(0, runtimeMs),
      statesEvaluated,
      isGlobalOptimumVerified,
    };
  }
}

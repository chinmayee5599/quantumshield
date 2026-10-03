/**
 * QuantumShield — Classical QUBO Solvers & Optimization Engine
 * Evaluates binary control selection permutations using exact exhaustive enumeration
 * (guaranteed global optimum) and synthesizes clear security analyst explanations.
 */

import { AttackPathResult } from '../attackGraph/types';
import { DefensiveControl } from '../controls/types';
import { ControlSelectionDetail, QuboInstance, QuboSolution } from './types';

export class QuboClassicalSolver {
  /**
   * Solves the QUBO instance using exact classical exhaustive search (2^N states).
   * Guaranteed to locate the exact global mathematical minimum.
   */
  public static solveExhaustive(
    qubo: QuboInstance,
    controls: DefensiveControl[],
    paths: AttackPathResult[]
  ): QuboSolution {
    const startTime = Date.now();
    const N = qubo.numVariables;

    if (N > 22) {
      throw new Error(`Exhaustive solver limited to N <= 22 variables (received N = ${N}).`);
    }

    const totalStates = 1 << N;
    let bestEnergy = Infinity;
    let bestBitstring = '0'.repeat(N);
    let bestIndices: number[] = [];

    // Evaluate all 2^N binary assignments
    for (let state = 0; state < totalStates; state++) {
      const bitstring = state.toString(2).padStart(N, '0');
      const x: number[] = [];
      const activeIndices: number[] = [];

      for (let i = 0; i < N; i++) {
        const val = bitstring[N - 1 - i] === '1' ? 1 : 0;
        x.push(val);
        if (val === 1) activeIndices.push(i);
      }

      // Compute H(x) = sum_i Q_ii x_i + sum_{i < j} Q_ij x_i x_j + offset
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
        bestBitstring = x.join('');
        bestIndices = [...activeIndices];
      }
    }

    const durationMs = Date.now() - startTime;
    return this.constructSolution(
      qubo,
      controls,
      paths,
      bestIndices,
      bestBitstring,
      bestEnergy,
      'exhaustive_classical',
      durationMs
    );
  }

  /**
   * Synthesizes the solution breakdown and analyst explanations.
   */
  private static constructSolution(
    qubo: QuboInstance,
    controls: DefensiveControl[],
    paths: AttackPathResult[],
    selectedIndices: number[],
    bitstring: string,
    objectiveValue: number,
    method: QuboSolution['solverMethod'],
    durationMs: number
  ): QuboSolution {
    const selectedControlIds = selectedIndices.map(i => controls[i].controlId);
    const selectedControlSet = new Set(selectedControlIds);

    // Compute deployment cost
    let deploymentCostTerm = 0;
    for (const idx of selectedIndices) {
      const ctrl = controls[idx];
      deploymentCostTerm += qubo.weights.costWeight * (ctrl.deploymentCost + ctrl.operationalFriction);
    }

    // Determine blocked vs unblocked paths
    const severedEdgeSet = new Set<string>();
    for (const idx of selectedIndices) {
      for (const eId of controls[idx].affectedEdgeIds) {
        severedEdgeSet.add(eId);
      }
    }

    const blockedPathIds: string[] = [];
    const residualPathIds: string[] = [];
    let unblockedPathPenaltyTerm = 0;

    paths.forEach(p => {
      const isBlocked = p.edgeSequence.some(eId => severedEdgeSet.has(eId));
      if (isBlocked) {
        blockedPathIds.push(p.pathId);
      } else {
        residualPathIds.push(p.pathId);
        unblockedPathPenaltyTerm += qubo.weights.pathPenaltyWeight * p.compositeRiskScore;
      }
    });

    // Check budget constraint penalty
    let budgetPenaltyTerm = 0;
    if (qubo.budgetConstraint) {
      const actualSpend = selectedIndices.reduce((sum, i) => sum + controls[i].deploymentCost, 0);
      const diff = actualSpend - qubo.budgetConstraint.maxBudget;
      budgetPenaltyTerm = qubo.budgetConstraint.penaltyWeight * (diff * diff);
    }

    // Explanations for selected controls
    const selectedControls: ControlSelectionDetail[] = selectedIndices.map(i => {
      const ctrl = controls[i];
      const blockedByThisCtrl = paths
        .filter(p => p.edgeSequence.some(eId => ctrl.affectedEdgeIds.includes(eId)))
        .map(p => p.name);

      return {
        controlId: ctrl.controlId,
        name: ctrl.name,
        category: ctrl.category,
        cost: ctrl.deploymentCost,
        selectionReason: `Selected because it severs ${blockedByThisCtrl.length} critical path(s) at relative cost ${ctrl.deploymentCost}, delivering high risk-reduction ROI.`,
        blockedPaths: blockedByThisCtrl,
      };
    });

    // Analyst Explanations
    const analystExplanation: string[] = [
      `Optimal Solution Bitstring: [${bitstring}] (Objective Value: ${objectiveValue.toFixed(2)})`,
      `Selected ${selectedIndices.length} of ${qubo.numVariables} defensive controls (${selectedControlIds.join(', ') || 'None'})`,
      `Neutralized ${blockedPathIds.length} of ${paths.length} discovered attack paths (${residualPathIds.length === 0 ? '100% of Crown Jewel threats blocked' : `${residualPathIds.length} residual path(s) unmitigated`})`,
      `Cost Trade-off: Deployment cost of ${deploymentCostTerm.toFixed(1)} vs eliminated risk penalty of ${(qubo.weights.pathPenaltyWeight * paths.reduce((s, p) => s + p.compositeRiskScore, 0) - unblockedPathPenaltyTerm).toFixed(1)} points`,
    ];

    selectedControls.forEach(sc => {
      analystExplanation.push(
        `Why '${sc.name}' was selected: ${sc.selectionReason} (Covers: ${sc.blockedPaths.slice(0, 2).join('; ')})`
      );
    });

    if (residualPathIds.length > 0) {
      analystExplanation.push(
        `Residual Risk Warning: ${residualPathIds.length} path(s) could not be mitigated under current cost/budget parameters.`
      );
    }

    return {
      bitstring,
      selectedIndices,
      selectedControlIds,
      selectedControls,
      objectiveValue: Number(objectiveValue.toFixed(4)),
      breakdown: {
        deploymentCostTerm: Number(deploymentCostTerm.toFixed(2)),
        unblockedPathPenaltyTerm: Number(unblockedPathPenaltyTerm.toFixed(2)),
        budgetPenaltyTerm: Number(budgetPenaltyTerm.toFixed(2)),
        redundancyPenaltyTerm: 0,
        constantOffset: qubo.constantOffset,
      },
      blockedPathsCount: blockedPathIds.length,
      totalPathsCount: paths.length,
      allPathsBlocked: residualPathIds.length === 0,
      residualPathIds,
      analystExplanation,
      solverMethod: method,
      executionTimeMs: durationMs,
    };
  }
}

/**
 * QuantumShield — Dynamic QUBO Builder
 * Transforms attack paths, risk scores, and defensive security controls into a
 * Quadratic Unconstrained Binary Optimization (QUBO) objective function.
 *
 * Mathematical Objective:
 *   Minimize H(x) = H_cost(x) + H_penalty(x) + H_budget(x)
 *   where x_i in {0, 1} indicates whether defensive control i is selected.
 */

import { AttackPathResult } from '../attackGraph/types';
import { DefensiveControl } from '../controls/types';
import { DEFAULT_QUBO_WEIGHTS, QuboInstance, QuboVariable, QuboWeightConfig } from './types';

export class QuboBuilder {
  /**
   * Dynamically constructs the QUBO matrix and instance from controls and discovered attack paths.
   */
  public static buildQubo(
    controls: DefensiveControl[],
    paths: AttackPathResult[],
    weights: QuboWeightConfig = DEFAULT_QUBO_WEIGHTS,
    budget?: number
  ): QuboInstance {
    const N = controls.length;
    const matrix: number[][] = Array.from({ length: N }, () => Array(N).fill(0));

    // Map each path to the set of control indices that sever it
    const pathMitigatingIndices: number[][] = paths.map(p => {
      const indices: number[] = [];
      const pathEdgeSet = new Set(p.edgeSequence);

      controls.forEach((ctrl, cIdx) => {
        const coversEdge = ctrl.affectedEdgeIds.some(eId => pathEdgeSet.has(eId));
        if (coversEdge) {
          indices.push(cIdx);
        }
      });
      return indices;
    });

    // Build variables list
    const variables: QuboVariable[] = controls.map((ctrl, idx) => {
      const mitigatedPathIds = paths
        .filter((_, pIdx) => pathMitigatingIndices[pIdx].includes(idx))
        .map(p => p.pathId);

      return {
        index: idx,
        controlId: ctrl.controlId,
        controlName: ctrl.name,
        category: ctrl.category,
        cost: ctrl.deploymentCost,
        operationalFriction: ctrl.operationalFriction,
        mitigatedPathIds,
      };
    });

    let constantOffset = 0;
    const alpha = weights.costWeight;
    const beta = weights.pathPenaltyWeight;

    // -------------------------------------------------------------
    // 1. Control Deployment Cost: H_cost(x) = alpha * sum_i (cost_i + friction_i) * x_i
    // -------------------------------------------------------------
    for (let i = 0; i < N; i++) {
      const totalControlCost = controls[i].deploymentCost + controls[i].operationalFriction;
      matrix[i][i] += alpha * totalControlCost;
    }

    // -------------------------------------------------------------
    // 2. Unblocked High-Risk Path Penalties: H_penalty(x)
    //    For path k with risk R_k and mitigating controls S_k:
    //    Penalty = beta * R_k * (1 - sum_{i in S_k} x_i)^2
    //    Expanded: beta * R_k * [ 1 - sum_{i in S_k} x_i + 2 * sum_{i < j in S_k} x_i * x_j ]
    // -------------------------------------------------------------
    paths.forEach((path, pIdx) => {
      const S_k = pathMitigatingIndices[pIdx];
      const R_k = path.compositeRiskScore;

      // Base unblocked path penalty added to constant offset
      constantOffset += beta * R_k;

      // Linear reward (negative cost in minimization) for activating a control that severs path k
      for (const i of S_k) {
        matrix[i][i] -= beta * R_k;
      }

      // Quadratic interaction term: penalizes redundant duplicate controls on the same path
      for (let a = 0; a < S_k.length; a++) {
        for (let b = a + 1; b < S_k.length; b++) {
          const i = Math.min(S_k[a], S_k[b]);
          const j = Math.max(S_k[a], S_k[b]);
          matrix[i][j] += 2 * beta * R_k;
        }
      }
    });

    // -------------------------------------------------------------
    // 3. Optional Budget Constraint: H_budget(x) = gamma * (sum_i c_i * x_i - B)^2
    // -------------------------------------------------------------
    let budgetConstraintMeta: QuboInstance['budgetConstraint'] = undefined;

    if (budget !== undefined && budget > 0) {
      const gamma = weights.budgetPenaltyWeight || 5.0;
      budgetConstraintMeta = { maxBudget: budget, penaltyWeight: gamma };

      // (sum c_i x_i - B)^2 = sum c_i^2 x_i + 2 sum_{i < j} c_i c_j x_i x_j - 2 B sum c_i x_i + B^2
      constantOffset += gamma * (budget * budget);

      for (let i = 0; i < N; i++) {
        const c_i = controls[i].deploymentCost;
        matrix[i][i] += gamma * (c_i * c_i - 2 * budget * c_i);
      }

      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const c_i = controls[i].deploymentCost;
          const c_j = controls[j].deploymentCost;
          matrix[i][j] += 2 * gamma * (c_i * c_j);
        }
      }
    }

    // Extract linear and quadratic non-zero coefficients
    const linearCoefficients: number[] = [];
    const quadraticCoefficients: Array<{ i: number; j: number; weight: number }> = [];

    for (let i = 0; i < N; i++) {
      linearCoefficients.push(Number(matrix[i][i].toFixed(4)));
      for (let j = i + 1; j < N; j++) {
        const w = matrix[i][j];
        if (Math.abs(w) > 1e-6) {
          quadraticCoefficients.push({ i, j, weight: Number(w.toFixed(4)) });
        }
      }
    }

    const mathematicalFormulation = `
## QuantumShield QUBO Mathematical Formulation

Given $N = ${N}$ candidate defensive controls and $M = ${paths.length}$ discovered attack paths:

### Objective Function:
$$\\min_{\\mathbf{x} \\in \\{0,1\\}^N} H(\\mathbf{x}) = \\mathbf{x}^T Q \\mathbf{x} + \\text{const}$$

Where:
1. **Control Deployment Cost Term**:
   $$H_{\\text{cost}}(\\mathbf{x}) = ${alpha.toFixed(2)} \\sum_{i=1}^N (\\text{cost}_i + \\text{friction}_i) \\cdot x_i$$
2. **Unblocked Path Risk Penalties**:
   $$H_{\\text{penalty}}(\\mathbf{x}) = ${beta.toFixed(2)} \\sum_{k=1}^M R(p_k) \\cdot \\left(1 - \\sum_{i \\in S_k} x_i\\right)^2$$
   - Each unblocked path incurs penalty proportional to its risk $R(p_k)$.
   - Pairwise terms $+2 \\beta R(p_k) x_i x_j$ penalize redundant duplicate investments.
${
  budget
    ? `3. **Budget Constraint**:
   $$H_{\\text{budget}}(\\mathbf{x}) = ${(weights.budgetPenaltyWeight || 5.0).toFixed(2)} \\cdot \\left(\\sum_{i=1}^N \\text{cost}_i \\cdot x_i - ${budget}\\right)^2$$`
    : ''
}
Constant Offset: ${Number(constantOffset.toFixed(2))}
`.trim();

    return {
      id: `qubo_${Date.now()}`,
      name: `Defensive Control Selection QUBO (${N} vars, ${paths.length} paths)`,
      numVariables: N,
      variables,
      matrix: matrix.map(row => row.map(v => Number(v.toFixed(4)))),
      linearCoefficients,
      quadraticCoefficients,
      constantOffset: Number(constantOffset.toFixed(4)),
      weights: { ...weights },
      budgetConstraint: budgetConstraintMeta,
      mathematicalFormulation,
    };
  }
}

/**
 * QuantumShield — QUBO & Ising Hamiltonian Engine
 * Mathematically transforms defensive control selection and attack path cuts
 * into Quadratic Unconstrained Binary Optimization (QUBO) and Ising Spin Hamiltonians.
 */

import { AttackPath, DefensiveControl } from '../types/cyber';
import { IsingHamiltonian, QuboProblem } from '../types/quantum';

export class QuboEngine {
  /**
   * Constructs the QUBO matrix for attack path disruption under budget constraints.
   * 
   * Decision variables: x_i in {0, 1} indicates whether control i is selected.
   * Objective:
   *   Minimize H(x) = alpha * Sum (w_i + d_i) x_i + beta * Sum_{path k} R_k * (1 - Sum_{i in S_k} x_i)^2
   */
  public static buildQubo(
    controls: DefensiveControl[],
    paths: AttackPath[],
    costWeight: number = 0.8,
    riskWeight: number = 0.05
  ): QuboProblem {
    const n = controls.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const variableNames = controls.map(c => c.shortCode);
    const variableIds = controls.map(c => c.id);

    // Map each path to which controls can sever it
    const pathMitigatingControlIndices: number[][] = paths.map(path => {
      const severingIndices: number[] = [];
      controls.forEach((ctrl, idx) => {
        // Does this control mitigate any edge in this path?
        const coversEdge = ctrl.mitigatesEdges.some(edgeId => path.edges.includes(edgeId));
        if (coversEdge) {
          severingIndices.push(idx);
        }
      });
      return severingIndices;
    });

    let constantOffset = 0;

    // 1. Path Risk Penalties: beta * R_k * (1 - Sum_{i in S_k} x_i)^2
    // Expanded: beta * R_k * [ 1 - Sum_{i in S_k} x_i + 2 * Sum_{i < j in S_k} x_i x_j ]
    paths.forEach((path, pathIdx) => {
      const S_k = pathMitigatingControlIndices[pathIdx];
      const R_k = path.riskScore;

      // Constant term
      constantOffset += riskWeight * R_k;

      // Linear negative reward for activating a control that covers this path
      for (const i of S_k) {
        matrix[i][i] -= riskWeight * R_k;
      }

      // Quadratic penalty for redundant coverage: + 2 * beta * R_k * x_i * x_j
      for (let a = 0; a < S_k.length; a++) {
        for (let b = a + 1; b < S_k.length; b++) {
          const i = Math.min(S_k[a], S_k[b]);
          const j = Math.max(S_k[a], S_k[b]);
          matrix[i][j] += 2 * riskWeight * R_k;
        }
      }
    });

    // 2. Control Implementation & Operational Disruption Costs: alpha * (w_i + d_i) * x_i
    controls.forEach((ctrl, i) => {
      const costPenalty = costWeight * (ctrl.implementationCost + ctrl.operationalFriction);
      matrix[i][i] += costPenalty;
    });

    // Extract linear terms and quadratic pairs
    const linearTerms: number[] = [];
    const quadraticTerms: { i: number; j: number; weight: number }[] = [];

    for (let i = 0; i < n; i++) {
      linearTerms.push(Number(matrix[i][i].toFixed(4)));
      for (let j = i + 1; j < n; j++) {
        const w = matrix[i][j];
        if (Math.abs(w) > 1e-6) {
          quadraticTerms.push({ i, j, weight: Number(w.toFixed(4)) });
        }
      }
    }

    return {
      numVariables: n,
      variableNames,
      variableIds,
      matrix: matrix.map(row => row.map(v => Number(v.toFixed(4)))),
      linearTerms,
      quadraticTerms,
      constantOffset: Number(constantOffset.toFixed(4)),
      costWeight,
      riskPenaltyWeight: riskWeight,
    };
  }

  /**
   * Evaluates the QUBO energy E(x) = x^T Q x + constantOffset for a given bitstring x in {0,1}^n.
   */
  public static evaluateQuboEnergy(qubo: QuboProblem, bitstring: string): number {
    const bits = bitstring.split('').map(b => (b === '1' ? 1 : 0));
    let energy = qubo.constantOffset;

    for (let i = 0; i < qubo.numVariables; i++) {
      if (bits[i] === 1) {
        energy += qubo.matrix[i][i];
        for (let j = i + 1; j < qubo.numVariables; j++) {
          if (bits[j] === 1) {
            energy += qubo.matrix[i][j];
          }
        }
      }
    }

    return Number(energy.toFixed(4));
  }

  /**
   * Transforms a QUBO into an equivalent Ising Spin Glass Hamiltonian:
   * H_C = sum h_i Z_i + sum J_ij Z_i Z_j + offset
   * Using mapping: x_i = (1 - Z_i) / 2
   */
  public static toIsing(qubo: QuboProblem): IsingHamiltonian {
    const n = qubo.numVariables;
    const h = new Array(n).fill(0);
    const J: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    let offset = qubo.constantOffset;

    // x_i = (1 - Z_i) / 2
    // x_i x_j = (1 - Z_i - Z_j + Z_i Z_j) / 4
    for (let i = 0; i < n; i++) {
      const q_ii = qubo.matrix[i][i];
      offset += q_ii / 2;
      h[i] -= q_ii / 2;

      for (let j = i + 1; j < n; j++) {
        const q_ij = qubo.matrix[i][j];
        if (Math.abs(q_ij) > 1e-6) {
          offset += q_ij / 4;
          h[i] -= q_ij / 4;
          h[j] -= q_ij / 4;
          J[i][j] = q_ij / 4;
          J[j][i] = q_ij / 4;
        }
      }
    }

    return {
      numSpins: n,
      h: h.map(v => Number(v.toFixed(4))),
      J: J.map(row => row.map(v => Number(v.toFixed(4)))),
      offset: Number(offset.toFixed(4)),
    };
  }
}

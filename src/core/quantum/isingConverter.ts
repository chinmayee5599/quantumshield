/**
 * QuantumShield — QUBO to Ising Spin Hamiltonian Converter
 * Mathematically transforms binary decision variables x_i in {0, 1} into Pauli Z spin operators
 * Z_i in {-1, +1} via the exact substitution x_i = (I - Z_i) / 2.
 */

import { QuboInstance } from '../qubo/types';
import { IsingHamiltonian } from './types';

export class IsingConverter {
  /**
   * Transforms a QUBO instance into an Ising Spin Hamiltonian.
   *
   * Derivation:
   *   x_i = (1 - Z_i) / 2
   *   x_i x_j = (1 - Z_i - Z_j + Z_i Z_j) / 4
   *
   * Substituting into H_QUBO = sum_i Q_ii x_i + sum_{i < j} Q_ij x_i x_j + C_0 yields:
   *   H_Ising = sum_i h_i Z_i + sum_{i < j} J_ij Z_i Z_j + C_Ising
   */
  public static fromQubo(qubo: QuboInstance): IsingHamiltonian {
    const N = qubo.numVariables;
    const h: number[] = new Array(N).fill(0);
    const J_pairs: Array<{ i: number; j: number; weight: number }> = [];
    let constantOffset = qubo.constantOffset;

    // Linear terms: Q_ii x_i = Q_ii / 2 - (Q_ii / 2) * Z_i
    for (let i = 0; i < N; i++) {
      const q_ii = qubo.matrix[i][i];
      constantOffset += q_ii / 2.0;
      h[i] -= q_ii / 2.0;
    }

    // Quadratic interaction terms: Q_ij x_i x_j = Q_ij/4 - (Q_ij/4)*Z_i - (Q_ij/4)*Z_j + (Q_ij/4)*Z_i*Z_j
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const q_ij = qubo.matrix[i][j];
        if (Math.abs(q_ij) > 1e-6) {
          constantOffset += q_ij / 4.0;
          h[i] -= q_ij / 4.0;
          h[j] -= q_ij / 4.0;

          const J_val = Number((q_ij / 4.0).toFixed(4));
          J_pairs.push({ i, j, weight: J_val });
        }
      }
    }

    const roundedH = h.map(v => Number(v.toFixed(4)));
    const roundedOffset = Number(constantOffset.toFixed(4));

    // Pauli String representations for Qiskit SparsePauliOp
    const pauliStrings: string[] = [];
    roundedH.forEach((val, idx) => {
      if (Math.abs(val) > 1e-4) {
        pauliStrings.push(`${val > 0 ? '+' : ''}${val} * Z${idx}`);
      }
    });

    J_pairs.forEach(pair => {
      pauliStrings.push(`${pair.weight > 0 ? '+' : ''}${pair.weight} * Z${pair.i} Z${pair.j}`);
    });

    return {
      numQubits: N,
      qubitLabels: qubo.variables.map(v => v.controlName),
      singleZCoefficients: roundedH,
      pairZzCoefficients: J_pairs,
      constantOffset: roundedOffset,
      pauliStringRepresentation: pauliStrings,
    };
  }

  /**
   * Computes the energy of an Ising state given spin values s_i in {-1, +1}
   * where s_i = +1 corresponds to |0> (x_i = 0) and s_i = -1 corresponds to |1> (x_i = 1).
   */
  public static evaluateIsingEnergy(ising: IsingHamiltonian, spins: number[]): number {
    let energy = ising.constantOffset;

    for (let i = 0; i < ising.numQubits; i++) {
      energy += ising.singleZCoefficients[i] * spins[i];
    }

    for (const pair of ising.pairZzCoefficients) {
      energy += pair.weight * spins[pair.i] * spins[pair.j];
    }

    return Number(energy.toFixed(4));
  }

  /**
   * Helper to convert a binary vector x in {0, 1} to spin vector s in {+1, -1}:
   * s_i = 1 - 2 * x_i
   */
  public static binaryToSpins(x: number[]): number[] {
    return x.map(val => (val === 1 ? -1 : 1));
  }
}

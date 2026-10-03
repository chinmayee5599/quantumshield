/**
 * QuantumShield — Exact QAOA Quantum Statevector & Shot Simulator
 * Evolves the 2^N dimensional quantum statevector through alternating Problem and Mixer unitaries,
 * executes classical parameter optimization (COBYLA/gradient-free), and simulates Born-rule
 * projective measurements.
 */

import { IsingHamiltonian, QaoaCircuitConfig, QaoaConvergenceStep } from './types';

export class QaoaQuantumSimulator {
  /**
   * Evaluates the quantum statevector |psi(gamma, beta)> for given parameters.
   */
  public static computeStatevector(
    N: number,
    quboDiagonalEnergies: number[], // Precomputed E(x) for all 2^N basis states
    p: number,
    gamma: number[],
    beta: number[]
  ): { real: Float64Array; imag: Float64Array } {
    const dim = 1 << N;
    const real = new Float64Array(dim);
    const imag = new Float64Array(dim);

    // Initial state: |+>^{\otimes N} = 1/sqrt(2^N) sum_x |x>
    const norm = 1.0 / Math.sqrt(dim);
    for (let x = 0; x < dim; x++) {
      real[x] = norm;
      imag[x] = 0.0;
    }

    // Alternating p layers
    for (let layer = 0; layer < p; layer++) {
      const g = gamma[layer];
      const b = beta[layer];

      // 1. Problem Hamiltonian Unitary: exp(-i * gamma * H_C)
      // Since H_C is diagonal, each basis state |x> picks up phase exp(-i * gamma * E(x))
      for (let x = 0; x < dim; x++) {
        const theta = -g * quboDiagonalEnergies[x];
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const r = real[x];
        const im = imag[x];

        // Complex multiplication: (r + i*im) * (cosT + i*sinT)
        real[x] = r * cosT - im * sinT;
        imag[x] = r * sinT + im * cosT;
      }

      // 2. Mixer Hamiltonian Unitary: exp(-i * beta * H_M) = prod_k exp(-i * beta * X_k)
      // Single-qubit Rx(2 * beta) rotation on each qubit k:
      // [cos(b), -i*sin(b)]
      // [-i*sin(b), cos(b)]
      const cosB = Math.cos(b);
      const sinB = Math.sin(b);

      for (let k = 0; k < N; k++) {
        const step = 1 << k;
        const jump = step << 1;

        for (let base = 0; base < dim; base += jump) {
          for (let offset = 0; offset < step; offset++) {
            const i0 = base + offset;
            const i1 = i0 + step;

            const r0 = real[i0];
            const im0 = imag[i0];
            const r1 = real[i1];
            const im1 = imag[i1];

            // |0> -> cos(b)|0> - i*sin(b)|1>
            // |1> -> -i*sin(b)|0> + cos(b)|1>
            real[i0] = cosB * r0 + sinB * im1;
            imag[i0] = cosB * im0 - sinB * r1;

            real[i1] = cosB * r1 + sinB * im0;
            imag[i1] = cosB * im1 - sinB * r0;
          }
        }
      }
    }

    return { real, imag };
  }

  /**
   * Computes the energy expectation value <psi| H_C |psi> = sum_x |psi(x)|^2 * E(x)
   */
  public static computeExpectation(
    N: number,
    quboDiagonalEnergies: number[],
    p: number,
    gamma: number[],
    beta: number[]
  ): number {
    const { real, imag } = this.computeStatevector(N, quboDiagonalEnergies, p, gamma, beta);
    const dim = 1 << N;
    let expectedEnergy = 0.0;

    for (let x = 0; x < dim; x++) {
      const prob = real[x] * real[x] + imag[x] * imag[x];
      expectedEnergy += prob * quboDiagonalEnergies[x];
    }

    return expectedEnergy;
  }

  /**
   * Optimizes the QAOA angles (gamma, beta) using coordinate grid-search and gradient descent.
   */
  public static optimizeParameters(
    N: number,
    quboDiagonalEnergies: number[],
    p: number,
    maxIterations: number = 25
  ): {
    bestGamma: number[];
    bestBeta: number[];
    bestExpectation: number;
    history: QaoaConvergenceStep[];
  } {
    // Initial parameter heuristics: gamma in [0, 2pi], beta in [0, pi]
    let currentGamma: number[] = Array.from({ length: p }, (_, i) => 0.4 + 0.3 * (i / Math.max(1, p - 1)));
    let currentBeta: number[] = Array.from({ length: p }, (_, i) => 0.6 - 0.2 * (i / Math.max(1, p - 1)));

    let currentExp = this.computeExpectation(N, quboDiagonalEnergies, p, currentGamma, currentBeta);
    const history: QaoaConvergenceStep[] = [
      {
        iteration: 0,
        gamma: [...currentGamma],
        beta: [...currentBeta],
        expectationValue: Number(currentExp.toFixed(4)),
      },
    ];

    // Coordinate descent / pattern search over (gamma, beta)
    const stepSize = 0.15;
    const deltas = [-stepSize, stepSize];

    for (let iter = 1; iter <= maxIterations; iter++) {
      let improved = false;

      // Sweep gamma angles
      for (let i = 0; i < p; i++) {
        for (const d of deltas) {
          const testGamma = [...currentGamma];
          testGamma[i] = (testGamma[i] + d + 2 * Math.PI) % (2 * Math.PI);

          const testExp = this.computeExpectation(N, quboDiagonalEnergies, p, testGamma, currentBeta);
          if (testExp < currentExp) {
            currentExp = testExp;
            currentGamma = testGamma;
            improved = true;
          }
        }
      }

      // Sweep beta angles
      for (let i = 0; i < p; i++) {
        for (const d of deltas) {
          const testBeta = [...currentBeta];
          testBeta[i] = (testBeta[i] + d + Math.PI) % Math.PI;

          const testExp = this.computeExpectation(N, quboDiagonalEnergies, p, currentGamma, testBeta);
          if (testExp < currentExp) {
            currentExp = testExp;
            currentBeta = testBeta;
            improved = true;
          }
        }
      }

      history.push({
        iteration: iter,
        gamma: [...currentGamma].map(v => Number(v.toFixed(4))),
        beta: [...currentBeta].map(v => Number(v.toFixed(4))),
        expectationValue: Number(currentExp.toFixed(4)),
      });

      if (!improved && iter >= 5) {
        break; // Converged
      }
    }

    return {
      bestGamma: currentGamma.map(v => Number(v.toFixed(4))),
      bestBeta: currentBeta.map(v => Number(v.toFixed(4))),
      bestExpectation: Number(currentExp.toFixed(4)),
      history,
    };
  }

  /**
   * Simulates Born-rule projective measurements by drawing shots according to |psi(x)|^2.
   */
  public static sampleMeasurements(
    N: number,
    real: Float64Array,
    imag: Float64Array,
    shots: number,
    seed: number = 42
  ): Map<string, { count: number; probability: number }> {
    const dim = 1 << N;
    const probabilities = new Float64Array(dim);
    const cumulative = new Float64Array(dim);

    let cum = 0.0;
    for (let x = 0; x < dim; x++) {
      const p = real[x] * real[x] + imag[x] * imag[x];
      probabilities[x] = p;
      cum += p;
      cumulative[x] = cum;
    }

    // Normalization safeguard
    for (let x = 0; x < dim; x++) {
      cumulative[x] /= cum;
    }

    // LCG PRNG for reproducible sampling
    let currentSeed = seed;
    const lcg = () => {
      currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
      return currentSeed / 4294967296;
    };

    const counts = new Map<number, number>();

    for (let shot = 0; shot < shots; shot++) {
      const r = lcg();

      // Binary search on cumulative probabilities
      let low = 0;
      let high = dim - 1;
      let sampledIndex = dim - 1;

      while (low <= high) {
        const mid = (low + high) >> 1;
        if (cumulative[mid] >= r) {
          sampledIndex = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      counts.set(sampledIndex, (counts.get(sampledIndex) || 0) + 1);
    }

    const resultMap = new Map<string, { count: number; probability: number }>();

    counts.forEach((count, idx) => {
      // Decode integer to binary bitstring
      let bitstring = '';
      for (let i = 0; i < N; i++) {
        bitstring += (idx >> i) & 1 ? '1' : '0';
      }
      resultMap.set(bitstring, {
        count,
        probability: Number(probabilities[idx].toFixed(6)),
      });
    });

    return resultMap;
  }
}

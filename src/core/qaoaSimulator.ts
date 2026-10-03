/**
 * QuantumShield — QAOA Statevector Quantum Simulator
 * Implements unitary statevector evolution for Quantum Approximate Optimization Algorithm:
 * |psi(gamma, beta)> = Prod_{l=1}^p [ e^{-i beta_l H_M} e^{-i gamma_l H_C} ] |+>^{tensor n}
 */

import { QaoaConfig, QaoaStateVectorStep, QuantumMeasurementDistribution, QuboProblem } from '../types/quantum';
import { QuboEngine } from './quboEngine';

export class QaoaSimulator {
  private qubo: QuboProblem;
  private numQubits: number;
  private dim: number;
  private energies: Float64Array;

  constructor(qubo: QuboProblem) {
    this.qubo = qubo;
    this.numQubits = qubo.numVariables;
    this.dim = 1 << this.numQubits; // 2^n
    this.energies = new Float64Array(this.dim);

    // Precompute QUBO energy E(x) for all 2^n computational basis states
    for (let x = 0; x < this.dim; x++) {
      const bitstring = x.toString(2).padStart(this.numQubits, '0');
      this.energies[x] = QuboEngine.evaluateQuboEnergy(this.qubo, bitstring);
    }
  }

  /**
   * Evolves the statevector under QAOA unitary operators and returns probabilities.
   */
  public simulate(gamma: number[], beta: number[]): {
    real: Float64Array;
    imag: Float64Array;
    probabilities: Float64Array;
    expectationEnergy: number;
  } {
    const p = gamma.length;
    const real = new Float64Array(this.dim);
    const imag = new Float64Array(this.dim);

    // 1. Initial State: Equal superposition |+>^{tensor n} = (1 / sqrt(2^n)) * sum |x>
    const initialAmp = 1.0 / Math.sqrt(this.dim);
    for (let i = 0; i < this.dim; i++) {
      real[i] = initialAmp;
      imag[i] = 0.0;
    }

    // 2. Apply p alternating layers of Problem Unitary U(H_C, gamma) and Mixer U(H_M, beta)
    for (let layer = 0; layer < p; layer++) {
      const g = gamma[layer];
      const b = beta[layer];

      // a. Problem Hamiltonian phase shift: e^{-i * gamma * E(x)}
      // (r + i*m) * (cos(-theta) + i*sin(-theta)) = (r + i*m) * (cos(theta) - i*sin(theta))
      for (let x = 0; x < this.dim; x++) {
        const theta = g * this.energies[x];
        const cosT = Math.cos(theta);
        const sinT = Math.sin(-theta); // e^{-i theta}

        const r = real[x];
        const m = imag[x];

        real[x] = r * cosT - m * sinT;
        imag[x] = r * sinT + m * cosT;
      }

      // b. Mixer Hamiltonian: U(H_M, beta) = Prod_{k=0}^{n-1} e^{-i * beta * X_k}
      // Single-qubit rotation on qubit k:
      // [ cos(b)   -i*sin(b) ]
      // [ -i*sin(b)  cos(b)  ]
      const cosB = Math.cos(b);
      const sinB = Math.sin(b);

      for (let k = 0; k < this.numQubits; k++) {
        const bitMask = 1 << (this.numQubits - 1 - k);

        for (let x = 0; x < this.dim; x++) {
          // Process pairs where bit k is 0 and 1
          if ((x & bitMask) === 0) {
            const y = x | bitMask; // Bit k is 1

            const rx = real[x];
            const mx = imag[x];
            const ry = real[y];
            const my = imag[y];

            // psi'_0 = cos(b) * psi_0 - i * sin(b) * psi_1
            // psi'_1 = -i * sin(b) * psi_0 + cos(b) * psi_1
            real[x] = cosB * rx + sinB * my;
            imag[x] = cosB * mx - sinB * ry;

            real[y] = sinB * mx + cosB * ry;
            imag[y] = -sinB * rx + cosB * my;
          }
        }
      }
    }

    // 3. Calculate probabilities and energy expectation value <H_C>
    const probabilities = new Float64Array(this.dim);
    let expectation = 0.0;

    for (let x = 0; x < this.dim; x++) {
      const prob = real[x] * real[x] + imag[x] * imag[x];
      probabilities[x] = prob;
      expectation += prob * this.energies[x];
    }

    return {
      real,
      imag,
      probabilities,
      expectationEnergy: Number(expectation.toFixed(4)),
    };
  }

  /**
   * Optimizes the QAOA variational parameters (gamma, beta) to minimize <H_C>.
   */
  public optimize(config: QaoaConfig): {
    optimalGamma: number[];
    optimalBeta: number[];
    optimalExpectation: number;
    convergenceHistory: QaoaStateVectorStep[];
  } {
    const p = config.p;
    let bestGamma = config.initialGamma || Array.from({ length: p }, (_, i) => 0.5 + i * 0.2);
    let bestBeta = config.initialBeta || Array.from({ length: p }, (_, i) => 0.4 + i * 0.15);

    let bestExpectation = this.simulate(bestGamma, bestBeta).expectationEnergy;
    const history: QaoaStateVectorStep[] = [
      {
        iteration: 0,
        gamma: [...bestGamma],
        beta: [...bestBeta],
        costExpectation: bestExpectation,
      },
    ];

    // Coordinate descent / Powell-style local optimization
    const maxIter = config.maxIterations || 40;
    const stepSizes = [0.15, 0.08, 0.04, 0.02, 0.01];

    for (let iter = 1; iter <= maxIter; iter++) {
      const step = stepSizes[Math.min(iter, stepSizes.length - 1)];
      let improved = false;

      // Optimize gamma parameters
      for (let layer = 0; layer < p; layer++) {
        for (const delta of [-step, step]) {
          const testGamma = [...bestGamma];
          testGamma[layer] += delta;
          const res = this.simulate(testGamma, bestBeta);
          if (res.expectationEnergy < bestExpectation) {
            bestExpectation = res.expectationEnergy;
            bestGamma = testGamma;
            improved = true;
          }
        }
      }

      // Optimize beta parameters
      for (let layer = 0; layer < p; layer++) {
        for (const delta of [-step, step]) {
          const testBeta = [...bestBeta];
          testBeta[layer] += delta;
          const res = this.simulate(bestGamma, testBeta);
          if (res.expectationEnergy < bestExpectation) {
            bestExpectation = res.expectationEnergy;
            bestBeta = testBeta;
            improved = true;
          }
        }
      }

      if (iter % 3 === 0 || iter === maxIter || !improved) {
        history.push({
          iteration: iter,
          gamma: bestGamma.map(v => Number(v.toFixed(3))),
          beta: bestBeta.map(v => Number(v.toFixed(3))),
          costExpectation: Number(bestExpectation.toFixed(4)),
        });
      }
    }

    return {
      optimalGamma: bestGamma.map(v => Number(v.toFixed(4))),
      optimalBeta: bestBeta.map(v => Number(v.toFixed(4))),
      optimalExpectation: Number(bestExpectation.toFixed(4)),
      convergenceHistory: history,
    };
  }

  /**
   * Simulates quantum measurement sampling with shot noise.
   */
  public sampleMeasurements(
    probabilities: Float64Array,
    shots: number = 1024
  ): Map<string, number> {
    const counts = new Map<string, number>();

    // Cumulative distribution function (CDF) for inverse transform sampling
    const cdf = new Float64Array(this.dim);
    let accum = 0.0;
    for (let i = 0; i < this.dim; i++) {
      accum += probabilities[i];
      cdf[i] = accum;
    }

    for (let s = 0; s < shots; s++) {
      const r = Math.random();
      // Binary search over CDF
      let low = 0;
      let high = this.dim - 1;
      let sampledIndex = high;

      while (low <= high) {
        const mid = (low + high) >> 1;
        if (cdf[mid] >= r) {
          sampledIndex = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      const bitstring = sampledIndex.toString(2).padStart(this.numQubits, '0');
      counts.set(bitstring, (counts.get(bitstring) || 0) + 1);
    }

    return counts;
  }

  /**
   * Generates a 2D energy landscape grid for p=1 across (gamma, beta)
   * for visualization of the quantum optimization surface.
   */
  public generateEnergyLandscape(
    gammaRange: [number, number] = [0, 3.14],
    betaRange: [number, number] = [0, 1.57],
    resolution: number = 16
  ): {
    gammaValues: number[];
    betaValues: number[];
    energyGrid: number[][];
  } {
    const gammaValues: number[] = [];
    const betaValues: number[] = [];
    const energyGrid: number[][] = [];

    const dGamma = (gammaRange[1] - gammaRange[0]) / (resolution - 1);
    const dBeta = (betaRange[1] - betaRange[0]) / (resolution - 1);

    for (let i = 0; i < resolution; i++) {
      gammaValues.push(Number((gammaRange[0] + i * dGamma).toFixed(3)));
    }
    for (let j = 0; j < resolution; j++) {
      betaValues.push(Number((betaRange[0] + j * dBeta).toFixed(3)));
    }

    for (let i = 0; i < resolution; i++) {
      const row: number[] = [];
      const g = gammaValues[i];
      for (let j = 0; j < resolution; j++) {
        const b = betaValues[j];
        const res = this.simulate([g], [b]);
        row.push(res.expectationEnergy);
      }
      energyGrid.push(row);
    }

    return {
      gammaValues,
      betaValues,
      energyGrid,
    };
  }
}

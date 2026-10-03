/**
 * QuantumShield — Qiskit Python Code Exporter
 * Generates production-ready IBM Qiskit 1.x code for the exact same Ising Hamiltonian,
 * allowing security analysts to export and run the circuit directly on IBM Quantum backends
 * or Aer simulators.
 */

import { IsingHamiltonian } from './types';
import { QuboInstance } from '../qubo/types';

export class QiskitExporter {
  /**
   * Generates runnable Python code using modern Qiskit 1.x & Qiskit Algorithms.
   */
  public static toQiskitCode(
    qubo: QuboInstance,
    ising: IsingHamiltonian,
    depthP: number = 2,
    shots: number = 1024
  ): string {
    const N = ising.numQubits;

    const pauliTerms: string[] = [];

    // Single Z terms
    ising.singleZCoefficients.forEach((coeff, i) => {
      if (Math.abs(coeff) > 1e-4) {
        // Construct N-character string with 'Z' at index i and 'I' elsewhere (Qiskit little-endian)
        const pauli = Array.from({ length: N }, (_, idx) => (idx === i ? 'Z' : 'I')).reverse().join('');
        pauliTerms.push(`    ("${pauli}", ${coeff})`);
      }
    });

    // Pair ZZ terms
    ising.pairZzCoefficients.forEach(pair => {
      const pauli = Array.from({ length: N }, (_, idx) =>
        idx === pair.i || idx === pair.j ? 'Z' : 'I'
      ).reverse().join('');
      pauliTerms.push(`    ("${pauli}", ${pair.weight})`);
    });

    const pythonScript = `"""
QuantumShield — IBM Qiskit 1.x QAOA Circuit Script
Generated dynamically from the enterprise attack graph defensive control QUBO formulation.
Problem: ${qubo.name}
Number of Qubits: ${N} | QAOA Depth p: ${depthP} | Shots: ${shots}
"""

from qiskit import QuantumCircuit
from qiskit.quantum_info import SparsePauliOp
from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA
from qiskit.primitives import StatevectorSampler

# 1. Define the Problem Ising Hamiltonian H_C
# Derived from QUBO via x_i = (I - Z_i) / 2
qubit_labels = ${JSON.stringify(qubo.variables.map(v => v.controlName))}

pauli_list = [
${pauliTerms.join(',\n')}
]

cost_operator = SparsePauliOp.from_list(pauli_list)
constant_offset = ${ising.constantOffset}

print(f"Constructed Cost Hamiltonian with {len(cost_operator)} Pauli operators for {${N}} qubits.")
print(f"Constant Energy Offset: {constant_offset}")

# 2. Configure QAOA Circuit & Optimizer
optimizer = COBYLA(maxiter=50)
sampler = StatevectorSampler(default_shots=${shots})

qaoa = QAOA(
    sampler=sampler,
    optimizer=optimizer,
    reps=${depthP}
)

# 3. Execute QAOA Parameter Optimization
print("Executing QAOA circuit optimization...")
result = qaoa.compute_minimum_eigenvalue(cost_operator)

# 4. Extract Measurement Results & Optimal Defensive Controls
optimal_bitstring = result.best_measurement.get('bitstring', '')
optimal_energy = result.best_measurement.get('value', 0.0) + constant_offset

print(f"\\nOptimal Bitstring: [{optimal_bitstring}]")
print(f"Ground State Energy: {optimal_energy:.4f}")
print("\\nSelected Defensive Controls:")
for idx, char in enumerate(optimal_bitstring[::-1]):
    if char == '1' and idx < len(qubit_labels):
        print(f"  [+] Deploy Control {idx}: {qubit_labels[idx]}")
`.trim();

    return pythonScript;
  }
}

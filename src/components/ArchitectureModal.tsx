import React from 'react';
import { X, BookOpen, Atom, ShieldAlert, Cpu, GitFork } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">QuantumShield Architecture & Mathematical Foundations</h2>
              <p className="text-xs text-slate-400">Formal QUBO, Ising Spin Mapping, QAOA Circuit Ansatz & Defense Graph Cuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors font-mono"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 font-sans leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>1. Problem Statement: Defensive Graph Disruption</span>
            </h3>
            <p>
              Given an enterprise attack graph <span className="font-mono text-cyan-200">G = (V, E)</span> where an adversary has achieved entrypoint compromise at <span className="font-mono text-red-300">v_entry</span> and is traversing lateral edges toward a critical Crown Jewel asset <span className="font-mono text-amber-300">v_crown</span>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Let <span className="font-mono text-slate-200">P = {'{p_1, ..., p_K}'}</span> be the set of simple paths reaching the Crown Jewel.</li>
              <li>Each path <span className="font-mono text-slate-200">p_k</span> has an aggregate risk score <span className="font-mono text-slate-200">R_k = V_target × ∏ P_exploit(e) × (CVSS / 10)</span>.</li>
              <li>A catalog of <span className="font-mono text-slate-200">n</span> candidate defensive controls <span className="font-mono text-slate-200">{'{C_1, ..., C_n}'}</span> can be activated, each with cost <span className="font-mono text-slate-200">w_i</span> and operational disruption friction <span className="font-mono text-slate-200">d_i</span>.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Atom className="w-4 h-4 text-cyan-400" />
              <span>2. Mathematical QUBO Formulation</span>
            </h3>
            <p>
              We formulate binary decision variables <span className="font-mono text-slate-200">x_i ∈ {'{0, 1}'}</span> indicating whether control <span className="font-mono text-slate-200">C_i</span> is deployed. The objective function balances cost minimization with complete path severance:
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300 text-xs text-center">
              H(x) = α ∑ (w_i + d_i) x_i + β ∑_k R_k ( 1 - ∑_(i ∈ S_k) x_i )²
            </div>
            <p>
              Expanding the quadratic penalty using the binary idempotent identity <span className="font-mono text-slate-200">x_i² = x_i</span>:
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-slate-300 text-xs">
              ( 1 - ∑_(i ∈ S_k) x_i )² = 1 - ∑_(i ∈ S_k) x_i + 2 ∑_(i &lt; j, i,j ∈ S_k) x_i x_j
            </div>
            <p>
              This maps directly to the canonical QUBO form <span className="font-mono text-cyan-300">H(x) = C_0 + ∑ Q_ii x_i + ∑_(i&lt;j) Q_ij x_i x_j</span>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono text-[11px]">
              <li><strong className="text-slate-200">Q_ii = α (w_i + d_i) - β ∑_(k: i ∈ S_k) R_k</strong> (Diagonal: negative incentives for high-risk coverage)</li>
              <li><strong className="text-slate-200">Q_ij = 2 β ∑_(k: i,j ∈ S_k) R_k</strong> (Off-diagonal: positive penalty discouraging redundant overlapping controls)</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>3. Ising Spin Glass Hamiltonian & QAOA Ansatz</span>
            </h3>
            <p>
              Mapping binary variables to Pauli-Z spin operators via <span className="font-mono text-slate-200">x_i = (I - Z_i) / 2</span> yields the physical problem Hamiltonian:
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300 text-xs text-center">
              H_C = ∑ h_i Z_i + ∑_(i&lt;j) J_ij Z_i Z_j + Offset
            </div>
            <p>
              Where <span className="font-mono text-slate-200">J_ij = Q_ij / 4</span> and <span className="font-mono text-slate-200">h_i = -Q_ii / 2 - ∑_(j≠i) Q_ij / 4</span>.
            </p>
            <p>
              QAOA applies alternating layers of problem unitary and transverse-field mixer unitaries:
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-slate-300 text-xs text-center">
              |ψ(γ, β)⟩ = ∏_(l=1)^p [ e^(-i β_l ∑ X_k) e^(-i γ_l H_C) ] |+⟩^(⊗n)
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <span>4. Rigorous Scientific Positioning & Verification</span>
            </h3>
            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-amber-200 space-y-1.5 text-xs">
              <div className="font-bold">Scientific Integrity Commitment:</div>
              <p>
                QuantumShield strictly adheres to honest empirical benchmarking. For enterprise graphs under N ≤ 32 variables, classical algorithms (exact branch-and-bound, CPLEX, simulated annealing) execute in milliseconds and outperform physical NISQ quantum hardware.
              </p>
              <p>
                Our QAOA implementation provides a mathematically sound statevector simulator and variational feedback optimizer, establishing the foundations for future fault-tolerant quantum advantage when enterprise graph sizes exceed 100+ interconnected identity and network nodes.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Cpu,
  Sliders,
  Play,
  Copy,
  Check,
  Code,
  Info,
  Layers,
  Sparkles,
  BarChart3,
  Flame,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { ScenarioDefinition } from '../data/dataTypes';
import { GraphAnalysisResult } from '../core/attackGraph/types';
import { QaoaEngine, QiskitExporter, IsingConverter } from '../core/quantum';
import { QaoaOptimizationResult } from '../core/quantum/types';
import { QuboInstance } from '../core/qubo/types';

interface QuantumLabViewProps {
  scenario: ScenarioDefinition;
  graphAnalysis: GraphAnalysisResult;
  qubo: QuboInstance;
  qaoaSolution?: QaoaOptimizationResult;
  onRunQaoa: (depthP: number, shots: number, seed: number) => void;
  isOptimizing: boolean;
}

export const QuantumLabView: React.FC<QuantumLabViewProps> = ({
  scenario,
  graphAnalysis,
  qubo,
  qaoaSolution,
  onRunQaoa,
  isOptimizing,
}) => {
  const [depthP, setDepthP] = useState<number>(qaoaSolution?.depthP || 2);
  const [shots, setShots] = useState<number>(qaoaSolution?.shots || 1024);
  const [seed, setSeed] = useState<number>(42);
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number; val: number } | null>(null);
  const [isQiskitModalOpen, setIsQiskitModalOpen] = useState<boolean>(false);
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);

  // Generate real Qiskit Python 1.x script
  const ising = React.useMemo(() => IsingConverter.fromQubo(qubo), [qubo]);
  const qiskitCode = React.useMemo(() => {
    return QiskitExporter.toQiskitCode(qubo, ising, depthP, shots);
  }, [qubo, ising, depthP, shots]);

  const handleCopyQiskit = () => {
    navigator.clipboard.writeText(qiskitCode);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  const N = qubo.numVariables;

  return (
    <div className="space-y-6">
      {/* Execution Mode Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/30 bg-slate-900/80 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/60 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/40">
                SIMULATION MODE
              </span>
              <span className="text-xs font-mono text-slate-400">
                Exact Statevector Evolution in ℂ^{1 << N}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Quantum Approximate Optimization Algorithm (QAOA) Workstation
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsQiskitModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 text-xs font-mono font-medium text-purple-300 transition hover:bg-purple-900/60"
          >
            <Code className="h-3.5 w-3.5" />
            <span>Export Qiskit 1.x Script</span>
          </button>

          <button
            onClick={() => onRunQaoa(depthP, shots, seed)}
            disabled={isOptimizing}
            className="flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition hover:bg-cyan-500 active:scale-95 disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Simulating Circuit...' : 'Run Quantum Circuit'}</span>
          </button>
        </div>
      </div>

      {/* Circuit Configuration Parameter Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div>
          <label className="text-xs font-semibold text-slate-400">QAOA Circuit Depth (p):</label>
          <div className="mt-1.5 flex items-center gap-2">
            {[1, 2, 3, 4].map(pVal => (
              <button
                key={pVal}
                onClick={() => setDepthP(pVal)}
                className={`flex-1 rounded py-1 text-xs font-mono font-bold transition ${
                  depthP === pVal
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                p={pVal}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400">Measurement Shots:</label>
          <div className="mt-1.5 flex items-center gap-2">
            {[512, 1024, 2048, 4096].map(shotVal => (
              <button
                key={shotVal}
                onClick={() => setShots(shotVal)}
                className={`flex-1 rounded py-1 text-xs font-mono font-medium transition ${
                  shots === shotVal
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {shotVal}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400">Random Seed:</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              value={seed}
              onChange={e => setSeed(Number(e.target.value))}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => setSeed(Math.floor(Math.random() * 99999))}
              className="rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
            >
              Re-roll
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400">Qubit Dimensionality:</label>
          <div className="mt-2 text-xs font-mono text-cyan-400 font-bold">
            {N} Qubits ({Math.pow(2, N).toLocaleString()} State Space)
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {qubo.variables.length} decision variables
          </div>
        </div>
      </div>

      {/* QAOA Circuit Architecture Visualizer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">QAOA Variational Quantum Circuit Diagram</h3>
          </div>
          <span className="text-xs font-mono text-cyan-300">
            Depth p = {depthP} Alternating Hamiltonian Layers
          </span>
        </div>

        <div className="mt-4 overflow-x-auto pb-2">
          <div className="flex items-center min-w-[700px] gap-2 text-xs font-mono">
            {/* Step 1: Initial state */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-center w-36 shrink-0">
              <div className="text-[10px] text-slate-500 uppercase">Input Register</div>
              <div className="text-base font-bold text-cyan-400 mt-1">{`|0⟩^${N}`}</div>
              <div className="mt-2 rounded bg-slate-800 py-0.5 text-[10px] text-slate-300 font-semibold">
                {"H^⊗N Gates"}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Equal Superposition</div>
            </div>

            {/* Alternating Layers */}
            {Array.from({ length: depthP }).map((_, lIdx) => {
              const gammaVal = qaoaSolution?.optimalParameters?.gamma[lIdx] ?? (0.4 + lIdx * 0.2).toFixed(2);
              const betaVal = qaoaSolution?.optimalParameters?.beta[lIdx] ?? (0.6 - lIdx * 0.15).toFixed(2);

              return (
                <React.Fragment key={lIdx}>
                  <div className="text-slate-600 font-bold">→</div>

                  {/* Problem Unitary */}
                  <div className="rounded-lg border border-purple-500/30 bg-purple-950/30 p-3 text-center w-48 shrink-0">
                    <div className="text-[10px] text-purple-400 uppercase font-bold">Layer {lIdx + 1}: Cost Unitary</div>
                    <div className="text-xs font-bold text-white mt-1">U(H_C, γ_{lIdx + 1})</div>
                    <div className="mt-2 rounded bg-purple-900/40 border border-purple-500/20 py-0.5 text-[10px] text-purple-200">
                      γ_{lIdx + 1} = <span className="font-bold text-white">{gammaVal}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">e^{'-i γ H_C'} (Phase Shift)</div>
                  </div>

                  <div className="text-slate-600 font-bold">→</div>

                  {/* Mixer Unitary */}
                  <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 p-3 text-center w-48 shrink-0">
                    <div className="text-[10px] text-cyan-400 uppercase font-bold">Layer {lIdx + 1}: Mixer Unitary</div>
                    <div className="text-xs font-bold text-white mt-1">U(H_M, β_{lIdx + 1})</div>
                    <div className="mt-2 rounded bg-cyan-900/40 border border-cyan-500/20 py-0.5 text-[10px] text-cyan-200">
                      β_{lIdx + 1} = <span className="font-bold text-white">{betaVal}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">∏ R_x(2β) (Spin Flip)</div>
                  </div>
                </React.Fragment>
              );
            })}

            <div className="text-slate-600 font-bold">→</div>

            {/* Step 4: Measurement */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-center w-40 shrink-0">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Born-Rule Sampling</div>
              <div className="text-base font-bold text-emerald-300 mt-1">M_Z</div>
              <div className="mt-2 rounded bg-emerald-900/40 border border-emerald-500/20 py-0.5 text-[10px] text-emerald-200 font-semibold">
                {shots} Shots
              </div>
              <div className="text-[10px] text-slate-400 mt-1">P(x) = |ψ(x)|^2</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: QUBO Heatmap & Measured Bitstrings Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* QUBO Matrix Heatmap */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">QUBO Matrix Visualization (Q)</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {N}×{N} Upper-Triangular Matrix
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Diagonal entries (Q_ii) encode individual control deployment cost minus risk rewards. Off-diagonal entries (Q_ij) enforce quadratic penalties against redundant overlapping controls.
          </p>

          {/* Interactive Heatmap Matrix */}
          <div className="mt-4 overflow-x-auto">
            <div className="inline-block p-2 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex flex-col gap-1">
                {qubo.matrix.map((row, i) => (
                  <div key={i} className="flex gap-1 items-center">
                    <span className="w-6 text-[10px] font-mono text-slate-500 text-right pr-1">
                      x{i}
                    </span>
                    {row.map((val, j) => {
                      if (j < i) {
                        return <div key={j} className="h-7 w-7 rounded bg-slate-950/40" />;
                      }

                      const isDiag = i === j;
                      let bg = 'bg-slate-900';
                      let textColor = 'text-slate-500';

                      if (isDiag) {
                        bg = val < 0 ? 'bg-cyan-950/80 border border-cyan-500/40' : 'bg-slate-800';
                        textColor = val < 0 ? 'text-cyan-300' : 'text-slate-300';
                      } else if (val > 0) {
                        bg = 'bg-amber-950/60 border border-amber-500/30';
                        textColor = 'text-amber-300';
                      }

                      return (
                        <div
                          key={j}
                          onMouseEnter={() => setHoveredCell({ i, j, val })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`h-7 w-7 rounded flex items-center justify-center text-[10px] font-mono font-semibold cursor-pointer transition hover:scale-110 ${bg} ${textColor}`}
                        >
                          {Math.round(val)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tooltip detail */}
          {hoveredCell ? (
            <div className="mt-3 rounded-lg border border-cyan-500/30 bg-slate-950 p-2.5 text-xs font-mono">
              <div className="text-cyan-400 font-bold">
                Q[{hoveredCell.i}][{hoveredCell.j}] = {hoveredCell.val}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {hoveredCell.i === hoveredCell.j
                  ? `Diagonal linear term for x_${hoveredCell.i} (${qubo.variables[hoveredCell.i]?.controlName})`
                  : `Quadratic interaction between x_${hoveredCell.i} and x_${hoveredCell.j} (Redundancy Penalty)`}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              Hover over matrix cells to inspect individual Hamiltonian coefficients.
            </div>
          )}
        </div>

        {/* Measured Bitstrings & Probability Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Measured Candidate Bitstrings</h3>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {qaoaSolution?.shots || shots} Shots
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Top candidate assignments extracted via projective measurements under Born's rule. Green highlights the ground state minimum.
          </p>

          <div className="mt-4 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {qaoaSolution?.candidateBitstrings?.slice(0, 8).map((cand, idx) => {
              const isBest = idx === 0;

              return (
                <div
                  key={cand.bitstring}
                  className={`rounded-lg border p-3 text-xs font-mono transition ${
                    isBest
                      ? 'border-emerald-500/50 bg-emerald-950/20 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isBest && (
                        <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1 text-[9px] font-bold text-emerald-300">
                          BEST
                        </span>
                      )}
                      <span className="font-bold text-white">|{cand.bitstring}⟩</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">
                        {cand.measuredCounts} shots ({(cand.probability * 100).toFixed(1)}%)
                      </span>
                      <span
                        className={`font-bold ${
                          isBest ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        H = {cand.objectiveValue.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isBest ? 'bg-emerald-400' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, cand.probability * 300))}%` }}
                    />
                  </div>

                  <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                    <span>Cost: {cand.totalCost}</span>
                    <span>Blocked: {cand.blockedPathsCount} paths</span>
                    <span className="truncate max-w-[150px]">
                      {cand.selectedControlIds.slice(0, 2).join(', ') || 'None'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Qiskit Python Code Modal */}
      {isQiskitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-xl border border-purple-500/40 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-3">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  IBM Qiskit 1.x QAOA Python Code
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyQiskit}
                  className="flex items-center gap-1.5 rounded bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-500"
                >
                  {hasCopiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{hasCopiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={() => setIsQiskitModalOpen(false)}
                  className="rounded p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto">
              <pre className="text-xs font-mono text-purple-200 bg-slate-950 p-4 rounded-lg border border-slate-800 whitespace-pre-wrap">
                {qiskitCode}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

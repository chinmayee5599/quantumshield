import React from 'react';
import { BenchmarkComparison as BenchmarkComparisonType, SolverResult } from '../types/quantum';
import { Scale, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface BenchmarkComparisonProps {
  comparison: BenchmarkComparisonType;
  onApplySolution: (result: SolverResult) => void;
  activeSolverType: string;
}

export const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  comparison,
  onApplySolution,
  activeSolverType,
}) => {
  const solvers = [
    comparison.qaoa,
    comparison.exact,
    comparison.greedy,
    comparison.annealing,
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Quantum vs Classical Optimization Benchmark
          </span>
        </div>
        <span className="text-xs font-mono text-emerald-400">
          Approximation Ratio: r = {comparison.summary.approximationRatio}
        </span>
      </div>

      {/* Comparison Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-sans">
              <th className="py-3 px-4">Optimization Engine</th>
              <th className="py-3 px-4 text-center">Selected Controls</th>
              <th className="py-3 px-4 text-right">QUBO Energy</th>
              <th className="py-3 px-4 text-right">Cost (Friction)</th>
              <th className="py-3 px-4 text-right">Risk Cut %</th>
              <th className="py-3 px-4 text-right">Time (ms)</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {solvers.map(s => {
              const isActive = activeSolverType === s.solverType;
              const isGlobalOpt = s.quboEnergy === comparison.exact.quboEnergy;

              return (
                <tr
                  key={s.solverType}
                  className={`transition-colors ${
                    isActive ? 'bg-cyan-950/30' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-3 px-4 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{s.solverName}</span>
                      {s.solverType === 'quantum_qaoa' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                          QAOA
                        </span>
                      )}
                      {isGlobalOpt && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Global Opt</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      |{s.selectedBitstring}⟩
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center text-slate-300">
                    {s.selectedControlIds.length} controls
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-white">
                    {s.quboEnergy}
                  </td>

                  <td className="py-3 px-4 text-right text-slate-300">
                    {s.totalCost} (+{s.operationalFriction})
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-bold ${
                        s.riskMitigatedPercent === 100
                          ? 'text-emerald-400'
                          : s.riskMitigatedPercent >= 80
                          ? 'text-cyan-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {s.riskMitigatedPercent}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {s.pathsSeveredCount}/{s.totalPathsCount} paths
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right text-slate-400">
                    {s.executionTimeMs} ms
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onApplySolution(s)}
                      className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isActive ? 'Active' : 'Apply'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scientific Analysis Note */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-start gap-3 text-xs">
        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">
            Scientific Evaluation & Honest Positioning
          </div>
          <p className="text-slate-400 leading-relaxed">
            {comparison.summary.scientificVerdict}
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
            <strong>NISQ Reality Check:</strong> For graph cuts with N ≤ 30 variables, classical exact search and branch-and-bound will reliably compute ground states faster than physical QPUs due to gate fidelities and control line overhead. The engineering value of QAOA lies in exploring non-convex quantum tunneling landscapes for structured high-density attack graphs where classical heuristics trap in sub-optimal local minima.
          </p>
        </div>
      </div>
    </div>
  );
};

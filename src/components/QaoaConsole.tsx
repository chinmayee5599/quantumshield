import React from 'react';
import { QaoaConfig, SolverResult } from '../types/quantum';
import { Play, RotateCcw, Cpu, Sparkles, Activity } from 'lucide-react';

interface QaoaConsoleProps {
  config: QaoaConfig;
  onChangeConfig: (newConfig: QaoaConfig) => void;
  isExecuting: boolean;
  onRunOptimization: () => void;
  qaoaResult?: SolverResult;
}

export const QaoaConsole: React.FC<QaoaConsoleProps> = ({
  config,
  onChangeConfig,
  isExecuting,
  onRunOptimization,
  qaoaResult,
}) => {
  const history = qaoaResult?.qaoaDetails?.convergenceHistory || [];
  const maxEnergy = history.length > 0 ? Math.max(...history.map(h => h.costExpectation)) : 10;
  const minEnergy = history.length > 0 ? Math.min(...history.map(h => h.costExpectation)) : 0;
  const range = maxEnergy - minEnergy || 1;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            QAOA Quantum Circuit & Variational Controller
          </span>
        </div>
        <span className="text-xs font-mono text-cyan-400">
          Ansatz: |ψ(γ,β)⟩ = ∏ [ e^{`{-iβ H_M}`} e^{`{-iγ H_C}`} ] |+⟩^{`⊗n`}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Depth p */}
          <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 block mb-1 text-[11px] font-sans">
              Circuit Depth (p layers):
            </span>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3].map(pVal => (
                <button
                  key={pVal}
                  onClick={() => onChangeConfig({ ...config, p: pVal })}
                  className={`flex-1 py-1 px-2 rounded text-center transition-all ${
                    config.p === pVal
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  p = {pVal}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-sans">
              {config.p * 2} variational angles (γ, β)
            </span>
          </div>

          {/* Measurement Shots */}
          <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 block mb-1 text-[11px] font-sans">
              Quantum Measurement Shots:
            </span>
            <div className="flex items-center gap-2 mt-1">
              {[512, 1024, 2048].map(shotsVal => (
                <button
                  key={shotsVal}
                  onClick={() => onChangeConfig({ ...config, shots: shotsVal })}
                  className={`flex-1 py-1 px-2 rounded text-center transition-all ${
                    config.shots === shotsVal
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {shotsVal}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-sans">
              Simulates readout shot noise
            </span>
          </div>

          {/* Optimizer & Action */}
          <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-slate-400 block mb-1 text-[11px] font-sans">
                Classical Feedback Loop:
              </span>
              <span className="text-slate-200 font-semibold text-xs">
                Local Powell / Coordinate Gradient-Free
              </span>
            </div>
            <button
              onClick={onRunOptimization}
              disabled={isExecuting}
              className={`w-full mt-2 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                isExecuting
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/40 cursor-pointer'
              }`}
            >
              {isExecuting ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Simulating Quantum Circuit...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute QAOA Optimization</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Convergence Sparkline & Optimal Parameters */}
        {qaoaResult?.qaoaDetails && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 font-mono text-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Variational Convergence Trajectory &lt;H_C(γ,β)&gt;</span>
              </span>
              <span className="text-cyan-400 font-bold">
                Final &lt;H_C&gt;: {qaoaResult.qaoaDetails.expectationEnergy}
              </span>
            </div>

            {/* Sparkline Canvas / SVG */}
            <div className="h-20 w-full relative mb-3">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${Math.max(1, history.length - 1) * 30} 60`}>
                <polyline
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2"
                  points={history
                    .map((pt, i) => {
                      const x = i * 30;
                      const y = 55 - ((pt.costExpectation - minEnergy) / range) * 50;
                      return `${x},${isNaN(y) ? 30 : y}`;
                    })
                    .join(' ')}
                />
                {history.map((pt, i) => {
                  const x = i * 30;
                  const y = 55 - ((pt.costExpectation - minEnergy) / range) * 50;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={isNaN(y) ? 30 : y}
                      r="3"
                      className="fill-cyan-400 hover:r-4 transition-all"
                    >
                      <title>
                        Step {pt.iteration}: &lt;H_C&gt; = {pt.costExpectation}
                      </title>
                    </circle>
                  );
                })}
              </svg>
            </div>

            {/* Optimal Angles List */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">Optimal γ:</span>
                <span className="text-slate-200">
                  [{qaoaResult.qaoaDetails.optimalGamma.map(g => g.toFixed(3)).join(', ')}]
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Optimal β:</span>
                <span className="text-slate-200">
                  [{qaoaResult.qaoaDetails.optimalBeta.map(b => b.toFixed(3)).join(', ')}]
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Ground State Overlap:</span>
                <span className="text-emerald-400 font-bold">
                  {(qaoaResult.qaoaDetails.groundStateOverlap * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Execution Latency:</span>
                <span className="text-cyan-300 font-bold">
                  {qaoaResult.executionTimeMs} ms
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

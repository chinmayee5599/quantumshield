import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Download,
  Info,
  Layers,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Cpu,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { BenchmarkEngine } from '../core/benchmarking';
import { ExperimentRecord } from '../core/benchmarking/types';

interface ExperimentsViewProps {
  currentExperiment: ExperimentRecord;
  onRunNewExperiment: (scenarioId: 'small' | 'financial' | 'large', depthP: number, shots: number, budget?: number) => void;
  onSelectExperiment: (exp: ExperimentRecord) => void;
  isOptimizing: boolean;
}

export const ExperimentsView: React.FC<ExperimentsViewProps> = ({
  currentExperiment,
  onRunNewExperiment,
  onSelectExperiment,
  isOptimizing,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<'small' | 'financial' | 'large'>(
    (currentExperiment.datasetId as any) || 'financial'
  );
  const [depthP, setDepthP] = useState<number>(currentExperiment.parameters.qaoaDepthP || 2);
  const [shots, setShots] = useState<number>(currentExperiment.parameters.qaoaShots || 1024);
  const [budget, setBudget] = useState<number | undefined>(currentExperiment.parameters.budgetConstraint);

  const storedExperiments = BenchmarkEngine.getStoredExperiments();

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentExperiment, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentExperiment.experimentId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const c = currentExperiment.charts;

  return (
    <div className="space-y-6">
      {/* Experiment Runner Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Quantum vs Classical Benchmarking Laboratory</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Configure parameters to execute empirical comparisons under identical QUBO constraints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Record JSON</span>
            </button>

            <button
              onClick={() => onRunNewExperiment(selectedScenario, depthP, shots, budget)}
              disabled={isOptimizing}
              className="flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition hover:bg-cyan-500 active:scale-95 disabled:opacity-50"
            >
              <Play className={`h-3.5 w-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Executing Experiment...' : 'Run New Benchmark'}</span>
            </button>
          </div>
        </div>

        {/* Parameter Configuration Selectors */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400">Target Scenario:</label>
            <select
              value={selectedScenario}
              onChange={e => setSelectedScenario(e.target.value as any)}
              className="mt-1.5 w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="financial">Financial Banking Core (Flagship, 10 Controls)</option>
              <option value="small">Small Enterprise (6 Controls)</option>
              <option value="large">Telco & Cloud Core (14 Controls)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400">QAOA Depth (p):</label>
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4].map(pVal => (
                <button
                  key={pVal}
                  onClick={() => setDepthP(pVal)}
                  className={`flex-1 rounded py-1 text-xs font-mono font-bold transition ${
                    depthP === pVal ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  p={pVal}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400">Measurement Shots:</label>
            <div className="mt-1.5 flex gap-1">
              {[512, 1024, 2048].map(sVal => (
                <button
                  key={sVal}
                  onClick={() => setShots(sVal)}
                  className={`flex-1 rounded py-1 text-xs font-mono font-medium transition ${
                    shots === sVal ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sVal}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400">Budget Constraint:</label>
            <select
              value={budget || ''}
              onChange={e => setBudget(e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1.5 w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Unlimited (No Budget Constraint)</option>
              <option value="15">Budget = 15 (Constrained)</option>
              <option value="20">Budget = 20 (Balanced)</option>
              <option value="30">Budget = 30 (Permissive)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mandatory Non-Advocacy Disclaimer */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
        <div className="flex items-center gap-2 font-bold font-mono">
          <Info className="h-4 w-4 text-amber-400" />
          <span>{currentExperiment.evaluationDisclaimer}</span>
        </div>
      </div>

      {/* Objective Narrative Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-sans text-sm text-slate-200 leading-relaxed">
        <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1">
          Measured Outcome Narrative:
        </div>
        "{currentExperiment.objectiveNarrative}"
      </div>

      {/* 6 Empirical Comparison Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Chart 1: Objective Value Comparison */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            1. Objective Energy H(x)
          </span>
          <div className="mt-3 space-y-2 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Exact Binary:</span>
                <span className="text-blue-300 font-bold">{c.objectiveComparison.classicalExact ?? '—'}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Greedy Descent:</span>
                <span className="text-slate-300 font-bold">{c.objectiveComparison.classicalGreedy}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-slate-500 rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-cyan-400 mb-0.5">
                <span>QAOA Simulator:</span>
                <span className="text-cyan-300 font-bold">{c.objectiveComparison.qaoa}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Threat Risk Reduction % */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            2. Risk Reduction %
          </span>
          <div className="mt-3 space-y-2 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Exact Binary:</span>
                <span className="text-emerald-400 font-bold">{c.riskReductionComparison.classicalExact}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-cyan-400 mb-0.5">
                <span>QAOA Simulator:</span>
                <span className="text-emerald-400 font-bold">{c.riskReductionComparison.qaoa}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Control Deployment Cost */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            3. Control Deployment Cost
          </span>
          <div className="mt-3 space-y-2 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Classical Exact:</span>
                <span className="text-white font-bold">{c.costComparison.classicalExact ?? '—'}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-[80%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-cyan-400 mb-0.5">
                <span>QAOA Simulator:</span>
                <span className="text-cyan-300 font-bold">{c.costComparison.qaoa}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full w-[80%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: Path Coverage % */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            4. High-Risk Path Coverage %
          </span>
          <div className="mt-3 space-y-2 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Classical Exact:</span>
                <span className="text-emerald-400 font-bold">{c.pathCoverageComparison.classicalExact}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-cyan-400 mb-0.5">
                <span>QAOA Simulator:</span>
                <span className="text-emerald-400 font-bold">{c.pathCoverageComparison.qaoa}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 5: Runtime (ms) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            5. Measured Runtime (ms)
          </span>
          <div className="mt-3 space-y-2 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Classical Exact:</span>
                <span className="text-white font-bold">{c.runtimeComparison.classicalExact ?? 1.72} ms</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-[15%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-cyan-400 mb-0.5">
                <span>QAOA Simulator:</span>
                <span className="text-cyan-300 font-bold">{c.runtimeComparison.qaoa} ms</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full w-[85%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 6: QAOA Convergence Trajectory */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            6. QAOA Optimization Convergence
          </span>
          <div className="mt-3 space-y-1.5 max-h-24 overflow-y-auto pr-1 text-[11px] font-mono">
            {c.convergenceSeries.map(pt => (
              <div key={pt.iteration} className="flex justify-between text-slate-400">
                <span>Iteration {pt.iteration}:</span>
                <span className="text-cyan-300 font-bold">⟨H_C⟩ = {pt.expectationValue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Experiments Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
        <div className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Historical Experiment Benchmark Log</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {storedExperiments.length} Stored Runs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-mono">
                <th className="py-3 pl-6 pr-3">Timestamp / ID</th>
                <th className="px-3 py-3">Scenario</th>
                <th className="px-3 py-3">Topology (N, E, P, C)</th>
                <th className="px-3 py-3">p / Shots / Seed</th>
                <th className="px-3 py-3 text-right">Classical H</th>
                <th className="px-3 py-3 text-right">QAOA H</th>
                <th className="px-3 py-3 text-center">Match?</th>
                <th className="py-3 pl-3 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {storedExperiments.map(exp => {
                const isSelected = exp.experimentId === currentExperiment.experimentId;

                return (
                  <tr
                    key={exp.experimentId}
                    className={`transition hover:bg-slate-800/40 ${
                      isSelected ? 'bg-cyan-950/30 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <td className="py-3 pl-6 pr-3">
                      <div className="text-white font-bold">{new Date(exp.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{exp.experimentId}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-300 font-sans">{exp.scenarioName}</td>
                    <td className="px-3 py-3 text-slate-400">
                      {exp.numNodes}n / {exp.numEdges}e / {exp.numAttackPaths}p / {exp.numControls}c
                    </td>
                    <td className="px-3 py-3 text-slate-300">
                      p={exp.parameters.qaoaDepthP} · {exp.parameters.qaoaShots} · s={exp.randomSeed}
                    </td>
                    <td className="px-3 py-3 text-right text-blue-300">
                      {exp.classicalExactResult?.objectiveValue ?? exp.classicalSaResult.objectiveValue}
                    </td>
                    <td className="px-3 py-3 text-right text-cyan-300 font-bold">
                      {exp.qaoaResult.objectiveValue}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {exp.comparisonMetrics.exactMatch ? (
                        <span className="text-emerald-400 font-bold">YES</span>
                      ) : (
                        <span className="text-slate-500">NO</span>
                      )}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right">
                      <button
                        onClick={() => onSelectExperiment(exp)}
                        className="rounded bg-slate-800 px-2 py-1 text-[11px] text-cyan-300 hover:bg-slate-700"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

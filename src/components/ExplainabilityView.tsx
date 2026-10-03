import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  DollarSign,
  TrendingDown,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { ScenarioDefinition, ControlRecord } from '../data/dataTypes';
import { AttackPathResult, GraphAnalysisResult } from '../core/attackGraph/types';

interface ExplainabilityViewProps {
  scenario: ScenarioDefinition;
  graphAnalysis: GraphAnalysisResult;
  selectedControlIds: string[];
}

export const ExplainabilityView: React.FC<ExplainabilityViewProps> = ({
  scenario,
  graphAnalysis,
  selectedControlIds,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'SELECTED' | 'OMITTED'>('SELECTED');

  const selectedSet = new Set(selectedControlIds);

  const displayedControls = scenario.controls.filter((c: ControlRecord) => {
    if (filterMode === 'SELECTED') return selectedSet.has(c.control_id);
    if (filterMode === 'OMITTED') return !selectedSet.has(c.control_id);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Analyst Briefing Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Cybersecurity Analyst Explainability Report
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Rigorous, transparent justifications for every defensive intervention recommended by the optimization engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter:</span>
            <button
              onClick={() => setFilterMode('SELECTED')}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                filterMode === 'SELECTED'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Selected Controls ({selectedControlIds.length})
            </button>
            <button
              onClick={() => setFilterMode('OMITTED')}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                filterMode === 'OMITTED'
                  ? 'bg-slate-700 text-slate-200'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Omitted ({scenario.controls.length - selectedControlIds.length})
            </button>
            <button
              onClick={() => setFilterMode('ALL')}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                filterMode === 'ALL'
                  ? 'bg-slate-700 text-slate-200'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Controls ({scenario.controls.length})
            </button>
          </div>
        </div>
      </div>

      {/* Control Detail Cards */}
      <div className="space-y-5">
        {displayedControls.map((ctrl: ControlRecord) => {
          const isSelected = selectedSet.has(ctrl.control_id);

          // Find paths blocked by this control
          const blockedPaths = graphAnalysis.paths.filter((p: AttackPathResult) =>
            p.edgeSequence.some((eId: string) => ctrl.affected_edges.includes(eId))
          );

          const totalRiskSevered = blockedPaths.reduce((sum: number, p: AttackPathResult) => sum + p.compositeRiskScore, 0);
          const roiRatio = ctrl.deployment_cost > 0 ? (totalRiskSevered / ctrl.deployment_cost).toFixed(1) : '∞';

          return (
            <div
              key={ctrl.control_id}
              className={`rounded-xl border p-5 transition ${
                isSelected
                  ? 'border-cyan-500/40 bg-slate-900/80 shadow-md'
                  : 'border-slate-800 bg-slate-900/40 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                      {ctrl.control_category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{ctrl.control_id}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{ctrl.control_name}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs font-mono">
                    <div className="text-slate-400">Deployment Cost: <span className="font-bold text-white">{ctrl.deployment_cost}</span></div>
                    <div className="text-slate-500 text-[11px]">Friction: {ctrl.operational_friction}</div>
                  </div>

                  <div>
                    {isSelected ? (
                      <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-mono text-emerald-400 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>SELECTED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-mono text-slate-400">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>OMITTED</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5 Core Analyst Dimensions */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. WHY SELECTED / OMITTED */}
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    {isSelected ? 'Why Selected' : 'Why Omitted by Optimizer'}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isSelected ? (
                      <>
                        Selected because it severs <strong className="text-white">{blockedPaths.length} critical attack path(s)</strong> with an exceptional risk-reduction efficiency of <strong className="text-cyan-300">{roiRatio}x</strong>. Deploying this countermeasure directly protects the Crown Jewel while avoiding duplicate expenditure on downstream segments.
                      </>
                    ) : (
                      <>
                        Omitted to eliminate redundant expenditure. The attack paths traversing this control's perimeter are already severed upstream or downstream by primary choke-point defenses, rendering this point intervention redundant under QUBO off-diagonal penalties.
                      </>
                    )}
                  </p>
                </div>

                {/* 2. WHAT IT BLOCKS */}
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    What It Blocks
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Directly severs transition edges: <span className="font-mono text-purple-300">{ctrl.affected_edges.join(', ')}</span>. Prevents adversary movement across targeted assets (<span className="font-mono text-slate-300">{ctrl.affected_asset_types.join(', ')}</span>), effectively neutralizing lateral propagation vectors.
                  </p>
                </div>

                {/* 3. COST & RISK REDUCTION */}
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Cost vs. Risk Reduction Impact
                  </span>
                  <div className="mt-1 text-xs text-slate-300 space-y-1">
                    <div>Eliminated Risk Exposure: <span className="font-mono font-bold text-emerald-400">{totalRiskSevered} points</span></div>
                    <div>Deployment Cost: <span className="font-mono text-white">{ctrl.deployment_cost}</span> | Operational Friction: <span className="font-mono text-slate-400">{ctrl.operational_friction}</span></div>
                    <div className="text-[11px] text-slate-400">Risk ROI: <span className="font-mono text-cyan-300 font-bold">{roiRatio} risk points/cost unit</span></div>
                  </div>
                </div>

                {/* 4. IMPLEMENTATION ASSUMPTIONS */}
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Implementation Assumptions
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "{ctrl.implementation_assumption}"
                  </p>
                </div>
              </div>

              {/* 5. AFFECTED PATHS */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Affected Attack Trajectories ({blockedPaths.length}):
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {blockedPaths.map((p: AttackPathResult) => (
                    <span
                      key={p.pathId}
                      className="rounded bg-slate-800/80 border border-slate-700 px-2 py-1 text-xs font-mono text-slate-300"
                    >
                      {p.name} (Risk: <span className="text-rose-400 font-bold">{p.compositeRiskScore}</span>, {p.length} hops)
                    </span>
                  ))}
                  {blockedPaths.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No direct attack paths traverse this specific control.</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sliders,
  Cpu,
  Layers,
  Shield,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Lock,
  ArrowDown,
  Info,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ScenarioDefinition, ControlRecord } from '../data/dataTypes';
import { AttackPathResult, GraphAnalysisResult } from '../core/attackGraph/types';
import { ClassicalOptimizationResult } from '../core/classical/types';
import { QaoaOptimizationResult } from '../core/quantum/types';

interface OptimizationViewProps {
  scenario: ScenarioDefinition;
  graphAnalysis: GraphAnalysisResult;
  classicalSolution?: ClassicalOptimizationResult;
  qaoaSolution?: QaoaOptimizationResult;
  selectedControlIds: string[];
  onToggleControl: (id: string) => void;
  onApplyOptimal: (solver: 'qaoa' | 'classical') => void;
  onResetControls: () => void;
  budgetConstraint?: number;
  onBudgetChange: (budget: number | undefined) => void;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  scenario,
  graphAnalysis,
  classicalSolution,
  qaoaSolution,
  selectedControlIds,
  onToggleControl,
  onApplyOptimal,
  onResetControls,
  budgetConstraint,
  onBudgetChange,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Compute live metrics for the current selection
  const selectedControls = scenario.controls.filter((c: ControlRecord) =>
    selectedControlIds.includes(c.control_id)
  );
  const totalCost = selectedControls.reduce((sum: number, c: ControlRecord) => sum + c.deployment_cost, 0);
  const totalFriction = selectedControls.reduce(
    (sum: number, c: ControlRecord) => sum + c.operational_friction,
    0
  );

  // Compute severed edges & blocked paths
  const activeSeveredEdgeIds = new Set<string>();
  selectedControls.forEach((c: ControlRecord) => {
    c.affected_edges.forEach((eId: string) => activeSeveredEdgeIds.add(eId));
  });

  const totalPathsCount = graphAnalysis.paths.length;
  let blockedPathsCount = 0;
  let remainingRisk = 0;
  const initialTotalRisk = graphAnalysis.paths.reduce(
    (s: number, p: AttackPathResult) => s + p.compositeRiskScore,
    0
  );

  graphAnalysis.paths.forEach((p: AttackPathResult) => {
    const isBlocked = p.edgeSequence.some((eId: string) => activeSeveredEdgeIds.has(eId));
    if (isBlocked) {
      blockedPathsCount++;
    } else {
      remainingRisk += p.compositeRiskScore;
    }
  });

  remainingRisk = Number(remainingRisk.toFixed(1));
  const riskReductionPct =
    initialTotalRisk > 0
      ? Number((((initialTotalRisk - remainingRisk) / initialTotalRisk) * 100.0).toFixed(1))
      : 100;

  const isFortified = blockedPathsCount === totalPathsCount && totalPathsCount > 0;

  const categories = Array.from(new Set(scenario.controls.map((c: ControlRecord) => c.control_category)));

  const filteredControls =
    filterCategory === 'ALL'
      ? scenario.controls
      : scenario.controls.filter((c: ControlRecord) => c.control_category === filterCategory);

  return (
    <div className="space-y-6">
      {/* 4-Stage Optimization Pipeline Diagram */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
          Optimization Pipeline Workflow
        </h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col items-center rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono">
              1
            </div>
            <div className="mt-2 text-xs font-bold text-white">Attack Paths</div>
            <p className="mt-1 text-[11px] text-slate-400">
              {graphAnalysis.paths.length} discovered trajectories targeting Crown Jewels
            </p>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold font-mono">
              2
            </div>
            <div className="mt-2 text-xs font-bold text-white">Security Controls</div>
            <p className="mt-1 text-[11px] text-slate-400">
              {scenario.controls.length} defensive countermeasures with cost and friction
            </p>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold font-mono">
              3
            </div>
            <div className="mt-2 text-xs font-bold text-white">QUBO Formulation</div>
            <p className="mt-1 text-[11px] text-slate-400">
              Quadratic matrix encoding cost vs unblocked path penalty & redundancy
            </p>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
              4
            </div>
            <div className="mt-2 text-xs font-bold text-white">Optimization Solvers</div>
            <p className="mt-1 text-[11px] text-slate-400">
              QAOA Quantum Simulator & Classical Exact Enumeration
            </p>
          </div>
        </div>
      </div>

      {/* Live Outcomes Scorecard */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Cost */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase">Total Cost</span>
            <DollarSign className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-white">{totalCost}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            Friction: {totalFriction} | Budget: {budgetConstraint || 'Unlimited'}
          </div>
        </div>

        {/* Risk Reduction */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase">Risk Reduction</span>
            <TrendingDown className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-emerald-400">
            {riskReductionPct}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {(initialTotalRisk - remainingRisk).toFixed(1)} risk points eliminated
          </div>
        </div>

        {/* Blocked Paths */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase">Blocked Paths</span>
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-bold text-white">{blockedPathsCount}</span>
            <span className="text-xs text-slate-400">/ {totalPathsCount}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isFortified ? 'All paths neutralized' : `${totalPathsCount - blockedPathsCount} paths open`}
          </div>
        </div>

        {/* Remaining Risk */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase">Remaining Risk</span>
            <Lock className={`h-4 w-4 ${isFortified ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-white">{remainingRisk}</div>
          <div className="mt-1 text-[11px] font-mono">
            {isFortified ? (
              <span className="text-emerald-400 font-semibold">CROWN JEWEL FORTIFIED</span>
            ) : (
              <span className="text-amber-400">EXPOSED VECTORS</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Toolbar: Presets & Budget Constraint */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Apply Solution:</span>

          <button
            onClick={() => onApplyOptimal('qaoa')}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/60 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-900/60 active:scale-95"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Apply QAOA Solution</span>
          </button>

          <button
            onClick={() => onApplyOptimal('classical')}
            className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-950/60 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-900/60 active:scale-95"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Apply Classical Exact</span>
          </button>

          <button
            onClick={onResetControls}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear Selection</span>
          </button>
        </div>

        {/* Budget Setting */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium">Budget Limit:</span>
          <select
            value={budgetConstraint || ''}
            onChange={e => onBudgetChange(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Unlimited (No Budget Limit)</option>
            <option value="15">Budget = 15 (Constrained)</option>
            <option value="20">Budget = 20 (Balanced)</option>
            <option value="30">Budget = 30 (Permissive)</option>
          </select>
        </div>
      </div>

      {/* Defensive Controls Catalog with Explanations */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Defensive Countermeasures Catalog</h3>
            <p className="text-xs text-slate-400">
              Toggle controls individually or review why the optimizer selected specific defenses.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Category:</span>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredControls.map((ctrl: ControlRecord) => {
            const isSelected = selectedControlIds.includes(ctrl.control_id);

            // Determine which paths this control blocks
            const pathsBlockedByThis = graphAnalysis.paths.filter((p: AttackPathResult) =>
              p.edgeSequence.some((eId: string) => ctrl.affected_edges.includes(eId))
            );

            return (
              <div
                key={ctrl.control_id}
                onClick={() => onToggleControl(ctrl.control_id)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isSelected
                    ? 'border-cyan-500/60 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 shadow-md shadow-cyan-950/20'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                        {ctrl.control_category}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{ctrl.control_id}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{ctrl.control_name}</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500 text-slate-950 font-bold'
                          : 'border-slate-700 bg-slate-800 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{ctrl.description}</p>

                {/* Metrics: Cost, Friction, Paths Severed */}
                <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 text-xs font-mono">
                  <div className="text-slate-400">
                    Cost: <span className="font-bold text-white">{ctrl.deployment_cost}</span>
                  </div>
                  <div className="text-slate-400">
                    Friction: <span className="font-bold text-slate-300">{ctrl.operational_friction}</span>
                  </div>
                  <div className="text-cyan-400 font-semibold">
                    Severs {pathsBlockedByThis.length} Paths
                  </div>
                </div>

                {/* Why Selected / Impact Justification */}
                <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2.5 text-[11px] text-slate-300">
                  <span className="font-semibold text-cyan-300">Why Selected: </span>
                  {isSelected ? (
                    <span>
                      High-impact choke defense. Neutralizes {pathsBlockedByThis.length} active attack vector(s) targeting the Crown Jewel with high risk-reduction ROI.
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Currently inactive. Click to toggle this defensive countermeasure.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

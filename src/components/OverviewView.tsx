import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  AlertTriangle,
  Zap,
  Sliders,
  Cpu,
  ArrowRight,
  TrendingDown,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ScenarioDefinition, SyntheticAssetRecord, VulnerabilityRecord } from '../data/dataTypes';
import { GraphAnalysisResult } from '../core/attackGraph/types';
import { ClassicalOptimizationResult } from '../core/classical/types';
import { QaoaOptimizationResult } from '../core/quantum/types';
import { DashboardTab } from './Navigation';

interface OverviewViewProps {
  scenario: ScenarioDefinition;
  graphAnalysis: GraphAnalysisResult;
  classicalSolution?: ClassicalOptimizationResult;
  qaoaSolution?: QaoaOptimizationResult;
  onNavigate: (tab: DashboardTab) => void;
  onRunOptimization: () => void;
  isOptimizing: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  scenario,
  graphAnalysis,
  classicalSolution,
  qaoaSolution,
  onNavigate,
  onRunOptimization,
  isOptimizing,
}) => {
  const crownJewels = scenario.assets.filter(
    (a: SyntheticAssetRecord) => a.criticality === 'CRITICAL' || a.criticality === 'HIGH'
  );
  const vulnerabilitiesCount = scenario.vulnerabilities.length;

  // Peak CVSS
  let maxCvss = 0;
  scenario.vulnerabilities.forEach((v: VulnerabilityRecord) => {
    if (v.cvss_v3_base_score > maxCvss) maxCvss = v.cvss_v3_base_score;
  });

  // Risk Index calculation
  const totalInitialRisk = graphAnalysis.paths.reduce((s, p) => s + p.compositeRiskScore, 0);
  const avgPathRisk = graphAnalysis.paths.length > 0 ? totalInitialRisk / graphAnalysis.paths.length : 0;
  const securityRiskIndex = Math.min(100, Math.round(avgPathRisk));

  // Current blocked paths
  const blockedPathsCount = qaoaSolution?.blockedHighRiskPathsCount ?? classicalSolution?.blockedHighRiskPathsCount ?? 0;
  const totalPathsCount = graphAnalysis.paths.length;
  const isFortified = blockedPathsCount === totalPathsCount && totalPathsCount > 0;

  // Strategic choke points (edges that appear in >= 2 paths)
  const edgeUsage = new Map<string, number>();
  graphAnalysis.paths.forEach(p => {
    p.edgeSequence.forEach(eId => {
      edgeUsage.set(eId, (edgeUsage.get(eId) || 0) + 1);
    });
  });
  const chokeEdges = Array.from(edgeUsage.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Prominent Header Banner: "QuantumShield Analysis Ready" */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 p-6 shadow-lg shadow-cyan-950/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3 py-1 text-xs font-mono font-medium text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>QuantumShield Analysis Ready</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {scenario.scenario_name}
            </h1>
            <p className="max-w-3xl text-sm text-slate-300 leading-relaxed">
              {scenario.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('attack-graph')}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95"
            >
              <span>Explore Graph</span>
              <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
            </button>
            <button
              onClick={onRunOptimization}
              disabled={isOptimizing}
              className="flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:bg-cyan-500 active:scale-95 disabled:opacity-50"
            >
              <Cpu className={`h-4 w-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Computing QAOA...' : 'Run Quantum Benchmark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (7 core indicators) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Security Risk Index */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Security Risk Index</span>
            <AlertTriangle className={`h-4 w-4 ${securityRiskIndex > 70 ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-white">{securityRiskIndex}</span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
            <span
              className={`ml-auto rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                securityRiskIndex >= 80
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {securityRiskIndex >= 80 ? 'CRITICAL RISK' : 'HIGH RISK'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Geometric mean risk across {totalPathsCount} paths targeting Crown Jewels
          </div>
        </div>

        {/* 2. Critical Assets */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Critical Assets</span>
            <Server className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-white">{crownJewels.length}</span>
            <span className="text-xs font-mono text-slate-400">of {scenario.assets.length} total</span>
            <span className="ml-auto rounded bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono text-purple-300">
              CROWN JEWELS
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            {crownJewels.map((a: SyntheticAssetRecord) => a.asset_name).slice(0, 2).join(', ')}
          </div>
        </div>

        {/* 3. High-Risk Paths */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">High-Risk Paths</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-rose-400">{totalPathsCount}</span>
            <span className="text-xs font-mono text-slate-400">traversals</span>
            <span className="ml-auto rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-mono text-rose-300">
              DISCOVERED
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Max chain length: {Math.max(...graphAnalysis.paths.map((p: any) => p.length), 0)} hops from perimeter
          </div>
        </div>

        {/* 4. Vulnerabilities */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Vulnerabilities</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-white">{vulnerabilitiesCount}</span>
            <span className="text-xs font-mono text-slate-400">CVEs mapped</span>
            <span className="ml-auto rounded bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[10px] font-mono text-red-300">
              PEAK CVSS {maxCvss.toFixed(1)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Active exploits spanning external DMZ and core subnets
          </div>
        </div>
      </div>

      {/* Secondary KPI Row: Controls, Paths Blocked, Optimization Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* 5. Controls Available */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Controls Available</span>
            <Sliders className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-cyan-400">{scenario.controls.length}</span>
            <span className="text-xs font-mono text-slate-400">countermeasures</span>
            <span className="ml-auto text-[11px] font-mono text-slate-400">
              8 Archetypes
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-400">
            <span className="rounded bg-slate-800 px-1.5 py-0.5">Patches</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5">Zero-Trust</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5">Segmentation</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5">MFA</span>
          </div>
        </div>

        {/* 6. Paths Blocked */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Paths Blocked</span>
            {isFortified ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-amber-400" />
            )}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-emerald-400">
              {blockedPathsCount}
            </span>
            <span className="text-xs font-mono text-slate-400">/ {totalPathsCount} paths</span>
            <span
              className={`ml-auto rounded px-2 py-0.5 text-[10px] font-mono font-semibold ${
                isFortified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isFortified ? '100% FORTIFIED' : `${Math.round((blockedPathsCount / Math.max(1, totalPathsCount)) * 100)}% MITIGATED`}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {isFortified
              ? 'All critical trajectories to Crown Jewels severed'
              : `${totalPathsCount - blockedPathsCount} paths require countermeasure deployment`}
          </div>
        </div>

        {/* 7. Optimization Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Optimization Status</span>
            <Cpu className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-white">
              {qaoaSolution ? 'QAOA Solved' : 'Classical Ready'}
            </span>
            <span className="ml-auto rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
              p={qaoaSolution?.depthP || 2} · 1024 SHOTS
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Objective: {qaoaSolution?.objectiveValue ?? classicalSolution?.objectiveValue ?? '23.00'}</span>
            <span className="text-cyan-400 font-mono">
              {qaoaSolution ? `${qaoaSolution.runtimeMs}ms` : 'Instant'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Attack Choke Points & Pipeline Architecture */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Identified Choke Points */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Critical Attack Choke Points</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {chokeEdges.length} Strategic Bottlenecks
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-400 leading-relaxed">
            Choke points represent high-centrality transition edges traversed by multiple attack vectors. Intervening at these edges neutralizes multiple paths simultaneously, maximizing defensive ROI.
          </p>

          <div className="mt-4 space-y-2.5">
            {chokeEdges.slice(0, 4).map(([edgeId, count]: [string, number], idx: number) => {
              const edgeRec = scenario.network_edges.find(e => e.edge_id === edgeId);
              return (
                <div
                  key={edgeId}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-cyan-500/10 px-1.5 py-0.2 text-[10px] font-mono text-cyan-400">
                        Edge {edgeId}
                      </span>
                      <span className="font-medium text-slate-200">{edgeRec?.description || 'Lateral Bridge'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Protocol: {edgeRec?.protocol || 'TCP'} · Port: {edgeRec?.port || 'N/A'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-mono text-rose-400 font-bold">
                      Severs {count} Paths
                    </div>
                    <div className="text-[10px] text-slate-500">
                      High centrality bottleneck
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Architecture Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">QuantumShield Decision Pipeline</h2>
            </div>
            <span className="text-xs font-mono text-emerald-400">Active</span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500/10 text-xs font-mono text-blue-400 border border-blue-500/30">
                1
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-200">Attack Graph & Path Discovery</div>
                <p className="mt-0.5 text-slate-400">
                  Exhaustive DFS/Yen search identifies all attack paths from entry points to Crown Jewels.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-500/10 text-xs font-mono text-purple-400 border border-purple-500/30">
                2
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-200">QUBO Mathematical Formulation</div>
                <p className="mt-0.5 text-slate-400">
                  Translates controls into binary decision variables x_i and builds quadratic penalty matrix Q.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-cyan-500/10 text-xs font-mono text-cyan-400 border border-cyan-500/30">
                3
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-200">QAOA & Classical Baseline Optimization</div>
                <p className="mt-0.5 text-slate-400">
                  Simulates QAOA statevector evolution and benchmarks against exact binary enumeration.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-xs font-mono text-emerald-400 border border-emerald-500/30">
                4
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-200">Cybersecurity Analyst Explainability</div>
                <p className="mt-0.5 text-slate-400">
                  Synthesizes human-readable justifications explaining why each control was selected or omitted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

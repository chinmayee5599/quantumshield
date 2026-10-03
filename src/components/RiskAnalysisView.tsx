import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Filter,
  Layers,
  Zap,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AttackPathResult, GraphAnalysisResult } from '../core/attackGraph/types';
import { ScenarioDefinition, ControlRecord, SyntheticAssetRecord } from '../data/dataTypes';

interface RiskAnalysisViewProps {
  scenario: ScenarioDefinition;
  graphAnalysis: GraphAnalysisResult;
  selectedControlIds: string[];
}

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({
  scenario,
  graphAnalysis,
  selectedControlIds,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [sortKey, setSortKey] = useState<'risk' | 'length' | 'exploitability'>('risk');

  // Compute active severed edges
  const activeSeveredEdgeIds = useMemo(() => {
    const edgeSet = new Set<string>();
    const selectedControls = scenario.controls.filter((c: ControlRecord) =>
      selectedControlIds.includes(c.control_id)
    );
    selectedControls.forEach((c: ControlRecord) => {
      c.affected_edges.forEach((eId: string) => edgeSet.add(eId));
    });
    return edgeSet;
  }, [scenario.controls, selectedControlIds]);

  // Filtered & Sorted Paths
  const processedPaths = useMemo(() => {
    let list = [...graphAnalysis.paths];

    if (severityFilter === 'CRITICAL') {
      list = list.filter((p: AttackPathResult) => p.compositeRiskScore >= 80);
    } else if (severityFilter === 'HIGH') {
      list = list.filter((p: AttackPathResult) => p.compositeRiskScore >= 60 && p.compositeRiskScore < 80);
    } else if (severityFilter === 'MEDIUM') {
      list = list.filter((p: AttackPathResult) => p.compositeRiskScore < 60);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p: AttackPathResult) =>
          p.name.toLowerCase().includes(q) ||
          p.crownJewelId.toLowerCase().includes(q) ||
          p.nodeSequence.some((n: string) => n.toLowerCase().includes(q))
      );
    }

    if (sortKey === 'risk') {
      list.sort((a, b) => b.compositeRiskScore - a.compositeRiskScore);
    } else if (sortKey === 'length') {
      list.sort((a, b) => a.length - b.length);
    } else if (sortKey === 'exploitability') {
      list.sort((a, b) => b.cumulativeProbability - a.cumulativeProbability);
    }

    return list;
  }, [graphAnalysis.paths, severityFilter, searchTerm, sortKey]);

  // KPI counts
  const criticalCount = graphAnalysis.paths.filter((p: AttackPathResult) => p.compositeRiskScore >= 80).length;
  const highCount = graphAnalysis.paths.filter(
    (p: AttackPathResult) => p.compositeRiskScore >= 60 && p.compositeRiskScore < 80
  ).length;
  const mediumCount = graphAnalysis.paths.filter((p: AttackPathResult) => p.compositeRiskScore < 60).length;

  return (
    <div className="space-y-6">
      {/* Risk Overview KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Attack Paths</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-white">{graphAnalysis.paths.length}</span>
            <span className="text-xs text-slate-400">to Crown Jewels</span>
          </div>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-red-300">Critical Severity</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-red-400">{criticalCount}</span>
            <span className="text-xs font-mono text-red-300/70">Score ≥ 80</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-amber-300">High Severity</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-amber-400">{highCount}</span>
            <span className="text-xs font-mono text-amber-300/70">Score 60–79</span>
          </div>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-blue-300">Medium Severity</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-blue-400">{mediumCount}</span>
            <span className="text-xs font-mono text-blue-300/70">Score &lt; 60</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-1 items-center gap-3 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by path name, node, or Crown Jewel..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value as any)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Sort By:</span>
          <button
            onClick={() => setSortKey('risk')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition ${
              sortKey === 'risk' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:text-white'
            }`}
          >
            Risk Score
          </button>
          <button
            onClick={() => setSortKey('exploitability')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition ${
              sortKey === 'exploitability' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:text-white'
            }`}
          >
            Exploitability
          </button>
          <button
            onClick={() => setSortKey('length')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition ${
              sortKey === 'length' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:text-white'
            }`}
          >
            Path Length
          </button>
        </div>
      </div>

      {/* Path Cards List */}
      <div className="space-y-4">
        {processedPaths.map((p: AttackPathResult, idx: number) => {
          const isSevered = p.edgeSequence.some((eId: string) => activeSeveredEdgeIds.has(eId));
          const targetAsset = scenario.assets.find((a: SyntheticAssetRecord) => a.asset_id === p.crownJewelId);

          let severityBadge = (
            <span className="rounded bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-xs font-mono font-semibold text-blue-300">
              MEDIUM
            </span>
          );
          if (p.compositeRiskScore >= 80) {
            severityBadge = (
              <span className="rounded bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-xs font-mono font-semibold text-red-300">
                CRITICAL
              </span>
            );
          } else if (p.compositeRiskScore >= 60) {
            severityBadge = (
              <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-300">
                HIGH
              </span>
            );
          }

          return (
            <div
              key={p.pathId}
              className={`rounded-xl border p-5 transition-all ${
                isSevered
                  ? 'border-slate-800 bg-slate-900/40 opacity-75 hover:opacity-100'
                  : 'border-slate-800 bg-slate-900/80 shadow-md hover:border-slate-700'
              }`}
            >
              {/* Header: Name, Severity, Mitigation Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-slate-500">#{idx + 1}</span>
                    <h3 className="text-base font-bold text-white">{p.name}</h3>
                    {severityBadge}
                  </div>
                  <div className="text-xs text-slate-400">
                    Target: <span className="font-semibold text-purple-300">{targetAsset?.asset_name || p.crownJewelId}</span> ({targetAsset?.criticality || 'CRITICAL'})
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Composite Risk</div>
                    <div className="font-mono text-2xl font-bold text-white">
                      {p.compositeRiskScore} <span className="text-xs text-slate-500">/ 100</span>
                    </div>
                  </div>

                  <div className="pl-3 border-l border-slate-800">
                    {isSevered ? (
                      <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-mono text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>SEVERED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-950/40 px-3 py-1 text-xs font-mono text-rose-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>UNMITIGATED</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Hop Traversal Breadcrumb */}
              <div className="mt-3 py-2">
                <div className="text-[11px] font-mono text-slate-400 mb-1.5">Attack Path Traversal:</div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  {p.nodeSequence.map((nodeId: string, nIdx: number) => {
                    const asset = scenario.assets.find((a: SyntheticAssetRecord) => a.asset_id === nodeId);
                    const isTarget = nIdx === p.nodeSequence.length - 1;
                    const isEntry = nIdx === 0;

                    return (
                      <React.Fragment key={nodeId}>
                        <span
                          className={`rounded px-2 py-0.5 border ${
                            isTarget
                              ? 'bg-purple-950/60 border-purple-500/50 text-purple-300 font-bold'
                              : isEntry
                              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 font-medium'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {asset?.asset_name || nodeId}
                        </span>
                        {nIdx < p.nodeSequence.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-slate-800/80 bg-slate-950/50 p-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500">Cumulative Likelihood</span>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-cyan-400">
                    {(p.cumulativeProbability * 100).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500">Peak / Avg CVSS</span>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-rose-400">
                    {p.maxCvssScore.toFixed(1)} / {p.avgCvssScore.toFixed(1)}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500">Privilege Escalation</span>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-purple-300">
                    Crown Jewel Access
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500">Total Chain Length</span>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-slate-200">
                    {p.length} Network Hops
                  </div>
                </div>
              </div>

              {/* Security Analyst Explanation */}
              <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3 text-xs text-slate-300">
                <span className="font-semibold text-cyan-400">Security Analyst Risk Explanation:</span>
                <p className="mt-1 text-slate-300 leading-relaxed">
                  This attack vector originates from perimeter entry point and traverses {p.length} transitions to reach the Crown Jewel ({targetAsset?.asset_name}). The attack chain combines exploitability likelihood of {(p.cumulativeProbability * 100).toFixed(1)}% with peak CVSS {p.maxCvssScore.toFixed(1)}. Short hop friction reduces SOC detection dwell time, making this a high-priority intervention target.
                </p>
              </div>

              {/* Mitigating Countermeasures */}
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400 font-medium">Candidate Mitigating Controls:</span>
                {p.mitigatingControls.map((ctrlId: string) => {
                  const ctrl = scenario.controls.find((c: ControlRecord) => c.control_id === ctrlId);
                  const isDeployed = selectedControlIds.includes(ctrlId);

                  return (
                    <span
                      key={ctrlId}
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono border ${
                        isDeployed
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-semibold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400'
                      }`}
                    >
                      {isDeployed ? '✓' : '○'} {ctrl?.control_name || ctrlId} (Cost: {ctrl?.deployment_cost || 5})
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

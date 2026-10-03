import React from 'react';
import { CyberScenario, NetworkNode } from '../types/cyber';
import { Shield, Target, AlertTriangle, Crosshair } from 'lucide-react';

interface ScenarioOverviewProps {
  scenario: CyberScenario;
  entryNode?: NetworkNode;
  crownJewelNode?: NetworkNode;
  totalRisk: number;
  residualRisk: number;
}

export const ScenarioOverview: React.FC<ScenarioOverviewProps> = ({
  scenario,
  entryNode,
  crownJewelNode,
  totalRisk,
  residualRisk,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-100">{scenario.name}</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
              {scenario.sector}
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            {scenario.description}
          </p>
        </div>

        {/* Threat Actor & Target Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/40 px-3 py-1.5 rounded-lg text-red-300">
            <Crosshair className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase text-red-400 font-semibold block">Adversary Profile</span>
              <span className="font-medium">{scenario.threatActor}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-900/40 px-3 py-1.5 rounded-lg text-amber-300">
            <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase text-amber-400 font-semibold block">Crown Jewel</span>
              <span className="font-medium">{crownJewelNode?.label || scenario.crownJewelNodeId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
        <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg">
          <span className="text-slate-400 block mb-1 text-[11px]">Compromised Ingress</span>
          <span className="text-slate-200 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            {entryNode?.label || scenario.entryPointNodeId}
          </span>
          <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">{entryNode?.ip}</span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg">
          <span className="text-slate-400 block mb-1 text-[11px]">Total Graph Assets</span>
          <span className="text-slate-200 font-semibold text-sm font-mono">
            {scenario.nodes.length} Nodes · {scenario.edges.length} Transitions
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">MITRE Enterprise ATT&CK</span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg">
          <span className="text-slate-400 block mb-1 text-[11px]">Defensive Controls Available</span>
          <span className="text-slate-200 font-semibold text-sm font-mono">
            {scenario.defensiveControls.length} Candidate Controls
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">2^{scenario.defensiveControls.length} Optimization Space</span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg">
          <span className="text-slate-400 block mb-1 text-[11px]">Cumulative Threat Exposure</span>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold font-mono text-amber-300">{residualRisk}</span>
            <span className="text-[11px] text-slate-500">/ {totalRisk} Base Risk</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${totalRisk > 0 ? (residualRisk / totalRisk) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

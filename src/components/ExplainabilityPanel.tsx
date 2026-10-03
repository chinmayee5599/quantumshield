import React from 'react';
import { ExplanationReport } from '../core/explainer';
import { ShieldCheck, ShieldAlert, CheckCircle, AlertTriangle, ArrowRight, Activity } from 'lucide-react';

interface ExplainabilityPanelProps {
  explanation: ExplanationReport;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ explanation }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Defensive Reasoning & Choke-Point Disruption Analysis
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">
            Efficiency: <strong className="text-cyan-300">{explanation.costEfficiencyRatio}x</strong>
          </span>
          <span className="text-slate-700">|</span>
          <span
            className={`font-semibold ${
              explanation.crownJewelSecured ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {explanation.crownJewelSecured ? 'Crown Jewel Fortified' : 'Residual Path Open'}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4 text-xs">
        {/* Executive Analyst Briefing */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="font-semibold text-slate-200 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Optimization Summary</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">
            {explanation.summary}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            {explanation.defenseInDepthVerdict}
          </div>
        </div>

        {/* Choke Points Disrupted Cards */}
        <div>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
            Primary Choke Points Neutralized
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {explanation.chokePointsDisrupted.map((cp, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-200">{cp.controlName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                      {cp.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2 font-sans">
                    {cp.impactDescription}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="text-emerald-400 font-semibold">
                    Cuts {cp.pathsSevered.length} attack chains
                  </span>
                  <span>Mitigates {cp.riskScoreSaved} Risk pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Residual Risk or Unmitigated Paths */}
        {explanation.unmitigatedVulnerabilities.length > 0 && (
          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg">
            <div className="flex items-center gap-2 text-red-300 font-semibold mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Unmitigated Residual Vectors ({explanation.unmitigatedVulnerabilities.length})</span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono">
              {explanation.unmitigatedVulnerabilities.map((un, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 text-slate-300">
                  <span>{un.pathName} ({un.unmitigatedEdge})</span>
                  <span className="text-red-400 font-bold shrink-0">Risk: {un.residualRisk}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

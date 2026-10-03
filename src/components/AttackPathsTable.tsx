import React from 'react';
import { AttackPath } from '../types/cyber';
import { ShieldCheck, ShieldAlert, ChevronRight } from 'lucide-react';

interface AttackPathsTableProps {
  paths: AttackPath[];
  selectedPathId?: string;
  onHoverPath: (edgeIds: string[]) => void;
  onLeavePath: () => void;
  onSelectPath: (path: AttackPath) => void;
}

export const AttackPathsTable: React.FC<AttackPathsTableProps> = ({
  paths,
  selectedPathId,
  onHoverPath,
  onLeavePath,
  onSelectPath,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Identified Attack Paths & Exploit Chains
          </span>
          <span className="text-xs font-mono text-slate-400">({paths.length} detected)</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Sorted by composite risk impact
        </span>
      </div>

      <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
              <th className="py-2.5 px-4 w-12 font-mono">ID</th>
              <th className="py-2.5 px-4">Attack Sequence & Choke Points</th>
              <th className="py-2.5 px-4 text-right font-mono">Exploit Prob</th>
              <th className="py-2.5 px-4 text-right font-mono">Risk Metric</th>
              <th className="py-2.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paths.map(path => {
              const isSelected = path.id === selectedPathId;

              return (
                <tr
                  key={path.id}
                  onMouseEnter={() => onHoverPath(path.edges)}
                  onMouseLeave={onLeavePath}
                  onClick={() => onSelectPath(path)}
                  className={`cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? 'bg-cyan-950/30'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 px-4 text-slate-400 font-semibold">{path.id.replace('path_', 'P')}</td>
                  <td className="py-2.5 px-4 font-sans">
                    <div className="text-slate-200 font-medium text-xs flex items-center gap-1.5 flex-wrap">
                      {path.name.replace(/^Path \d+: /, '')}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-lg">
                      {path.mitreTechniques.join(' · ')}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-300">
                    {(path.cumulativeProbability * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span
                      className={`font-bold ${
                        path.riskScore >= 75
                          ? 'text-red-400'
                          : path.riskScore >= 50
                          ? 'text-amber-400'
                          : 'text-cyan-400'
                      }`}
                    >
                      {path.riskScore}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {path.severed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded font-sans">
                        <ShieldCheck className="w-3 h-3 shrink-0" />
                        <span>Cut by {path.severedByControls[0] || 'Defense'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-950/40 border border-red-800/60 px-2 py-0.5 rounded font-sans">
                        <ShieldAlert className="w-3 h-3 shrink-0" />
                        <span>Active Exposure</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

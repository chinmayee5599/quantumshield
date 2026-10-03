import React from 'react';
import { DefensiveControl } from '../types/cyber';
import { Check, Shield, Wrench } from 'lucide-react';

interface DefensiveControlsListProps {
  controls: DefensiveControl[];
  activeControlIds: string[];
  onToggleControl: (controlId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const DefensiveControlsList: React.FC<DefensiveControlsListProps> = ({
  controls,
  activeControlIds,
  onToggleControl,
  onSelectAll,
  onClearAll,
}) => {
  const getCategoryColor = (cat: DefensiveControl['category']) => {
    switch (cat) {
      case 'Identity':
        return 'text-purple-400 bg-purple-950/40 border-purple-800/60';
      case 'Network':
        return 'text-blue-400 bg-blue-950/40 border-blue-800/60';
      case 'Patch':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      case 'ZeroTrust':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60';
      default:
        return 'text-slate-400 bg-slate-800/60 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Candidate Defensive Controls (Optimization Variables)
          </span>
          <span className="text-xs font-mono text-cyan-400">
            ({activeControlIds.length}/{controls.length} active)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onSelectAll}
            className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={onClearAll}
            className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto">
        {controls.map((ctrl, idx) => {
          const isActive = activeControlIds.includes(ctrl.id);

          return (
            <div
              key={ctrl.id}
              onClick={() => onToggleControl(ctrl.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 border-cyan-500/50 shadow-sm shadow-cyan-950/20'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      q{idx}
                    </span>
                    <span className="font-semibold text-xs text-slate-200">
                      {ctrl.name}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      isActive
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {ctrl.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[11px] font-mono">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-sans border ${getCategoryColor(
                    ctrl.category
                  )}`}
                >
                  {ctrl.category}
                </span>

                <div className="flex items-center gap-3 text-slate-400">
                  <span>Cost: <strong className="text-slate-200">{ctrl.implementationCost}</strong></span>
                  <span>Friction: <strong className="text-slate-200">{ctrl.operationalFriction}</strong></span>
                  <span>Cuts: <strong className="text-cyan-400">{ctrl.mitigatesEdges.length} edges</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

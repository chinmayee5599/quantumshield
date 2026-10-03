import React from 'react';
import {
  ShieldAlert,
  Network,
  Activity,
  Sliders,
  Cpu,
  Scale,
  FileText,
  FlaskConical,
  Database,
  CheckCircle2,
} from 'lucide-react';

export type DashboardTab =
  | 'overview'
  | 'attack-graph'
  | 'risk-analysis'
  | 'optimization'
  | 'quantum-lab'
  | 'comparison'
  | 'explainability'
  | 'experiments';

interface NavigationProps {
  currentTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  selectedScenarioId: 'small' | 'financial' | 'large';
  onScenarioChange: (id: 'small' | 'financial' | 'large') => void;
  isOptimizing: boolean;
  onRunOptimization: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  selectedScenarioId,
  onScenarioChange,
  isOptimizing,
  onRunOptimization,
}) => {
  const tabs: Array<{ id: DashboardTab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'overview', label: 'Overview', icon: ShieldAlert },
    { id: 'attack-graph', label: 'Attack Graph', icon: Network },
    { id: 'risk-analysis', label: 'Risk Analysis', icon: Activity },
    { id: 'optimization', label: 'Optimization', icon: Sliders },
    { id: 'quantum-lab', label: 'Quantum Lab', icon: Cpu, badge: 'QAOA' },
    { id: 'comparison', label: 'Comparison', icon: Scale },
    { id: 'explainability', label: 'Explainability', icon: FileText },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      {/* Top Banner: Branding + Scenario Switcher + Global Action */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Cpu className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold tracking-tight text-white">
                Quantum<span className="text-cyan-400">Shield</span>
              </span>
              <span className="rounded border border-slate-700/60 bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                SOC v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Hybrid Quantum-Classical Defensive Cybersecurity Platform
            </p>
          </div>
        </div>

        {/* Center: Scenario Selection */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
          <span className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-400">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            Topology:
          </span>
          <button
            onClick={() => onScenarioChange('financial')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
              selectedScenarioId === 'financial'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Financial Banking Core (Flagship)
          </button>
          <button
            onClick={() => onScenarioChange('small')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
              selectedScenarioId === 'small'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Small Enterprise
          </button>
          <button
            onClick={() => onScenarioChange('large')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
              selectedScenarioId === 'large'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Telco & Cloud Core
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Analysis Ready</span>
          </div>

          <button
            onClick={onRunOptimization}
            disabled={isOptimizing}
            className="flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all hover:bg-cyan-500 active:scale-95 disabled:opacity-50"
          >
            <Cpu className={`h-4 w-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Optimizing QAOA...' : 'Run QAOA & Classical'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="flex space-x-1 overflow-x-auto py-1 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800/80 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="rounded bg-cyan-500/10 px-1.5 py-0.2 text-[9px] font-mono text-cyan-400 border border-cyan-500/20">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

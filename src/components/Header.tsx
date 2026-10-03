import React from 'react';
import { CyberScenario } from '../types/cyber';
import { ShieldCheck, BookOpen, Layers, Cpu } from 'lucide-react';

interface HeaderProps {
  scenarios: CyberScenario[];
  selectedScenario: CyberScenario;
  onSelectScenario: (scenario: CyberScenario) => void;
  onOpenDocs: () => void;
  numQubits: number;
  totalPaths: number;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  selectedScenario,
  onSelectScenario,
  onOpenDocs,
  numQubits,
  totalPaths,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">QuantumShield</span>
              <span className="text-xs font-mono text-cyan-400 font-medium">v1.0-PoC</span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Hybrid QAOA & QUBO Optimization for Attack-Path Defense
            </p>
          </div>
        </div>

        {/* Center / Scenario Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {scenarios.map(sc => {
            const active = sc.id === selectedScenario.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sc.sector}
              </button>
            );
          })}
        </div>

        {/* Right Info & Documentation */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-md border border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{numQubits} Qubits</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalPaths} Attack Chains</span>
            </span>
          </div>

          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Architecture & Proof</span>
          </button>
        </div>
      </div>
    </header>
  );
};

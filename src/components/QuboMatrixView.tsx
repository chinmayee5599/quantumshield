import React, { useState } from 'react';
import { IsingHamiltonian, QuboProblem } from '../types/quantum';
import { Binary, Sliders, Hash } from 'lucide-react';

interface QuboMatrixViewProps {
  qubo: QuboProblem;
  ising: IsingHamiltonian;
  costWeight: number;
  riskWeight: number;
  onChangeWeights: (cost: number, risk: number) => void;
}

export const QuboMatrixView: React.FC<QuboMatrixViewProps> = ({
  qubo,
  ising,
  costWeight,
  riskWeight,
  onChangeWeights,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number; val: number } | null>(null);
  const [viewMode, setViewMode] = useState<'qubo' | 'ising'>('qubo');

  // Find min and max for color normalization
  let minVal = 0;
  let maxVal = 0;
  for (let i = 0; i < qubo.numVariables; i++) {
    for (let j = 0; j < qubo.numVariables; j++) {
      const v = viewMode === 'qubo' ? qubo.matrix[i][j] : ising.J[i][j];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
  }

  const getCellColor = (val: number) => {
    if (Math.abs(val) < 1e-4) return 'bg-slate-900 text-slate-600';
    if (val < 0) {
      // Negative: favorable/rewarding (emerald / cyan)
      const intensity = Math.min(1, Math.abs(val) / (Math.abs(minVal) || 1));
      return intensity > 0.5
        ? 'bg-cyan-900/70 text-cyan-200 border-cyan-700/50'
        : 'bg-cyan-950/40 text-cyan-300 border-cyan-900/40';
    } else {
      // Positive: penalty (amber / red)
      const intensity = Math.min(1, val / (maxVal || 1));
      return intensity > 0.5
        ? 'bg-amber-900/70 text-amber-200 border-amber-700/50'
        : 'bg-amber-950/40 text-amber-300 border-amber-900/40';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {viewMode === 'qubo' ? 'QUBO Matrix Representation Q_ij' : 'Ising Spin Coupling Matrix J_ij'}
          </span>
          <span className="text-xs font-mono text-slate-400">
            ({qubo.numVariables}×{qubo.numVariables})
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('qubo')}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'qubo' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            QUBO (x_i ∈ {'{0,1}'})
          </button>
          <button
            onClick={() => setViewMode('ising')}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'ising' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ising (Z_i ∈ {'{-1,+1}'})
          </button>
        </div>
      </div>

      {/* Trade-off Sliders */}
      <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Cost Penalty (α):</span>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={costWeight}
            onChange={e => onChangeWeights(parseFloat(e.target.value), riskWeight)}
            className="w-24 accent-cyan-400 cursor-pointer"
          />
          <span className="text-cyan-300 font-bold">{costWeight.toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">Risk Weight (β):</span>
          <input
            type="range"
            min="0.01"
            max="0.2"
            step="0.01"
            value={riskWeight}
            onChange={e => onChangeWeights(costWeight, parseFloat(e.target.value))}
            className="w-24 accent-cyan-400 cursor-pointer"
          />
          <span className="text-cyan-300 font-bold">{riskWeight.toFixed(2)}</span>
        </div>

        <div className="text-[11px] text-slate-500">
          Offset C₀: <span className="text-slate-300">{qubo.constantOffset.toFixed(2)}</span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="p-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid gap-1 font-mono text-[11px]" style={{ gridTemplateColumns: `repeat(${qubo.numVariables + 1}, minmax(44px, 1fr))` }}>
            {/* Header row */}
            <div className="h-8 flex items-center justify-center text-slate-500 font-bold">Q</div>
            {qubo.variableNames.map((name, idx) => (
              <div
                key={`col-${idx}`}
                className="h-8 flex items-center justify-center text-slate-400 font-semibold bg-slate-950/60 rounded"
                title={name}
              >
                q{idx}
              </div>
            ))}

            {/* Matrix rows */}
            {Array.from({ length: qubo.numVariables }).map((_, i) => (
              <React.Fragment key={`row-${i}`}>
                <div className="h-8 flex items-center justify-center text-slate-400 font-semibold bg-slate-950/60 rounded">
                  q{i}
                </div>
                {Array.from({ length: qubo.numVariables }).map((_, j) => {
                  const val = viewMode === 'qubo' ? qubo.matrix[i][j] : ising.J[i][j];
                  const isDiag = i === j;
                  const isUpper = j >= i;

                  return (
                    <div
                      key={`cell-${i}-${j}`}
                      onMouseEnter={() => setHoveredCell({ i, j, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-8 border flex items-center justify-center rounded transition-transform cursor-pointer ${
                        !isUpper && viewMode === 'qubo'
                          ? 'opacity-25 bg-slate-950/40 border-slate-900 text-slate-700'
                          : getCellColor(val)
                      } ${isDiag ? 'font-bold underline decoration-cyan-500' : ''}`}
                    >
                      {Math.abs(val) > 1e-3 ? val.toFixed(1) : '·'}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Hover inspector tooltip */}
        <div className="mt-3 min-h-[32px] text-xs font-mono text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-2 px-1">
          {hoveredCell ? (
            <div>
              <span className="text-cyan-400">
                {viewMode === 'qubo' ? `Q[q${hoveredCell.i}, q${hoveredCell.j}]` : `J[q${hoveredCell.i}, q${hoveredCell.j}]`}
              </span>
              {' = '}
              <span className="font-bold text-white">{hoveredCell.val.toFixed(4)}</span>
              {' · '}
              <span className="text-slate-400">
                {hoveredCell.i === hoveredCell.j
                  ? `Linear cost/reward for ${qubo.variableNames[hoveredCell.i]}`
                  : `Redundancy interaction penalty between ${qubo.variableNames[hoveredCell.i]} and ${qubo.variableNames[hoveredCell.j]}`}
              </span>
            </div>
          ) : (
            <span className="text-slate-500 text-[11px]">
              Hover any cell to inspect linear control costs (diagonal) or pairwise redundancy penalties (off-diagonal).
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

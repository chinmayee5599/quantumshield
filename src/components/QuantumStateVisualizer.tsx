import React, { useState } from 'react';
import { QuantumMeasurementDistribution, QuboProblem } from '../types/quantum';
import { BarChart3, Waves, CheckCircle2, AlertCircle } from 'lucide-react';
import { QaoaSimulator } from '../core/qaoaSimulator';

interface QuantumStateVisualizerProps {
  qubo: QuboProblem;
  topMeasurements: QuantumMeasurementDistribution[];
  groundStateOverlap: number;
}

export const QuantumStateVisualizer: React.FC<QuantumStateVisualizerProps> = ({
  qubo,
  topMeasurements,
  groundStateOverlap,
}) => {
  const [activeTab, setActiveTab] = useState<'histogram' | 'landscape'>('histogram');
  const [landscapeData, setLandscapeData] = useState<{
    gammaValues: number[];
    betaValues: number[];
    energyGrid: number[][];
  } | null>(null);

  // Lazy compute landscape only if requested
  const handleLoadLandscape = () => {
    if (!landscapeData) {
      const sim = new QaoaSimulator(qubo);
      const data = sim.generateEnergyLandscape([0.1, 3.14], [0.1, 1.57], 14);
      setLandscapeData(data);
    }
    setActiveTab('landscape');
  };

  const maxProb = topMeasurements.length > 0 ? Math.max(...topMeasurements.map(m => m.probability)) : 1;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Quantum Wavefunction & Energy Surface
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('histogram')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'histogram'
                ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Measurement Distribution
          </button>
          <button
            onClick={handleLoadLandscape}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'landscape'
                ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2D Energy Landscape (γ, β)
          </button>
        </div>
      </div>

      <div className="p-5">
        {activeTab === 'histogram' ? (
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
              <span>Top Measured Computational Basis States |x⟩</span>
              <span>
                Ground State Sampling Weight: <strong className="text-emerald-400">{(groundStateOverlap * 100).toFixed(1)}%</strong>
              </span>
            </div>

            <div className="space-y-2.5">
              {topMeasurements.map((m, idx) => {
                const widthPercent = (m.probability / (maxProb || 1)) * 100;
                const isOptimal = idx === 0;

                return (
                  <div
                    key={m.bitstring}
                    className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                      isOptimal
                        ? 'bg-slate-950 border-cyan-500/40'
                        : 'bg-slate-950/40 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">|{m.bitstring}⟩</span>
                        <span className="text-[11px] text-slate-400 font-sans truncate max-w-xs">
                          {m.decodedControls.length > 0 ? m.decodedControls.join(' + ') : 'No Controls'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-slate-400">
                          E: <strong className="text-slate-200">{m.quboEnergy}</strong>
                        </span>
                        <span className="text-slate-400">
                          Cost: <strong className="text-slate-200">{m.cost}</strong>
                        </span>
                        <span className="text-cyan-400 font-semibold">
                          {(m.probability * 100).toFixed(1)}% ({m.count} shots)
                        </span>
                        {m.isValid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </div>
                    </div>

                    {/* Probability Bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOptimal ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-600'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs text-slate-400 mb-3">
              Variational surface grid evaluating &lt;H_C(γ, β)&gt; across angles γ ∈ [0.1, π] and β ∈ [0.1, π/2]. Minima (dark cyan) represent optimal quantum parameter states.
            </div>

            {landscapeData && (
              <div className="overflow-x-auto">
                <div
                  className="grid gap-1 font-mono text-[9px] min-w-[400px]"
                  style={{ gridTemplateColumns: `repeat(${landscapeData.betaValues.length}, 1fr)` }}
                >
                  {landscapeData.energyGrid.map((row, i) =>
                    row.map((energy, j) => {
                      // Normalize energy for heatmap
                      const allEnergies = landscapeData.energyGrid.flat();
                      const minE = Math.min(...allEnergies);
                      const maxE = Math.max(...allEnergies);
                      const norm = (energy - minE) / (maxE - minE || 1);

                      return (
                        <div
                          key={`ls-${i}-${j}`}
                          title={`γ=${landscapeData.gammaValues[i]}, β=${landscapeData.betaValues[j]} -> <H_C>=${energy}`}
                          className="h-6 rounded flex items-center justify-center cursor-pointer transition-transform hover:scale-125 hover:z-10"
                          style={{
                            backgroundColor: `rgba(6, 182, 212, ${1 - norm * 0.85})`,
                            color: norm > 0.5 ? '#e2e8f0' : '#020617',
                          }}
                        >
                          {energy.toFixed(0)}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
                  <span>← β (Mixer Angle) →</span>
                  <span>← γ (Problem Angle) →</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

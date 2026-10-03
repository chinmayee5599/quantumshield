import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Navigation, DashboardTab } from './components/Navigation';
import { OverviewView } from './components/OverviewView';
import { AttackGraphView } from './components/AttackGraphView';
import { RiskAnalysisView } from './components/RiskAnalysisView';
import { OptimizationView } from './components/OptimizationView';
import { QuantumLabView } from './components/QuantumLabView';
import { ComparisonView } from './components/ComparisonView';
import { ExplainabilityView } from './components/ExplainabilityView';
import { ExperimentsView } from './components/ExperimentsView';

import { getScenario } from './data/dataAccess';
import { analyzeScenarioGraph } from './core/attackGraph';
import { DefensiveControl } from './core/controls/types';
import { DEFAULT_QUBO_WEIGHTS, QuboBuilder } from './core/qubo';
import { ClassicalOptimizerBaseline } from './core/classical';
import { ClassicalOptimizationResult } from './core/classical/types';
import { QaoaEngine } from './core/quantum';
import { QaoaOptimizationResult } from './core/quantum/types';
import { BenchmarkEngine } from './core/benchmarking';
import { ExperimentRecord } from './core/benchmarking/types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<DashboardTab>('overview');
  const [scenarioId, setScenarioId] = useState<'small' | 'financial' | 'large'>('financial');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [budgetConstraint, setBudgetConstraint] = useState<number | undefined>(undefined);

  // Active scenario data
  const scenario = useMemo(() => {
    return getScenario(scenarioId) || getScenario('financial')!;
  }, [scenarioId]);

  // Attack graph discovery & risk calculation
  const graphAnalysis = useMemo(() => {
    return analyzeScenarioGraph(scenario);
  }, [scenario]);

  // Candidate defensive controls
  const controls: DefensiveControl[] = useMemo(() => {
    return scenario.controls.map(c => ({
      controlId: c.control_id,
      name: c.control_name,
      category: c.control_category as any,
      description: c.description,
      deploymentCost: c.deployment_cost,
      operationalFriction: c.operational_friction,
      affectedAssetIds: c.affected_asset_types,
      affectedEdgeIds: c.affected_edges,
      implementationAssumptions: c.implementation_assumption,
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    }));
  }, [scenario]);

  // Dynamic QUBO Hamiltonian instance
  const qubo = useMemo(() => {
    return QuboBuilder.buildQubo(
      controls,
      graphAnalysis.paths,
      DEFAULT_QUBO_WEIGHTS,
      budgetConstraint
    );
  }, [controls, graphAnalysis.paths, budgetConstraint]);

  // Solver solutions state
  const [classicalExact, setClassicalExact] = useState<ClassicalOptimizationResult | undefined>(undefined);
  const [classicalGreedy, setClassicalGreedy] = useState<ClassicalOptimizationResult | undefined>(undefined);
  const [classicalSA, setClassicalSA] = useState<ClassicalOptimizationResult | undefined>(undefined);
  const [qaoaSolution, setQaoaSolution] = useState<QaoaOptimizationResult | undefined>(undefined);

  // Active manually toggled or optimizer-selected controls
  const [selectedControlIds, setSelectedControlIds] = useState<string[]>([]);

  // Current Experiment Record
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentRecord>(() => {
    return BenchmarkEngine.runExperiment('financial', { qaoaDepthP: 2, qaoaShots: 1024 }, 42);
  });

  // Re-run optimization when scenario changes or button clicked
  const runFullOptimization = useCallback(
    (depthP = 2, shots = 1024, seed = 42, customBudget?: number) => {
      setIsOptimizing(true);

      // Async yield to allow UI loading state to paint
      setTimeout(() => {
        try {
          const exp = BenchmarkEngine.runExperiment(
            scenarioId,
            {
              qaoaDepthP: depthP,
              qaoaShots: shots,
              budgetConstraint: customBudget ?? budgetConstraint,
            },
            seed
          );

          setCurrentExperiment(exp);
          setClassicalExact(exp.classicalExactResult);
          setClassicalGreedy(exp.classicalGreedyResult);
          setClassicalSA(exp.classicalSaResult);
          setQaoaSolution(exp.qaoaResult);

          // Apply QAOA optimal controls to active state
          setSelectedControlIds(exp.qaoaResult.selectedControlIds);
        } catch (err) {
          console.error('Optimization error:', err);
        } finally {
          setIsOptimizing(false);
        }
      }, 50);
    },
    [scenarioId, budgetConstraint]
  );

  // Initialize solutions on scenario change
  useEffect(() => {
    runFullOptimization(2, 1024, 42);
  }, [scenarioId]);

  // Control toggling
  const handleToggleControl = (controlId: string) => {
    setSelectedControlIds(prev =>
      prev.includes(controlId) ? prev.filter(id => id !== controlId) : [...prev, controlId]
    );
  };

  const handleApplyOptimal = (solver: 'qaoa' | 'classical') => {
    if (solver === 'qaoa' && qaoaSolution) {
      setSelectedControlIds(qaoaSolution.selectedControlIds);
    } else if (solver === 'classical' && classicalExact) {
      setSelectedControlIds(classicalExact.selectedControlIds);
    }
  };

  const handleResetControls = () => {
    setSelectedControlIds([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Dark SOC Navigation Header */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedScenarioId={scenarioId}
        onScenarioChange={id => setScenarioId(id)}
        isOptimizing={isOptimizing}
        onRunOptimization={() => runFullOptimization(2, 1024, 42)}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {currentTab === 'overview' && (
          <OverviewView
            scenario={scenario}
            graphAnalysis={graphAnalysis}
            classicalSolution={classicalExact || classicalSA}
            qaoaSolution={qaoaSolution}
            onNavigate={setCurrentTab}
            onRunOptimization={() => runFullOptimization(2, 1024, 42)}
            isOptimizing={isOptimizing}
          />
        )}

        {currentTab === 'attack-graph' && (
          <AttackGraphView
            scenario={scenario}
            graphAnalysis={graphAnalysis}
            selectedControlIds={selectedControlIds}
          />
        )}

        {currentTab === 'risk-analysis' && (
          <RiskAnalysisView
            scenario={scenario}
            graphAnalysis={graphAnalysis}
            selectedControlIds={selectedControlIds}
          />
        )}

        {currentTab === 'optimization' && (
          <OptimizationView
            scenario={scenario}
            graphAnalysis={graphAnalysis}
            classicalSolution={classicalExact || classicalSA}
            qaoaSolution={qaoaSolution}
            selectedControlIds={selectedControlIds}
            onToggleControl={handleToggleControl}
            onApplyOptimal={handleApplyOptimal}
            onResetControls={handleResetControls}
            budgetConstraint={budgetConstraint}
            onBudgetChange={b => {
              setBudgetConstraint(b);
              runFullOptimization(2, 1024, 42, b);
            }}
          />
        )}

        {currentTab === 'quantum-lab' && (
          <QuantumLabView
            scenario={scenario}
            graphAnalysis={graphAnalysis}
            qubo={qubo}
            qaoaSolution={qaoaSolution}
            onRunQaoa={(p, s, seed) => runFullOptimization(p, s, seed)}
            isOptimizing={isOptimizing}
          />
        )}

        {currentTab === 'comparison' && (
          <ComparisonView
            scenario={scenario}
            graphAnalysis={graphAnalysis}
            classicalExact={classicalExact}
            classicalGreedy={classicalGreedy}
            classicalSA={classicalSA}
            qaoaResult={qaoaSolution}
          />
        )}

        {currentTab === 'explainability' && (
          <ExplainabilityView
            scenario={scenario}
            graphAnalysis={graphAnalysis}
            selectedControlIds={selectedControlIds}
          />
        )}

        {currentTab === 'experiments' && (
          <ExperimentsView
            currentExperiment={currentExperiment}
            onRunNewExperiment={(scId, p, s, b) => {
              setScenarioId(scId);
              runFullOptimization(p, s, 42, b);
            }}
            onSelectExperiment={exp => {
              setCurrentExperiment(exp);
              setClassicalExact(exp.classicalExactResult);
              setClassicalGreedy(exp.classicalGreedyResult);
              setClassicalSA(exp.classicalSaResult);
              setQaoaSolution(exp.qaoaResult);
              setSelectedControlIds(exp.qaoaResult.selectedControlIds);
            }}
            isOptimizing={isOptimizing}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <p>
          QuantumShield SOC Platform · Hybrid Quantum-Classical Attack Graph Risk Optimization
        </p>
        <p className="mt-1 text-[11px] text-slate-600">
          Experimental NISQ QAOA Emulation & Classical Baselines · Standardized Cybersecurity Research Architecture
        </p>
      </footer>
    </div>
  );
}

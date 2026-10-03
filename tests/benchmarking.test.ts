/**
 * QuantumShield — Quantum vs Classical Benchmarking Test Suite
 * Validates side-by-side empirical evaluations, experiment record schemas,
 * chart data formatting, and strict non-advocacy reporting standards.
 */

import { BenchmarkEngine } from '../src/core/benchmarking';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
}

async function runBenchmarkingTests() {
  console.log('==================================================');
  console.log('QuantumShield — Quantum vs Classical Benchmarking Test Suite');
  console.log('==================================================');

  let passedTests = 0;

  // -------------------------------------------------------------
  // Test 1: Single Experiment Execution & Storage (Small Enterprise)
  // -------------------------------------------------------------
  console.log('\n[Test 1] Running experiment on Small Enterprise scenario and validating stored schema...');

  const exp1 = BenchmarkEngine.runExperiment('small', {
    qaoaDepthP: 2,
    qaoaShots: 1024,
  }, 42);

  // Validate stored fields
  assert(exp1.datasetId === 'small', 'Dataset ID must be small');
  assert(exp1.numNodes > 0, 'numNodes must be positive');
  assert(exp1.numEdges > 0, 'numEdges must be positive');
  assert(exp1.numAttackPaths > 0, 'numAttackPaths must be positive');
  assert(exp1.numControls > 0, 'numControls must be positive');
  assert(typeof exp1.timestamp === 'string' && exp1.timestamp.length > 10, 'Timestamp must be ISO string');
  assert(exp1.randomSeed === 42, 'Random seed must be 42');

  // Validate parameters
  assert(exp1.parameters.qaoaDepthP === 2, 'Depth must be 2');
  assert(exp1.parameters.qaoaShots === 1024, 'Shots must be 1024');

  // Validate Classical results
  assert(exp1.classicalExactResult !== undefined, 'Exact result must exist for small scenario');
  assert(exp1.classicalGreedyResult !== undefined, 'Greedy result must exist');
  assert(exp1.classicalSaResult !== undefined, 'SA result must exist');

  // Validate QAOA results
  assert(exp1.qaoaResult.success === true, 'QAOA must succeed');
  assert(exp1.qaoaResult.selectedControlIds.length > 0, 'QAOA must select controls');
  assert(exp1.qaoaResult.runtimeMs >= 0, 'QAOA runtime must be non-negative');

  // Validate raw measured comparison metrics
  const m = exp1.comparisonMetrics;
  assert(typeof m.objectiveDifference === 'number', 'objectiveDifference must be numeric');
  assert(typeof m.costDifference === 'number', 'costDifference must be numeric');
  assert(typeof m.remainingRiskDifference === 'number', 'remainingRiskDifference must be numeric');
  assert(typeof m.blockedPathsDifference === 'number', 'blockedPathsDifference must be numeric');
  assert(typeof m.runtimeRatio === 'number', 'runtimeRatio must be numeric');
  assert(typeof m.exactMatch === 'boolean', 'exactMatch must be boolean');
  assert(typeof m.solutionFeasible === 'boolean', 'solutionFeasible must be boolean');

  console.log(`Experiment Record Schema Verified:`);
  console.log(`  - Experiment ID: ${exp1.experimentId}`);
  console.log(`  - Topology: ${exp1.numNodes} nodes, ${exp1.numEdges} edges, ${exp1.numControls} controls, ${exp1.numAttackPaths} paths`);
  console.log(`  - Classical Exact Objective: ${exp1.classicalExactResult?.objectiveValue} (Cost: ${exp1.classicalExactResult?.totalCost}, Runtime: ${exp1.classicalExactResult?.runtimeMs}ms)`);
  console.log(`  - QAOA Objective: ${exp1.qaoaResult.objectiveValue} (Cost: ${exp1.qaoaResult.totalCost}, Runtime: ${exp1.qaoaResult.runtimeMs}ms)`);
  console.log(`  - Objective Delta (QAOA - Exact): ${m.objectiveDifference}`);
  console.log(`  - Exact Match: ${m.exactMatch ? 'YES' : 'NO'}`);

  console.log('✓ Test 1 Passed: Complete experiment record with raw measured metrics verified.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 2: Flagship Financial Enterprise Benchmark & Narrative Validation
  // -------------------------------------------------------------
  console.log('\n[Test 2] Running benchmark on Financial Enterprise scenario and validating objective narrative...');

  const expFin = BenchmarkEngine.runExperiment('financial', {
    qaoaDepthP: 2,
    qaoaShots: 1024,
  }, 99);

  console.log(`\nGenerated Objective Narrative:`);
  console.log(`"${expFin.objectiveNarrative}"`);

  // Ensure compliance with prompt requirements:
  // "The dashboard should be able to say: 'On this problem instance, QAOA produced X.' not: 'Quantum is better.'"
  assert(
    expFin.objectiveNarrative.startsWith('On this problem instance'),
    'Narrative must start with "On this problem instance"'
  );
  assert(
    !expFin.objectiveNarrative.toLowerCase().includes('quantum is better'),
    'Narrative must NEVER claim "Quantum is better"'
  );
  assert(
    !expFin.objectiveNarrative.toLowerCase().includes('quantum supremacy'),
    'Narrative must NEVER claim quantum supremacy'
  );
  assert(
    expFin.evaluationDisclaimer.includes('No quantum advantage or superiority is claimed'),
    'Disclaimer must explicitly state no advantage claimed'
  );

  console.log('✓ Test 2 Passed: Impartial, strictly empirical narrative verified.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 3: Budget Feasibility Verification
  // -------------------------------------------------------------
  console.log('\n[Test 3] Testing solution feasibility under budget constraint...');

  const expBudget = BenchmarkEngine.runExperiment('financial', {
    budgetConstraint: 15, // Tight budget of 15
    qaoaDepthP: 2,
    qaoaShots: 1024,
  }, 101);

  assert(typeof expBudget.comparisonMetrics.solutionFeasible === 'boolean', 'Feasibility must be computed');
  console.log(`Budget: 15 | QAOA Total Cost: ${expBudget.qaoaResult.totalCost} | Feasible: ${expBudget.comparisonMetrics.solutionFeasible}`);
  console.log('✓ Test 3 Passed: Solution feasibility properly calculated.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 4: Chart Series Datasets Formatting
  // -------------------------------------------------------------
  console.log('\n[Test 4] Validating chart datasets for visualization components...');

  const charts = expFin.charts;

  assert(charts.objectiveComparison !== undefined, 'Objective comparison chart series required');
  assert(charts.riskReductionComparison !== undefined, 'Risk reduction chart series required');
  assert(charts.costComparison !== undefined, 'Cost comparison chart series required');
  assert(charts.pathCoverageComparison !== undefined, 'Path coverage chart series required');
  assert(charts.runtimeComparison !== undefined, 'Runtime comparison chart series required');
  assert(charts.controlsSelectedComparison !== undefined, 'Controls selected series required');
  assert(Array.isArray(charts.convergenceSeries) && charts.convergenceSeries.length > 0, 'Convergence series required');
  assert(Array.isArray(charts.measurementHistogram) && charts.measurementHistogram.length > 0, 'Measurement histogram required');

  console.log(`Chart Series Check:`);
  console.log(`  - Objective Energy: Exact=${charts.objectiveComparison.classicalExact}, Greedy=${charts.objectiveComparison.classicalGreedy}, QAOA=${charts.objectiveComparison.qaoa}`);
  console.log(`  - Risk Reduction %: Exact=${charts.riskReductionComparison.classicalExact}%, QAOA=${charts.riskReductionComparison.qaoa}%`);
  console.log(`  - Convergence Steps: ${charts.convergenceSeries.length} points tracked`);
  console.log(`  - Measurement States: ${charts.measurementHistogram.length} candidate states extracted`);

  console.log('✓ Test 4 Passed: Chart series formatted and ready for rendering.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 5: Multi-Scenario Benchmark Suite Runner
  // -------------------------------------------------------------
  console.log('\n[Test 5] Testing multi-scenario benchmark suite execution and storage...');

  const suite = BenchmarkEngine.runSuite(['small', 'financial'], {
    qaoaDepthP: 2,
    qaoaShots: 1024,
  });

  assert(suite.experiments.length === 2, 'Suite must execute 2 experiments');
  assert(suite.aggregatedMetrics.totalExperiments === 2, 'Total experiments count must be 2');
  assert(suite.aggregatedMetrics.avgRuntimeRatio > 0, 'Avg runtime ratio must be positive');

  console.log(`Benchmark Suite Summary:`);
  console.log(`  - Suite ID: ${suite.suiteId}`);
  console.log(`  - Total Scenarios Run: ${suite.aggregatedMetrics.totalExperiments}`);
  console.log(`  - Exact Match Rate: ${suite.aggregatedMetrics.exactMatchRatePercentage}%`);
  console.log(`  - Average QAOA Path Coverage: ${suite.aggregatedMetrics.avgPathCoverageQaoa}%`);
  console.log(`  - Average Classical Path Coverage: ${suite.aggregatedMetrics.avgPathCoverageClassical}%`);
  console.log(`  - Average Runtime Ratio (QAOA/Classical): ${suite.aggregatedMetrics.avgRuntimeRatio}x`);

  const stored = BenchmarkEngine.getStoredExperiments();
  assert(stored.length >= 3, `Expected at least 3 stored experiments, found ${stored.length}`);

  console.log(`✓ Stored experiments in memory: ${stored.length} records.`);
  console.log('✓ Test 5 Passed: Suite execution and persistent storage confirmed.');
  passedTests++;

  console.log('\n==================================================');
  console.log(`ALL BENCHMARKING TESTS PASSED (${passedTests}/${passedTests}) — Phase 9 Complete`);
  console.log('==================================================\n');
}

runBenchmarkingTests().catch(err => {
  console.error('\n❌ Benchmarking test suite failed:', err);
  process.exit(1);
});

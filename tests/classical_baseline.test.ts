/**
 * QuantumShield — Classical Optimization Baseline Test Suite
 * Validates exact binary enumeration, greedy descent, and simulated annealing against
 * hand-calculated ground truth benchmarks and real enterprise scenarios.
 */

import { AttackPathResult } from '../src/core/attackGraph/types';
import { analyzeScenarioGraph } from '../src/core/attackGraph';
import { ClassicalOptimizerBaseline } from '../src/core/classical';
import { DefensiveControl } from '../src/core/controls/types';
import { QuboBuilder } from '../src/core/qubo';
import { getScenario } from '../src/data/dataAccess';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
}

async function runClassicalBaselineTests() {
  console.log('==================================================');
  console.log('QuantumShield — Classical Optimization Baseline Test Suite');
  console.log('==================================================');

  let passedTests = 0;

  // -------------------------------------------------------------
  // Test 1: Known 2-Variable Benchmark Instance
  // -------------------------------------------------------------
  console.log('\n[Test 1] Testing exact enumeration on known 2-variable benchmark instance...');

  const controls2: DefensiveControl[] = [
    {
      controlId: 'ctrl_opt_a',
      name: 'Cost-Effective Control A',
      category: 'Patch_Vulnerability',
      description: 'Cheap patch',
      deploymentCost: 10,
      operationalFriction: 0,
      affectedAssetIds: ['a1'],
      affectedEdgeIds: ['edge_1'],
      implementationAssumptions: 'Patch deployed',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
    {
      controlId: 'ctrl_sub_b',
      name: 'Expensive Control B',
      category: 'Network_Segmentation',
      description: 'Overpriced firewall',
      deploymentCost: 50,
      operationalFriction: 0,
      affectedAssetIds: ['a1'],
      affectedEdgeIds: ['edge_1'],
      implementationAssumptions: 'Redundant firewall',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
  ];

  const paths2: AttackPathResult[] = [
    {
      pathId: 'path_1',
      name: 'Attack Path 1',
      entryPointId: 'entry',
      crownJewelId: 'target',
      nodeSequence: ['entry', 'target'],
      edgeSequence: ['edge_1'],
      length: 1,
      cumulativeProbability: 1.0,
      maxCvssScore: 9.0,
      avgCvssScore: 9.0,
      compositeRiskScore: 90,
      mitigatingControls: ['ctrl_opt_a', 'ctrl_sub_b'],
      chokePoints: [],
      steps: [],
    },
  ];

  const qubo2 = QuboBuilder.buildQubo(controls2, paths2, {
    costWeight: 1.0,
    pathPenaltyWeight: 1.0,
  });

  const exactRes1 = ClassicalOptimizerBaseline.solve(qubo2, controls2, paths2, 'exact_enumeration');

  console.log(`Exact Enumeration Result (2 Variables):`);
  console.log(`  - Selected Controls: ${exactRes1.selectedControlIds.join(', ')}`);
  console.log(`  - Objective Value: ${exactRes1.objectiveValue}`);
  console.log(`  - Total Cost: ${exactRes1.totalCost}`);
  console.log(`  - Remaining Risk: ${exactRes1.remainingRisk}`);
  console.log(`  - Blocked Paths: ${exactRes1.blockedHighRiskPathsCount} of ${exactRes1.totalPathsCount}`);
  console.log(`  - Runtime: ${exactRes1.runtimeMs}ms (States: ${exactRes1.statesEvaluated})`);

  // Verify exact ground truth
  assert(exactRes1.bitstring === '10', `Bitstring must be '10', got ${exactRes1.bitstring}`);
  assert(exactRes1.selectedControlIds.length === 1 && exactRes1.selectedControlIds[0] === 'ctrl_opt_a', 'Must select Control A');
  assert(exactRes1.objectiveValue === 10, `Objective must be exactly 10, got ${exactRes1.objectiveValue}`);
  assert(exactRes1.totalCost === 10, `Total cost must be 10, got ${exactRes1.totalCost}`);
  assert(exactRes1.remainingRisk === 0, `Remaining risk must be 0, got ${exactRes1.remainingRisk}`);
  assert(exactRes1.blockedHighRiskPathsCount === 1, 'Path 1 must be blocked');
  assert(exactRes1.isGlobalOptimumVerified === true, 'Global optimum must be verified');

  console.log('✓ Test 1 Passed: Exact binary enumeration matches hand-calculated ground truth.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 2: Known 3-Variable Choke-Point Instance
  // -------------------------------------------------------------
  console.log('\n[Test 2] Testing choke-point selection across 3 variables (8 binary states)...');

  const controls3: DefensiveControl[] = [
    {
      controlId: 'ctrl_pt1',
      name: 'Point Control 1',
      category: 'Patch_Vulnerability',
      description: 'Point patch 1',
      deploymentCost: 8,
      operationalFriction: 0,
      affectedAssetIds: ['a1'],
      affectedEdgeIds: ['edge_pt1'],
      implementationAssumptions: 'Patch',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
    {
      controlId: 'ctrl_pt2',
      name: 'Point Control 2',
      category: 'Firewall_Rule',
      description: 'Point firewall 2',
      deploymentCost: 7,
      operationalFriction: 0,
      affectedAssetIds: ['a2'],
      affectedEdgeIds: ['edge_pt2'],
      implementationAssumptions: 'Firewall',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
    {
      controlId: 'ctrl_choke',
      name: 'Choke Point Proxy',
      category: 'Access_Policy',
      description: 'Choke proxy',
      deploymentCost: 10,
      operationalFriction: 0,
      affectedAssetIds: ['target'],
      affectedEdgeIds: ['edge_choke'],
      implementationAssumptions: 'Proxy',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
  ];

  const paths3: AttackPathResult[] = [
    {
      pathId: 'p1',
      name: 'Attack Path 1',
      entryPointId: 'e1',
      crownJewelId: 'target',
      nodeSequence: ['e1', 'target'],
      edgeSequence: ['edge_pt1', 'edge_choke'],
      length: 2,
      cumulativeProbability: 0.8,
      maxCvssScore: 8.0,
      avgCvssScore: 8.0,
      compositeRiskScore: 80,
      mitigatingControls: ['ctrl_pt1', 'ctrl_choke'],
      chokePoints: ['edge_choke'],
      steps: [],
    },
    {
      pathId: 'p2',
      name: 'Attack Path 2',
      entryPointId: 'e2',
      crownJewelId: 'target',
      nodeSequence: ['e2', 'target'],
      edgeSequence: ['edge_pt2', 'edge_choke'],
      length: 2,
      cumulativeProbability: 0.85,
      maxCvssScore: 8.5,
      avgCvssScore: 8.5,
      compositeRiskScore: 85,
      mitigatingControls: ['ctrl_pt2', 'ctrl_choke'],
      chokePoints: ['edge_choke'],
      steps: [],
    },
  ];

  const qubo3 = QuboBuilder.buildQubo(controls3, paths3, { costWeight: 1.0, pathPenaltyWeight: 1.0 });
  const exactRes2 = ClassicalOptimizerBaseline.solve(qubo3, controls3, paths3, 'exact_enumeration');

  console.log(`Exact Enumeration Result (3 Variables):`);
  console.log(`  - Selected Controls: ${exactRes2.selectedControlIds.join(', ')}`);
  console.log(`  - Objective Value: ${exactRes2.objectiveValue}`);
  console.log(`  - Total Cost: ${exactRes2.totalCost}`);
  console.log(`  - Remaining Risk: ${exactRes2.remainingRisk}`);
  console.log(`  - Blocked Paths: ${exactRes2.blockedHighRiskPathsCount} of ${exactRes2.totalPathsCount}`);

  assert(exactRes2.bitstring === '001', `Bitstring must be '001' (Choke Control), got ${exactRes2.bitstring}`);
  assert(exactRes2.selectedControlIds[0] === 'ctrl_choke', 'Must select choke control');
  assert(exactRes2.objectiveValue === 10, 'Objective must be 10');
  assert(exactRes2.totalCost === 10, 'Cost must be 10');
  assert(exactRes2.remainingRisk === 0, 'Remaining risk must be 0');
  assert(exactRes2.blockedHighRiskPathsCount === 2, 'Both paths must be blocked');

  console.log('✓ Test 2 Passed: Choke point control correctly chosen over multiple point solutions.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 3: Greedy and Simulated Annealing Verification
  // -------------------------------------------------------------
  console.log('\n[Test 3] Verifying Greedy and Simulated Annealing solvers on benchmark instances...');

  const greedyRes = ClassicalOptimizerBaseline.solve(qubo3, controls3, paths3, 'greedy_heuristic');
  const saRes = ClassicalOptimizerBaseline.solve(qubo3, controls3, paths3, 'simulated_annealing');

  console.log(`Greedy Heuristic: H = ${greedyRes.objectiveValue}, Bitstring: [${greedyRes.bitstring}], Cost: ${greedyRes.totalCost}, Runtime: ${greedyRes.runtimeMs}ms`);
  console.log(`Simulated Annealing: H = ${saRes.objectiveValue}, Bitstring: [${saRes.bitstring}], Cost: ${saRes.totalCost}, Runtime: ${saRes.runtimeMs}ms`);

  assert(greedyRes.objectiveValue === exactRes2.objectiveValue, 'Greedy solver must achieve global optimum on 3-variable instance');
  assert(saRes.objectiveValue === exactRes2.objectiveValue, 'Simulated annealing must achieve global optimum on 3-variable instance');

  console.log('✓ Test 3 Passed: Greedy and Simulated Annealing verified on benchmark instances.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 4: Real Flagship Enterprise Scenario — Financial Enterprise (10 Variables)
  // -------------------------------------------------------------
  console.log('\n[Test 4] Running comprehensive classical benchmark on Financial Enterprise scenario (10 controls, 8 paths)...');

  const finScenario = getScenario('financial')!;
  const finGraphAnalysis = analyzeScenarioGraph(finScenario);

  const finControls: DefensiveControl[] = finScenario.controls.map(c => ({
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

  const finQubo = QuboBuilder.buildQubo(finControls, finGraphAnalysis.paths, {
    costWeight: 1.0,
    pathPenaltyWeight: 2.0,
  });

  const benchmarkReport = ClassicalOptimizerBaseline.benchmarkAll(
    finQubo,
    finControls,
    finGraphAnalysis.paths
  );

  console.log(`Financial Enterprise Classical Benchmark Summary:`);
  console.log(`  Problem Size: ${benchmarkReport.numVariables} variables, ${benchmarkReport.numPaths} attack paths`);
  console.log(`  Best Solver Method: ${benchmarkReport.bestMethod}`);

  if (benchmarkReport.exactResult) {
    const ex = benchmarkReport.exactResult;
    console.log(`\n  [1] Exact Binary Enumeration (Ground Truth):`);
    console.log(`      - Objective Value: ${ex.objectiveValue}`);
    console.log(`      - Selected Controls (${ex.selectedControls.length}): ${ex.selectedControlIds.join(', ')}`);
    console.log(`      - Total Deployment Cost: ${ex.totalCost}`);
    console.log(`      - Remaining Risk: ${ex.remainingRisk} of ${ex.initialRisk} (${ex.riskReductionPercentage}% reduced)`);
    console.log(`      - Blocked High-Risk Paths: ${ex.blockedHighRiskPathsCount} of ${ex.totalPathsCount}`);
    console.log(`      - Measured Runtime: ${ex.runtimeMs}ms (${ex.statesEvaluated} states evaluated)`);

    assert(ex.allPathsBlocked === true, 'Exact solver must neutralize 100% of attack paths in financial enterprise');
    assert(ex.remainingRisk === 0, 'Remaining risk must be 0 in optimal solution');
    assert(ex.runtimeMs >= 0, 'Runtime must be non-negative');
  }

  const gr = benchmarkReport.greedyResult;
  console.log(`\n  [2] Greedy Coordinate Descent:`);
  console.log(`      - Objective Value: ${gr.objectiveValue} (Gap: ${benchmarkReport.optimalityGaps.greedyGapPercentage}%)`);
  console.log(`      - Total Deployment Cost: ${gr.totalCost}`);
  console.log(`      - Remaining Risk: ${gr.remainingRisk}`);
  console.log(`      - Measured Runtime: ${gr.runtimeMs}ms`);

  const sa = benchmarkReport.simulatedAnnealingResult;
  console.log(`\n  [3] Classical Simulated Annealing:`);
  console.log(`      - Objective Value: ${sa.objectiveValue} (Gap: ${benchmarkReport.optimalityGaps.saGapPercentage}%)`);
  console.log(`      - Total Deployment Cost: ${sa.totalCost}`);
  console.log(`      - Remaining Risk: ${sa.remainingRisk}`);
  console.log(`      - Measured Runtime: ${sa.runtimeMs}ms`);

  assert(benchmarkReport.exactResult !== undefined, 'Exact result must be populated for N=10');
  assert(sa.allPathsBlocked === true, 'Simulated annealing must also neutralize 100% of attack paths');

  console.log('\n✓ Test 4 Passed: Real flagship financial scenario benchmarked with measured empirical results.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 5: Auto-Routing & Scalability Assertion
  // -------------------------------------------------------------
  console.log('\n[Test 5] Verifying ClassicalOptimizerBaseline auto-routing...');

  const autoResult = ClassicalOptimizerBaseline.solve(finQubo, finControls, finGraphAnalysis.paths);
  assert(autoResult.solverType === 'exact_enumeration', 'N=10 should auto-route to exact enumeration');
  assert(autoResult.objectiveValue === benchmarkReport.exactResult?.objectiveValue, 'Auto-routed result must match exact');

  console.log(`✓ Auto-router selected '${autoResult.solverName}' in ${autoResult.runtimeMs}ms.`);
  console.log('✓ Test 5 Passed: Unified interface and auto-routing confirmed.');
  passedTests++;

  console.log('\n==================================================');
  console.log(`ALL CLASSICAL BASELINE TESTS PASSED (${passedTests}/${passedTests}) — Phase 7 Complete`);
  console.log('==================================================\n');
}

runClassicalBaselineTests().catch(err => {
  console.error('\n❌ Classical baseline test suite failed:', err);
  process.exit(1);
});

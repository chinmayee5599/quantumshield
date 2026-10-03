/**
 * QuantumShield — QUBO Optimization Engine Test Suite
 * Validates the QUBO formulation, matrix construction, cost-penalty trade-offs,
 * risk prioritization, and exact classical solver optimality against hand-calculated states.
 */

import { AttackPathResult } from '../src/core/attackGraph/types';
import { analyzeScenarioGraph } from '../src/core/attackGraph';
import { DefensiveControl } from '../src/core/controls/types';
import { QuboBuilder, QuboClassicalSolver } from '../src/core/qubo';
import { getScenario } from '../src/data/dataAccess';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
}

async function runQuboTests() {
  console.log('==================================================');
  console.log('QuantumShield — QUBO Formulation Test Suite');
  console.log('==================================================');

  let passedTests = 0;

  // -------------------------------------------------------------
  // Test 1: Tiny 2-Variable Exhaustive Benchmark (Cost vs Penalty Trade-off)
  // -------------------------------------------------------------
  console.log('\n[Test 1] Testing tiny 2-variable QUBO instance (Cost trade-off & redundancy penalty)...');

  // Control A: Cost 10 (severs Path 1)
  // Control B: Cost 50 (severs Path 1)
  // Path 1: Risk 90
  const tinyControls1: DefensiveControl[] = [
    {
      controlId: 'ctrl_cheap',
      name: 'Cost-Effective Control A',
      category: 'Patch_Vulnerability',
      description: 'Cheap patch',
      deploymentCost: 10,
      operationalFriction: 0,
      affectedAssetIds: ['asset_1'],
      affectedEdgeIds: ['edge_1'],
      implementationAssumptions: 'Patch deployed',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
    {
      controlId: 'ctrl_expensive',
      name: 'Expensive Control B',
      category: 'Network_Segmentation',
      description: 'Costly overhaul',
      deploymentCost: 50,
      operationalFriction: 0,
      affectedAssetIds: ['asset_1'],
      affectedEdgeIds: ['edge_1'],
      implementationAssumptions: 'Redundant firewall',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
  ];

  const tinyPaths1: AttackPathResult[] = [
    {
      pathId: 'path_1',
      name: 'Test Path 1',
      entryPointId: 'entry',
      crownJewelId: 'target',
      nodeSequence: ['entry', 'target'],
      edgeSequence: ['edge_1'],
      length: 1,
      cumulativeProbability: 1.0,
      maxCvssScore: 9.0,
      avgCvssScore: 9.0,
      compositeRiskScore: 90,
      mitigatingControls: ['ctrl_cheap', 'ctrl_expensive'],
      chokePoints: [],
      steps: [],
    },
  ];

  const qubo1 = QuboBuilder.buildQubo(tinyControls1, tinyPaths1, {
    costWeight: 1.0,
    pathPenaltyWeight: 1.0,
  });

  assert(qubo1.numVariables === 2, 'Must have 2 variables');
  assert(qubo1.constantOffset === 90, `Constant offset expected 90, got ${qubo1.constantOffset}`);

  // Diagonal checks:
  // Q_00 = cost(10) - penalty(90) = -80
  // Q_11 = cost(50) - penalty(90) = -40
  // Q_01 = 2 * penalty(90) = +180 (redundancy penalty)
  assert(qubo1.matrix[0][0] === -80, `Q_00 expected -80, got ${qubo1.matrix[0][0]}`);
  assert(qubo1.matrix[1][1] === -40, `Q_11 expected -40, got ${qubo1.matrix[1][1]}`);
  assert(qubo1.matrix[0][1] === 180, `Q_01 expected 180, got ${qubo1.matrix[0][1]}`);

  // Manual enumeration of all 4 states:
  // [0, 0]: H = 0 + 90 = 90
  // [1, 0]: H = -80 + 90 = 10 (OPTIMAL!)
  // [0, 1]: H = -40 + 90 = 50
  // [1, 1]: H = -80 - 40 + 180 + 90 = 150
  const solution1 = QuboClassicalSolver.solveExhaustive(qubo1, tinyControls1, tinyPaths1);

  assert(solution1.bitstring === '10', `Optimal bitstring must be '10' (Control A), got ${solution1.bitstring}`);
  assert(solution1.objectiveValue === 10, `Optimal objective value must be 10, got ${solution1.objectiveValue}`);
  assert(solution1.selectedControlIds.length === 1 && solution1.selectedControlIds[0] === 'ctrl_cheap', 'Must select cheap control');
  assert(solution1.allPathsBlocked === true, 'Path 1 must be blocked');

  console.log(`✓ State [1, 0] confirmed optimal with H(x) = ${solution1.objectiveValue} (vs [0,0]=90, [0,1]=50, [1,1]=150).`);
  console.log(`✓ Test 1 Passed: 2-variable cost vs penalty trade-off mathematically verified.`);
  passedTests++;

  // -------------------------------------------------------------
  // Test 2: Choke Point Selection (3 Controls, 2 Paths)
  // -------------------------------------------------------------
  console.log('\n[Test 2] Testing choke-point selection across 3 variables (8 binary states)...');

  // Control 1 (Cost 8): covers Path 1 only
  // Control 2 (Cost 7): covers Path 2 only
  // Control 3 (Cost 10): Choke control covers BOTH Path 1 and Path 2!
  const tinyControls2: DefensiveControl[] = [
    {
      controlId: 'ctrl_p1',
      name: 'Path 1 Point Solution',
      category: 'Patch_Vulnerability',
      description: 'Covers edge 1',
      deploymentCost: 8,
      operationalFriction: 0,
      affectedAssetIds: ['a1'],
      affectedEdgeIds: ['edge_p1'],
      implementationAssumptions: 'Point patch',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
    {
      controlId: 'ctrl_p2',
      name: 'Path 2 Point Solution',
      category: 'Firewall_Rule',
      description: 'Covers edge 2',
      deploymentCost: 7,
      operationalFriction: 0,
      affectedAssetIds: ['a2'],
      affectedEdgeIds: ['edge_p2'],
      implementationAssumptions: 'Point firewall',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
    {
      controlId: 'ctrl_choke',
      name: 'Choke Point Zero-Trust Proxy',
      category: 'Access_Policy',
      description: 'Covers edge 3 (shared bottleneck)',
      deploymentCost: 10,
      operationalFriction: 0,
      affectedAssetIds: ['target'],
      affectedEdgeIds: ['edge_choke'],
      implementationAssumptions: 'Shared gateway',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
  ];

  const tinyPaths2: AttackPathResult[] = [
    {
      pathId: 'p1',
      name: 'Attack Path 1',
      entryPointId: 'e1',
      crownJewelId: 'target',
      nodeSequence: ['e1', 'mid', 'target'],
      edgeSequence: ['edge_p1', 'edge_choke'],
      length: 2,
      cumulativeProbability: 0.8,
      maxCvssScore: 8.0,
      avgCvssScore: 8.0,
      compositeRiskScore: 80,
      mitigatingControls: ['ctrl_p1', 'ctrl_choke'],
      chokePoints: ['edge_choke'],
      steps: [],
    },
    {
      pathId: 'p2',
      name: 'Attack Path 2',
      entryPointId: 'e2',
      crownJewelId: 'target',
      nodeSequence: ['e2', 'mid', 'target'],
      edgeSequence: ['edge_p2', 'edge_choke'],
      length: 2,
      cumulativeProbability: 0.85,
      maxCvssScore: 8.5,
      avgCvssScore: 8.5,
      compositeRiskScore: 85,
      mitigatingControls: ['ctrl_p2', 'ctrl_choke'],
      chokePoints: ['edge_choke'],
      steps: [],
    },
  ];

  const qubo2 = QuboBuilder.buildQubo(tinyControls2, tinyPaths2, {
    costWeight: 1.0,
    pathPenaltyWeight: 1.0,
  });

  const solution2 = QuboClassicalSolver.solveExhaustive(qubo2, tinyControls2, tinyPaths2);

  // Manual enumeration:
  // Selecting Control 1 + Control 2: Cost = 8 + 7 = 15.
  // Selecting Control 3 alone: Cost = 10.
  // Optimal is Control 3 alone (bitstring '001') with objective = 10!
  assert(solution2.bitstring === '001', `Optimal state must be '001' (Choke Control), got ${solution2.bitstring}`);
  assert(solution2.selectedControlIds.includes('ctrl_choke'), 'Choke point control must be selected');
  assert(solution2.selectedControlIds.length === 1, 'Only the choke point control should be selected');
  assert(solution2.allPathsBlocked === true, 'All paths must be blocked by choke control');
  assert(solution2.objectiveValue === 10, `Optimal objective value must be 10, got ${solution2.objectiveValue}`);

  console.log(`✓ Choke point control selected alone: Cost = 10 vs 15 for two separate point solutions.`);
  console.log(`✓ Test 2 Passed: Multi-path choke-point optimization verified.`);
  passedTests++;

  // -------------------------------------------------------------
  // Test 3: High-Risk vs Low-Risk Prioritization under Tight Budget
  // -------------------------------------------------------------
  console.log('\n[Test 3] Testing risk prioritization under budget constraint...');

  const priorityControls: DefensiveControl[] = [
    {
      controlId: 'ctrl_high',
      name: 'High Risk Mitigator',
      category: 'Patch_Vulnerability',
      description: 'Mitigates Path High',
      deploymentCost: 10,
      operationalFriction: 0,
      affectedAssetIds: ['a_hi'],
      affectedEdgeIds: ['edge_hi'],
      implementationAssumptions: 'Patch',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
    {
      controlId: 'ctrl_low',
      name: 'Low Risk Mitigator',
      category: 'Firewall_Rule',
      description: 'Mitigates Path Low',
      deploymentCost: 10,
      operationalFriction: 0,
      affectedAssetIds: ['a_lo'],
      affectedEdgeIds: ['edge_lo'],
      implementationAssumptions: 'Firewall',
      mitigationType: 'complete_severance',
      attenuationFactor: 1.0,
    },
  ];

  const priorityPaths: AttackPathResult[] = [
    {
      pathId: 'p_critical',
      name: 'Critical Path to Vault',
      entryPointId: 'e',
      crownJewelId: 'vault',
      nodeSequence: ['e', 'vault'],
      edgeSequence: ['edge_hi'],
      length: 1,
      cumulativeProbability: 1.0,
      maxCvssScore: 10.0,
      avgCvssScore: 10.0,
      compositeRiskScore: 100, // CRITICAL RISK
      mitigatingControls: ['ctrl_high'],
      chokePoints: [],
      steps: [],
    },
    {
      pathId: 'p_minor',
      name: 'Minor Lateral Path',
      entryPointId: 'e',
      crownJewelId: 'test_server',
      nodeSequence: ['e', 'test_server'],
      edgeSequence: ['edge_lo'],
      length: 1,
      cumulativeProbability: 0.4,
      maxCvssScore: 4.0,
      avgCvssScore: 4.0,
      compositeRiskScore: 15, // MINOR RISK
      mitigatingControls: ['ctrl_low'],
      chokePoints: [],
      steps: [],
    },
  ];

  // Under budget of 10, optimizer can only afford ONE control
  const quboBudget = QuboBuilder.buildQubo(
    priorityControls,
    priorityPaths,
    { costWeight: 1.0, pathPenaltyWeight: 2.0, budgetPenaltyWeight: 5.0 },
    10 // Budget = 10
  );

  const solutionBudget = QuboClassicalSolver.solveExhaustive(quboBudget, priorityControls, priorityPaths);

  assert(
    solutionBudget.selectedControlIds.includes('ctrl_high'),
    'Optimizer must prioritize the high-risk control (ctrl_high) over ctrl_low'
  );
  assert(
    !solutionBudget.selectedControlIds.includes('ctrl_low'),
    'Optimizer must omit ctrl_low due to budget limit'
  );

  console.log(`✓ Optimizer prioritized 'ctrl_high' (Risk: 100) over 'ctrl_low' (Risk: 15) under budget constraint.`);
  console.log('✓ Test 3 Passed: Risk-weighted prioritization under budget validated.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 4: Determinism & Mathematical Formulation Exposure
  // -------------------------------------------------------------
  console.log('\n[Test 4] Verifying determinism and mathematical formulation exposure...');

  const runA = QuboBuilder.buildQubo(tinyControls2, tinyPaths2);
  const runB = QuboBuilder.buildQubo(tinyControls2, tinyPaths2);

  assert(JSON.stringify(runA.matrix) === JSON.stringify(runB.matrix), 'QUBO matrices must be identical');
  assert(runA.constantOffset === runB.constantOffset, 'Offsets must be identical');
  assert(runA.mathematicalFormulation.length > 50, 'Mathematical formulation string must be exposed');

  console.log('Sample Mathematical Formulation:');
  console.log(runA.mathematicalFormulation.split('\n').slice(0, 8).join('\n'));
  console.log('✓ Test 4 Passed: Deterministic QUBO generation confirmed.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 5: Real Flagship Enterprise Scenario — Financial Enterprise (10 Variables)
  // -------------------------------------------------------------
  console.log('\n[Test 5] Dynamically formulating and solving QUBO on Financial Enterprise scenario (10 controls, 8 paths)...');
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

  assert(finQubo.numVariables === 10, `Expected 10 variables, got ${finQubo.numVariables}`);
  assert(finQubo.matrix.length === 10, 'Matrix must be 10x10');
  assert(finQubo.variables.length === 10, 'Variables array must have 10 entries');

  const finSolution = QuboClassicalSolver.solveExhaustive(finQubo, finControls, finGraphAnalysis.paths);

  console.log(`Financial Enterprise QUBO Optimal Solution:`);
  console.log(`  Bitstring: [${finSolution.bitstring}]`);
  console.log(`  Objective Value: ${finSolution.objectiveValue}`);
  console.log(`  Selected Controls (${finSolution.selectedControlIds.length}): ${finSolution.selectedControlIds.join(', ')}`);
  console.log(`  Blocked Attack Paths: ${finSolution.blockedPathsCount} of ${finSolution.totalPathsCount}`);
  console.log(`  All Threats Blocked: ${finSolution.allPathsBlocked ? 'YES (100%)' : 'NO'}`);
  console.log(`  Solver Execution Time: ${finSolution.executionTimeMs}ms (2^10 = 1024 states evaluated)`);

  assert(finSolution.selectedControlIds.length >= 2, 'Must select at least 2 controls to fortify financial enterprise');
  assert(finSolution.blockedPathsCount === finSolution.totalPathsCount, 'All 8 attack paths must be blocked in global optimum');
  assert(finSolution.allPathsBlocked === true, 'All Crown Jewel paths must be severed');
  assert(finSolution.analystExplanation.length >= 3, 'Must generate analyst explanations');

  console.log('\nAnalyst Explanation ("Why was this control selected?"):');
  finSolution.analystExplanation.forEach(line => console.log(`  • ${line}`));

  console.log('✓ Test 5 Passed: Flagship scenario successfully solved with full explainability.');
  passedTests++;

  console.log('\n==================================================');
  console.log(`ALL QUBO TESTS PASSED (${passedTests}/${passedTests}) — Phase 6 Complete`);
  console.log('==================================================\n');
}

runQuboTests().catch(err => {
  console.error('\n❌ QUBO test suite failed:', err);
  process.exit(1);
});

/**
 * QuantumShield — Defensive Control Model Test Suite
 * Validates the 8 defensive control archetypes, deterministic control-to-edge-to-path mappings,
 * graph state changes upon intervention, and Crown Jewel protection assertions.
 */

import { AttackGraph, AttackPathResult } from '../src/core/attackGraph/types';
import { analyzeScenarioGraph } from '../src/core/attackGraph';
import {
  DefensiveControl,
  DefensiveControlCategory,
  DefensiveControlModel,
  ENTERPRISE_DEFENSIVE_CONTROLS_CATALOG,
} from '../src/core/controls';
import { getScenario } from '../src/data/dataAccess';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
}

async function runControlModelTests() {
  console.log('==================================================');
  console.log('QuantumShield — Defensive Control Model Test Suite');
  console.log('==================================================');

  let passedTests = 0;

  // -------------------------------------------------------------
  // Test 1: Catalog Integrity & All 8 Archetypes
  // -------------------------------------------------------------
  console.log('\n[Test 1] Verifying defensive control catalog and 8 core archetypes...');
  const catalog = ENTERPRISE_DEFENSIVE_CONTROLS_CATALOG;
  assert(catalog.length >= 8, `Expected >= 8 controls in catalog, found ${catalog.length}`);

  const requiredCategories: DefensiveControlCategory[] = [
    'Multi_Factor_Authentication',
    'Network_Segmentation',
    'Patch_Vulnerability',
    'Disable_Vulnerable_Service',
    'Restrict_Privilege',
    'Firewall_Rule',
    'Access_Policy',
    'Account_Hardening',
  ];

  for (const cat of requiredCategories) {
    const found = catalog.find(c => c.category === cat);
    assert(found !== undefined, `Missing required control category in catalog: ${cat}`);
    assert(found?.deploymentCost! > 0, `Cost must be > 0 for ${cat}`);
    assert(found?.operationalFriction! >= 0, `Friction must be >= 0 for ${cat}`);
    assert(found?.affectedEdgeIds.length! > 0, `Affected edge IDs missing for ${cat}`);
    assert(found?.implementationAssumptions.length! > 10, `Implementation assumptions missing for ${cat}`);
  }

  console.log(`✓ Test 1 Passed: All 8 required defensive control categories verified with costs and assumptions.`);
  passedTests++;

  // -------------------------------------------------------------
  // Test 2: Known Graph State Change & Path Severance Verification
  // -------------------------------------------------------------
  console.log('\n[Test 2] Testing graph state change and path severance on known topology...');

  // Setup: 2 entries, 2 targets, 4 paths
  // Entry1, Entry2 -> NodeA -> NodeB -> Target1
  // NodeB -> NodeC -> Target2
  const knownGraph: AttackGraph = {
    id: 'test_control_graph',
    name: 'Control Verification Graph',
    nodes: [
      { id: 'Entry1', name: 'Entry 1', label: 'E1', nodeType: 'endpoint', tier: 'dmz', networkZone: 'perimeter_dmz', criticality: 'HIGH', assetValue: 50, isEntryPoint: true, isCrownJewel: false, assignedCves: [], ipAddress: '10.0.1.1', operatingEnv: 'Router', description: 'Entry 1' },
      { id: 'Entry2', name: 'Entry 2', label: 'E2', nodeType: 'endpoint', tier: 'dmz', networkZone: 'perimeter_dmz', criticality: 'HIGH', assetValue: 50, isEntryPoint: true, isCrownJewel: false, assignedCves: [], ipAddress: '10.0.1.2', operatingEnv: 'Router', description: 'Entry 2' },
      { id: 'NodeA', name: 'Node A', label: 'A', nodeType: 'server', tier: 'internal', networkZone: 'corporate_lan', criticality: 'MEDIUM', assetValue: 60, isEntryPoint: false, isCrownJewel: false, assignedCves: [], ipAddress: '10.0.10.1', operatingEnv: 'Linux', description: 'Node A' },
      { id: 'NodeB', name: 'Node B', label: 'B', nodeType: 'service', tier: 'internal', networkZone: 'corporate_lan', criticality: 'MEDIUM', assetValue: 65, isEntryPoint: false, isCrownJewel: false, assignedCves: [], ipAddress: '10.0.10.2', operatingEnv: 'Node.js', description: 'Node B' },
      { id: 'NodeC', name: 'Node C', label: 'C', nodeType: 'database', tier: 'internal', networkZone: 'corporate_lan', criticality: 'MEDIUM', assetValue: 70, isEntryPoint: false, isCrownJewel: false, assignedCves: [], ipAddress: '10.0.10.3', operatingEnv: 'Redis', description: 'Node C' },
      { id: 'Target1', name: 'Target 1 DB', label: 'T1', nodeType: 'critical_asset', tier: 'crown_jewel', networkZone: 'core_vault', criticality: 'CRITICAL', assetValue: 100, isEntryPoint: false, isCrownJewel: true, assignedCves: [], ipAddress: '10.0.99.1', operatingEnv: 'SQL', description: 'Target 1' },
      { id: 'Target2', name: 'Target 2 Ledger', label: 'T2', nodeType: 'critical_asset', tier: 'crown_jewel', networkZone: 'core_vault', criticality: 'CRITICAL', assetValue: 100, isEntryPoint: false, isCrownJewel: true, assignedCves: [], ipAddress: '10.0.99.2', operatingEnv: 'Oracle', description: 'Target 2' },
    ],
    edges: [
      { id: 'e_e1_a', source: 'Entry1', target: 'NodeA', relationshipType: 'network_traffic', service: 'HTTP', protocol: 'TCP', port: 80, vulnerability: null, exploitLikelihood: 0.8, privilegeRequirement: 'NONE', riskContribution: 5.0, controlOpportunities: ['ctrl_fw_entry1'], controlNames: ['Firewall E1'], description: 'E1 to A' },
      { id: 'e_e2_a', source: 'Entry2', target: 'NodeA', relationshipType: 'vpn_tunnel', service: 'VPN', protocol: 'TCP', port: 443, vulnerability: null, exploitLikelihood: 0.85, privilegeRequirement: 'NONE', riskContribution: 5.5, controlOpportunities: ['ctrl_mfa_e2'], controlNames: ['MFA E2'], description: 'E2 to A' },
      { id: 'e_a_b', source: 'NodeA', target: 'NodeB', relationshipType: 'api_call', service: 'REST', protocol: 'HTTP', port: 8080, vulnerability: null, exploitLikelihood: 0.75, privilegeRequirement: 'LOW', riskContribution: 6.0, controlOpportunities: ['ctrl_seg_lan'], controlNames: ['Segmentation'], description: 'A to B' },
      { id: 'e_b_c', source: 'NodeB', target: 'NodeC', relationshipType: 'database_query', service: 'Cache', protocol: 'TCP', port: 6379, vulnerability: null, exploitLikelihood: 0.70, privilegeRequirement: 'LOW', riskContribution: 5.0, controlOpportunities: [], controlNames: [], description: 'B to C' },
      { id: 'e_b_t1', source: 'NodeB', target: 'Target1', relationshipType: 'database_query', service: 'SQL', protocol: 'TCP', port: 5432, vulnerability: null, exploitLikelihood: 0.90, privilegeRequirement: 'HIGH', riskContribution: 9.0, controlOpportunities: ['ctrl_db_choke'], controlNames: ['DB Choke Proxy'], description: 'B to T1' },
      { id: 'e_c_t2', source: 'NodeC', target: 'Target2', relationshipType: 'database_query', service: 'SQL', protocol: 'TCP', port: 1521, vulnerability: null, exploitLikelihood: 0.85, privilegeRequirement: 'HIGH', riskContribution: 8.5, controlOpportunities: ['ctrl_db_choke'], controlNames: ['DB Choke Proxy'], description: 'C to T2' },
    ],
    entryPointIds: ['Entry1', 'Entry2'],
    crownJewelIds: ['Target1', 'Target2'],
    metadata: { generatedAt: new Date().toISOString(), totalAssets: 7, totalTransitions: 6 },
  };

  const initialPaths: AttackPathResult[] = [
    { pathId: 'p1', name: 'Entry1 -> Target1', entryPointId: 'Entry1', crownJewelId: 'Target1', nodeSequence: ['Entry1', 'NodeA', 'NodeB', 'Target1'], edgeSequence: ['e_e1_a', 'e_a_b', 'e_b_t1'], length: 3, cumulativeProbability: 0.54, maxCvssScore: 6.0, avgCvssScore: 6.0, compositeRiskScore: 75, mitigatingControls: ['ctrl_fw_entry1', 'ctrl_seg_lan', 'ctrl_db_choke'], chokePoints: ['ctrl_db_choke'], steps: [] },
    { pathId: 'p2', name: 'Entry1 -> Target2', entryPointId: 'Entry1', crownJewelId: 'Target2', nodeSequence: ['Entry1', 'NodeA', 'NodeB', 'NodeC', 'Target2'], edgeSequence: ['e_e1_a', 'e_a_b', 'e_b_c', 'e_c_t2'], length: 4, cumulativeProbability: 0.35, maxCvssScore: 6.0, avgCvssScore: 6.0, compositeRiskScore: 68, mitigatingControls: ['ctrl_fw_entry1', 'ctrl_seg_lan', 'ctrl_db_choke'], chokePoints: ['ctrl_db_choke'], steps: [] },
    { pathId: 'p3', name: 'Entry2 -> Target1', entryPointId: 'Entry2', crownJewelId: 'Target1', nodeSequence: ['Entry2', 'NodeA', 'NodeB', 'Target1'], edgeSequence: ['e_e2_a', 'e_a_b', 'e_b_t1'], length: 3, cumulativeProbability: 0.57, maxCvssScore: 6.0, avgCvssScore: 6.0, compositeRiskScore: 78, mitigatingControls: ['ctrl_mfa_e2', 'ctrl_seg_lan', 'ctrl_db_choke'], chokePoints: ['ctrl_db_choke'], steps: [] },
    { pathId: 'p4', name: 'Entry2 -> Target2', entryPointId: 'Entry2', crownJewelId: 'Target2', nodeSequence: ['Entry2', 'NodeA', 'NodeB', 'NodeC', 'Target2'], edgeSequence: ['e_e2_a', 'e_a_b', 'e_b_c', 'e_c_t2'], length: 4, cumulativeProbability: 0.38, maxCvssScore: 6.0, avgCvssScore: 6.0, compositeRiskScore: 70, mitigatingControls: ['ctrl_mfa_e2', 'ctrl_seg_lan', 'ctrl_db_choke'], chokePoints: ['ctrl_db_choke'], steps: [] },
  ];

  const controlsList: DefensiveControl[] = [
    { controlId: 'ctrl_fw_entry1', name: 'Perimeter Firewall E1', category: 'Firewall_Rule', description: 'Blocks E1', deploymentCost: 3, operationalFriction: 1, affectedAssetIds: ['Entry1'], affectedEdgeIds: ['e_e1_a'], implementationAssumptions: 'Drop E1', mitigationType: 'complete_severance', attenuationFactor: 1.0 },
    { controlId: 'ctrl_mfa_e2', name: 'Hardware MFA E2', category: 'Multi_Factor_Authentication', description: 'Blocks E2', deploymentCost: 4, operationalFriction: 2, affectedAssetIds: ['Entry2'], affectedEdgeIds: ['e_e2_a'], implementationAssumptions: 'MFA on E2', mitigationType: 'complete_severance', attenuationFactor: 1.0 },
    { controlId: 'ctrl_seg_lan', name: 'Network Segmentation NodeB', category: 'Network_Segmentation', description: 'Blocks A to B', deploymentCost: 6, operationalFriction: 3, affectedAssetIds: ['NodeA', 'NodeB'], affectedEdgeIds: ['e_a_b'], implementationAssumptions: 'ACL A to B', mitigationType: 'complete_severance', attenuationFactor: 1.0 },
    { controlId: 'ctrl_db_choke', name: 'Zero-Trust DB Choke Proxy', category: 'Access_Policy', description: 'Isolates T1 and T2', deploymentCost: 8, operationalFriction: 4, affectedAssetIds: ['Target1', 'Target2'], affectedEdgeIds: ['e_b_t1', 'e_c_t2'], implementationAssumptions: 'mTLS DB proxy', mitigationType: 'complete_severance', attenuationFactor: 1.0 },
  ];

  // 2.1 Test partial intervention: Apply 'ctrl_fw_entry1'
  const impactE1 = DefensiveControlModel.evaluateControlIntervention(
    ['ctrl_fw_entry1'],
    controlsList,
    knownGraph,
    initialPaths
  );

  assert(impactE1.blockedPathIds.length === 2, `Expected 2 blocked paths from E1, got ${impactE1.blockedPathIds.length}`);
  assert(impactE1.residualPathCount === 2, `Expected 2 residual paths from E2, got ${impactE1.residualPathCount}`);
  assert(impactE1.isCrownJewelProtected === false, 'Crown Jewels should NOT yet be fully protected because E2 paths remain open');
  assert(impactE1.riskReductionPercentage > 0 && impactE1.riskReductionPercentage < 100, 'Partial risk reduction expected');
  console.log(`✓ Partial Intervention (Firewall E1): Blocked ${impactE1.blockedPathIds.length}/4 paths, Residual paths: ${impactE1.residualPathCount}.`);

  // 2.2 Test choke-point intervention: Apply 'ctrl_db_choke'
  const impactChoke = DefensiveControlModel.evaluateControlIntervention(
    ['ctrl_db_choke'],
    controlsList,
    knownGraph,
    initialPaths
  );

  assert(impactChoke.blockedPathIds.length === 4, `Expected all 4 paths blocked by choke control, got ${impactChoke.blockedPathIds.length}`);
  assert(impactChoke.residualPathCount === 0, `Expected 0 residual paths, got ${impactChoke.residualPathCount}`);
  assert(impactChoke.isCrownJewelProtected === true, 'Crown Jewels must be FORTIFIED (100% paths severed)');
  assert(impactChoke.riskReductionPercentage === 100.0, 'Risk reduction must be 100% when all paths are severed');
  assert(impactChoke.costEfficiencyRatio > 0, 'Cost efficiency ratio must be positive');
  console.log(`✓ Choke Intervention (DB Choke Proxy): Blocked ${impactChoke.blockedPathIds.length}/4 paths, Crown Jewel FORTIFIED (100% severed).`);
  console.log('✓ Test 2 Passed: Graph path severance and state modification verified.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 3: Answer Query: "If this control is selected, which paths are blocked?"
  // -------------------------------------------------------------
  console.log('\n[Test 3] Testing simulateSingleControl query interface...');

  const queryResult = DefensiveControlModel.simulateSingleControl(
    'ctrl_seg_lan',
    controlsList,
    knownGraph,
    initialPaths
  );

  assert(queryResult.controlId === 'ctrl_seg_lan', 'Control ID must match');
  assert(queryResult.severedEdgeIds.includes('e_a_b'), 'Must sever edge e_a_b');
  assert(queryResult.blockedPathIds.length === 4, 'e_a_b is an intermediate bottleneck; must block all 4 paths');
  assert(queryResult.blockedPathsSummary.length === 4, 'Must detail all 4 blocked paths');
  assert(queryResult.riskReductionPct === 100.0, 'Risk reduction must be 100%');
  console.log(`Query Answer: ${queryResult.impactSummary}`);
  console.log(`Blocked Paths:`);
  queryResult.blockedPathsSummary.forEach(bp => {
    console.log(`  • ${bp.pathName} (Initial Risk: ${bp.initialRisk}, Severed at step ${bp.severedAtStep} by ${bp.severedEdgeId})`);
  });
  console.log('✓ Test 3 Passed: Interactive single-control query successfully answered.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 4: Real Enterprise Scenario — Financial Enterprise (Flagship)
  // -------------------------------------------------------------
  console.log('\n[Test 4] Testing Defensive Control Model on Financial Enterprise scenario...');
  const finScenario = getScenario('financial')!;
  const finGraphAnalysis = analyzeScenarioGraph(finScenario);

  // Map scenario controls to DefensiveControl format
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

  // Baseline: No controls active
  const baselineImpact = DefensiveControlModel.evaluateControlIntervention(
    [],
    finControls,
    finGraphAnalysis.graph,
    finGraphAnalysis.paths
  );
  assert(baselineImpact.residualPathCount === finGraphAnalysis.paths.length, '0 controls must leave all paths open');
  assert(baselineImpact.isCrownJewelProtected === false, 'Crown Jewel must be exposed at baseline');

  // 1. Partial Mitigation: Activate Core Ledger SQL Proxy alone
  // Severs e_f_16 and e_f_17 (direct SQL access), leaving indirect Vault paths open
  const partialImpact = DefensiveControlModel.evaluateControlIntervention(
    ['ctrl_f_zt_ledger_proxy'],
    finControls,
    finGraphAnalysis.graph,
    finGraphAnalysis.paths
  );
  assert(partialImpact.blockedPathIds.length === 4, 'Ledger proxy alone blocks 4 direct paths');
  assert(partialImpact.residualPathCount === 4, '4 indirect Vault paths remain open');
  assert(partialImpact.isCrownJewelProtected === false, 'Crown Jewel not yet fully fortified');
  console.log(`✓ Partial Intervention on Financial Enterprise: Blocked 4/8 direct paths, 4 indirect paths remain.`);

  // 2. Complete Fortification: Activate Core Ledger SQL Proxy + Vault Short Leases
  // Covers e_f_16, e_f_17 (direct) AND e_f_14, e_f_15 (Vault transit)
  const fortifiedImpact = DefensiveControlModel.evaluateControlIntervention(
    ['ctrl_f_zt_ledger_proxy', 'ctrl_f_vault_short_lease'],
    finControls,
    finGraphAnalysis.graph,
    finGraphAnalysis.paths
  );

  console.log(`Financial Complete Fortification Results:`);
  console.log(`  - Controls Active: ${fortifiedImpact.selectedControlIds.join(', ')}`);
  console.log(`  - Deployment Cost: ${fortifiedImpact.totalDeploymentCost}`);
  console.log(`  - Blocked Paths: ${fortifiedImpact.blockedPathIds.length} of ${fortifiedImpact.initialPathCount}`);
  console.log(`  - Residual Paths: ${fortifiedImpact.residualPathCount}`);
  console.log(`  - Total Risk Reduced: ${fortifiedImpact.initialTotalRisk} -> ${fortifiedImpact.residualTotalRisk} (${fortifiedImpact.riskReductionPercentage}% reduction)`);
  console.log(`  - Cost Efficiency: ${fortifiedImpact.costEfficiencyRatio} pts/cost`);
  console.log(`  - Crown Jewel State: ${fortifiedImpact.isCrownJewelProtected ? 'FORTIFIED' : 'EXPOSED'}`);

  assert(fortifiedImpact.residualPathCount === 0, 'Combined controls must sever 100% of paths reaching fin_db_ledger');
  assert(fortifiedImpact.isCrownJewelProtected === true, 'fin_db_ledger must be marked FORTIFIED');
  assert(fortifiedImpact.riskReductionPercentage === 100.0, 'Risk reduction must be 100%');
  assert(fortifiedImpact.costEfficiencyRatio > 5.0, 'High cost efficiency expected for defense-in-depth controls');

  console.log('✓ Test 4 Passed: Real financial enterprise scenario successfully fortified and verified.');
  passedTests++;

  console.log('\n==================================================');
  console.log(`ALL DEFENSIVE CONTROL TESTS PASSED (${passedTests}/${passedTests}) — Phase 5 Complete`);
  console.log('==================================================\n');
}

runControlModelTests().catch(err => {
  console.error('\n❌ Defensive Control test suite failed:', err);
  process.exit(1);
});

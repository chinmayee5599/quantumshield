/**
 * QuantumShield — Attack Graph Engine Test Suite
 * Validates graph construction, cycle handling, multi-entry/target pathfinding,
 * configurable path depth constraints, and real scenario graph processing.
 */

import {
  analyzeScenarioGraph,
  AttackGraph,
  AttackGraphBuilder,
  GraphValidator,
  PathFinder,
  VisualizationAdapter,
} from '../src/core/attackGraph';
import { getScenario } from '../src/data/dataAccess';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
}

async function runAttackGraphTests() {
  console.log('==================================================');
  console.log('QuantumShield — Attack Graph Engine Test Suite');
  console.log('==================================================');

  let passedTests = 0;

  // -------------------------------------------------------------
  // Test 1: Known Canonical Graph with Cycles (Cycle Avoidance & Multiple Endpoints)
  // -------------------------------------------------------------
  console.log('\n[Test 1] Testing canonical synthetic graph with cyclic back-edges...');

  // Create a synthetic graph with an intentional cycle:
  // NodeA -> NodeB -> NodeC -> NodeA (Cycle)
  // Entry1, Entry2 -> NodeA
  // NodeB -> Target1
  // NodeC -> Target2
  const knownGraph: AttackGraph = {
    id: 'test_canonical_cycle_graph',
    name: 'Canonical Test Graph with Directed Cycles',
    nodes: [
      {
        id: 'Entry1',
        name: 'Internet Ingress Gateway 1',
        label: 'Entry1',
        nodeType: 'endpoint',
        tier: 'dmz',
        networkZone: 'perimeter_dmz',
        criticality: 'HIGH',
        assetValue: 50,
        isEntryPoint: true,
        isCrownJewel: false,
        assignedCves: [],
        ipAddress: '10.0.1.1',
        operatingEnv: 'Router',
        description: 'Primary ingress point',
      },
      {
        id: 'Entry2',
        name: 'Partner VPN Gateway 2',
        label: 'Entry2',
        nodeType: 'endpoint',
        tier: 'dmz',
        networkZone: 'perimeter_dmz',
        criticality: 'HIGH',
        assetValue: 50,
        isEntryPoint: true,
        isCrownJewel: false,
        assignedCves: [],
        ipAddress: '10.0.1.2',
        operatingEnv: 'VPN',
        description: 'Secondary ingress point',
      },
      {
        id: 'NodeA',
        name: 'Web Application Server',
        label: 'NodeA',
        nodeType: 'server',
        tier: 'internal',
        networkZone: 'corporate_lan',
        criticality: 'MEDIUM',
        assetValue: 60,
        isEntryPoint: false,
        isCrownJewel: false,
        assignedCves: [],
        ipAddress: '10.0.10.1',
        operatingEnv: 'Linux',
        description: 'Intermediate app node',
      },
      {
        id: 'NodeB',
        name: 'Internal API Broker',
        label: 'NodeB',
        nodeType: 'service',
        tier: 'internal',
        networkZone: 'corporate_lan',
        criticality: 'MEDIUM',
        assetValue: 65,
        isEntryPoint: false,
        isCrownJewel: false,
        assignedCves: [],
        ipAddress: '10.0.10.2',
        operatingEnv: 'Node.js',
        description: 'Intermediate broker node',
      },
      {
        id: 'NodeC',
        name: 'Database Cache',
        label: 'NodeC',
        nodeType: 'database',
        tier: 'internal',
        networkZone: 'corporate_lan',
        criticality: 'MEDIUM',
        assetValue: 70,
        isEntryPoint: false,
        isCrownJewel: false,
        assignedCves: [],
        ipAddress: '10.0.10.3',
        operatingEnv: 'Redis',
        description: 'Cache node with back-edge',
      },
      {
        id: 'Target1',
        name: 'Operational Transaction DB',
        label: 'Target1',
        nodeType: 'critical_asset',
        tier: 'crown_jewel',
        networkZone: 'core_vault',
        criticality: 'CRITICAL',
        assetValue: 100,
        isEntryPoint: false,
        isCrownJewel: true,
        assignedCves: [],
        ipAddress: '10.0.99.1',
        operatingEnv: 'PostgreSQL',
        description: 'Primary critical asset',
      },
      {
        id: 'Target2',
        name: 'Customer Financial Ledger',
        label: 'Target2',
        nodeType: 'critical_asset',
        tier: 'crown_jewel',
        networkZone: 'core_vault',
        criticality: 'CRITICAL',
        assetValue: 100,
        isEntryPoint: false,
        isCrownJewel: true,
        assignedCves: [],
        ipAddress: '10.0.99.2',
        operatingEnv: 'Oracle DB',
        description: 'Secondary critical asset',
      },
    ],
    edges: [
      {
        id: 'e_e1_a',
        source: 'Entry1',
        target: 'NodeA',
        relationshipType: 'network_traffic',
        service: 'HTTP',
        protocol: 'TCP',
        port: 80,
        vulnerability: null,
        exploitLikelihood: 0.8,
        privilegeRequirement: 'NONE',
        riskContribution: 5.0,
        controlOpportunities: ['c_fw_1'],
        controlNames: ['Perimeter Firewall Rule 1'],
        description: 'Entry1 to NodeA',
      },
      {
        id: 'e_e2_a',
        source: 'Entry2',
        target: 'NodeA',
        relationshipType: 'vpn_tunnel',
        service: 'VPN',
        protocol: 'TCP',
        port: 443,
        vulnerability: null,
        exploitLikelihood: 0.85,
        privilegeRequirement: 'NONE',
        riskContribution: 5.5,
        controlOpportunities: ['c_mfa_vpn'],
        controlNames: ['VPN MFA Policy'],
        description: 'Entry2 to NodeA',
      },
      {
        id: 'e_a_b',
        source: 'NodeA',
        target: 'NodeB',
        relationshipType: 'api_call',
        service: 'REST',
        protocol: 'HTTP',
        port: 8080,
        vulnerability: null,
        exploitLikelihood: 0.75,
        privilegeRequirement: 'LOW',
        riskContribution: 6.0,
        controlOpportunities: ['c_seg_lan'],
        controlNames: ['LAN Microsegmentation'],
        description: 'NodeA to NodeB',
      },
      {
        id: 'e_b_c',
        source: 'NodeB',
        target: 'NodeC',
        relationshipType: 'database_query',
        service: 'Cache',
        protocol: 'TCP',
        port: 6379,
        vulnerability: null,
        exploitLikelihood: 0.70,
        privilegeRequirement: 'LOW',
        riskContribution: 5.0,
        controlOpportunities: ['c_cache_auth'],
        controlNames: ['Cache Auth'],
        description: 'NodeB to NodeC',
      },
      // INTENTIONAL CYCLE BACK-EDGE: NodeC -> NodeA
      {
        id: 'e_c_a_cycle',
        source: 'NodeC',
        target: 'NodeA',
        relationshipType: 'api_call',
        service: 'Feedback Webhook',
        protocol: 'HTTP',
        port: 8080,
        vulnerability: null,
        exploitLikelihood: 0.90,
        privilegeRequirement: 'NONE',
        riskContribution: 7.0,
        controlOpportunities: ['c_webhook_block'],
        controlNames: ['Block Internal Webhooks'],
        description: 'Intentional cycle back-edge NodeC -> NodeA',
      },
      {
        id: 'e_b_t1',
        source: 'NodeB',
        target: 'Target1',
        relationshipType: 'database_query',
        service: 'SQL Write',
        protocol: 'TCP',
        port: 5432,
        vulnerability: null,
        exploitLikelihood: 0.9,
        privilegeRequirement: 'HIGH',
        riskContribution: 9.0,
        controlOpportunities: ['c_db_proxy'],
        controlNames: ['Database Proxy'],
        description: 'NodeB to Target1',
      },
      {
        id: 'e_c_t2',
        source: 'NodeC',
        target: 'Target2',
        relationshipType: 'database_query',
        service: 'SQL Dump',
        protocol: 'TCP',
        port: 1521,
        vulnerability: null,
        exploitLikelihood: 0.85,
        privilegeRequirement: 'HIGH',
        riskContribution: 8.5,
        controlOpportunities: ['c_db_proxy'],
        controlNames: ['Database Proxy'],
        description: 'NodeC to Target2',
      },
    ],
    entryPointIds: ['Entry1', 'Entry2'],
    crownJewelIds: ['Target1', 'Target2'],
    metadata: {
      generatedAt: new Date().toISOString(),
      totalAssets: 7,
      totalTransitions: 7,
    },
  };

  // 1.1 Test Validator cycle detection
  const valResult = GraphValidator.validate(knownGraph);
  assert(valResult.hasCycles === true, 'Validator must detect the presence of cycles');
  assert(valResult.cycleCount >= 1, `Expected at least 1 cycle, detected ${valResult.cycleCount}`);
  assert(valResult.detectedCycleSamples.length > 0, 'Must record sample cycle sequence');
  console.log(`✓ Cycle successfully detected and reported by GraphValidator (detected ${valResult.cycleCount} back-edge cycles).`);

  // 1.2 Test PathFinder: Must terminate without infinite recursion
  const startTime = Date.now();
  const canonicalPaths = PathFinder.findAllPaths(knownGraph, { maxPathLength: 10 });
  const durationMs = Date.now() - startTime;

  assert(durationMs < 500, `Path finding must terminate rapidly without infinite loop (took ${durationMs}ms)`);
  // Expected paths:
  // 1. Entry1 -> NodeA -> NodeB -> Target1
  // 2. Entry1 -> NodeA -> NodeB -> NodeC -> Target2
  // 3. Entry2 -> NodeA -> NodeB -> Target1
  // 4. Entry2 -> NodeA -> NodeB -> NodeC -> Target2
  assert(canonicalPaths.length === 4, `Expected exactly 4 simple attack paths, found ${canonicalPaths.length}`);

  const path1 = canonicalPaths.find(p => p.entryPointId === 'Entry1' && p.crownJewelId === 'Target1');
  const path2 = canonicalPaths.find(p => p.entryPointId === 'Entry1' && p.crownJewelId === 'Target2');
  const path3 = canonicalPaths.find(p => p.entryPointId === 'Entry2' && p.crownJewelId === 'Target1');
  const path4 = canonicalPaths.find(p => p.entryPointId === 'Entry2' && p.crownJewelId === 'Target2');

  assert(path1 !== undefined, 'Path Entry1 -> Target1 must be discovered');
  assert(path2 !== undefined, 'Path Entry1 -> Target2 must be discovered');
  assert(path3 !== undefined, 'Path Entry2 -> Target1 must be discovered');
  assert(path4 !== undefined, 'Path Entry2 -> Target2 must be discovered');

  assert(path1?.nodeSequence.length === 4, 'Entry1 -> Target1 must have 4 nodes (3 hops)');
  assert(path2?.nodeSequence.length === 5, 'Entry1 -> Target2 must have 5 nodes (4 hops)');

  // Verify choke point analysis: 'c_db_proxy' covers both Target1 and Target2 transitions
  assert(path1?.mitigatingControls.includes('c_db_proxy') === true, 'Path 1 must be mitigated by c_db_proxy');
  assert(path2?.mitigatingControls.includes('c_db_proxy') === true, 'Path 2 must be mitigated by c_db_proxy');

  console.log(`✓ Test 1 Passed: Cycle prevented gracefully; exactly 4 simple paths discovered across 2 entries & 2 targets in ${durationMs}ms.`);
  passedTests++;

  // -------------------------------------------------------------
  // Test 2: Configurable Maximum Path Length Constraint
  // -------------------------------------------------------------
  console.log('\n[Test 2] Testing configurable maximum path length constraint (maxPathLength)...');

  // With maxPathLength = 2:
  // Path 1 (3 hops) and Path 2 (4 hops) should both be pruned because length > 2
  const pathsLength2 = PathFinder.findAllPaths(knownGraph, { maxPathLength: 2 });
  assert(pathsLength2.length === 0, `Expected 0 paths with maxPathLength=2, found ${pathsLength2.length}`);

  // With maxPathLength = 3:
  // Only the 3-hop paths (Entry1 -> NodeA -> NodeB -> Target1 and Entry2 -> NodeA -> NodeB -> Target1) should be found!
  // The 4-hop paths reaching Target2 should be excluded.
  const pathsLength3 = PathFinder.findAllPaths(knownGraph, { maxPathLength: 3 });
  assert(pathsLength3.length === 2, `Expected exactly 2 paths with maxPathLength=3, found ${pathsLength3.length}`);
  for (const p of pathsLength3) {
    assert(p.length === 3, `Discovered path length must be 3, found ${p.length}`);
    assert(p.crownJewelId === 'Target1', `Path with length 3 must only reach Target1`);
  }

  console.log(`✓ Test 2 Passed: maxPathLength constraints enforced correctly (length 2 -> 0 paths, length 3 -> 2 paths).`);
  passedTests++;

  // -------------------------------------------------------------
  // Test 3: Multiple Specific Entry Point / Target Subsets
  // -------------------------------------------------------------
  console.log('\n[Test 3] Testing path finding on filtered entry and target subsets...');

  // Only search from Entry2 to Target1
  const pathsFiltered = PathFinder.findAllPaths(knownGraph, {
    entryPointIds: ['Entry2'],
    crownJewelIds: ['Target1'],
    maxPathLength: 5,
  });
  assert(pathsFiltered.length === 1, `Expected exactly 1 path from Entry2 to Target1, got ${pathsFiltered.length}`);
  assert(pathsFiltered[0].entryPointId === 'Entry2', 'Entry point must be Entry2');
  assert(pathsFiltered[0].crownJewelId === 'Target1', 'Crown jewel must be Target1');
  console.log('✓ Test 3 Passed: Selective entry point and target filtering verified.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 4: Real Scenario Execution — Financial Enterprise (Flagship)
  // -------------------------------------------------------------
  console.log('\n[Test 4] Testing Attack Graph Engine on Scenario 2: Financial Enterprise...');
  const finScenario = getScenario('financial');
  assert(finScenario !== undefined, 'Financial scenario must be loaded from data snapshot');

  const finAnalysis = analyzeScenarioGraph(finScenario!);

  assert(finAnalysis.graph.nodes.length === 18, `Expected 18 nodes, got ${finAnalysis.graph.nodes.length}`);
  assert(finAnalysis.graph.edges.length === 19, `Expected 19 edges, got ${finAnalysis.graph.edges.length}`);
  assert(finAnalysis.validation.isValid === true, 'Financial graph must be valid');
  assert(
    finAnalysis.validation.reachableTargets.includes('fin_db_ledger'),
    'Crown Jewel fin_db_ledger must be reachable'
  );

  assert(finAnalysis.paths.length >= 3, `Expected multiple attack paths in financial scenario, found ${finAnalysis.paths.length}`);
  for (const path of finAnalysis.paths) {
    assert(path.crownJewelId === 'fin_db_ledger', 'Path must terminate at fin_db_ledger');
    assert(path.cumulativeProbability > 0 && path.cumulativeProbability <= 1.0, 'Probability must be in (0, 1]');
    assert(path.compositeRiskScore >= 1 && path.compositeRiskScore <= 100, 'Risk score must be in [1, 100]');
    assert(path.steps.length === path.length, 'Path steps count must match path length');
    assert(path.mitigatingControls.length > 0, 'Every attack path must have at least one mitigating control opportunity');
  }

  // Check choke point detection in financial scenario
  const pathsWithChokePoints = finAnalysis.paths.filter(p => p.chokePoints.length > 0);
  assert(pathsWithChokePoints.length > 0, 'Choke point edges must be identified across converging attack paths');

  console.log(`✓ Financial Enterprise Graph built: 18 nodes, 19 edges, ${finAnalysis.paths.length} critical attack paths discovered.`);
  console.log(`  Top Path Risk: ${finAnalysis.paths[0].compositeRiskScore}/100, Choke Points: ${finAnalysis.paths[0].chokePoints.join(', ')}`);
  console.log(`✓ Test 4 Passed: Real financial enterprise scenario successfully processed.`);
  passedTests++;

  // -------------------------------------------------------------
  // Test 5: Real Scenario Execution — Small Enterprise
  // -------------------------------------------------------------
  console.log('\n[Test 5] Testing Attack Graph Engine on Scenario 1: Small Enterprise...');
  const smallScenario = getScenario('small');
  assert(smallScenario !== undefined, 'Small scenario must be loaded from data snapshot');

  const smallAnalysis = analyzeScenarioGraph(smallScenario!);
  assert(smallAnalysis.graph.nodes.length === 12, 'Small scenario must have 12 nodes');
  assert(smallAnalysis.graph.edges.length === 12, 'Small scenario must have 12 edges');
  assert(smallAnalysis.paths.length >= 2, `Expected >= 2 paths in small scenario, got ${smallAnalysis.paths.length}`);
  console.log(`✓ Small Enterprise Graph built: 12 nodes, 12 edges, ${smallAnalysis.paths.length} paths discovered.`);
  console.log(`✓ Test 5 Passed: Small enterprise scenario successfully processed.`);
  passedTests++;

  // -------------------------------------------------------------
  // Test 6: Graph Visualization Adapter Output
  // -------------------------------------------------------------
  console.log('\n[Test 6] Testing Graph Visualization Adapter format...');
  const visualData = VisualizationAdapter.toVisualizationFormat(
    finAnalysis.graph,
    finAnalysis.paths,
    ['ctrl_f_zt_ledger_proxy']
  );

  assert(visualData.nodes.length === 18, 'Visualization must include all 18 nodes');
  assert(visualData.edges.length === 19, 'Visualization must include all 19 edges');
  assert(visualData.viewport.width === 880, 'Viewport width must be set');
  assert(visualData.viewport.height === 420, 'Viewport height must be set');

  const severedEdges = visualData.edges.filter(e => e.isSevered);
  assert(severedEdges.length === 2, `Expected 2 edges severed by ctrl_f_zt_ledger_proxy, got ${severedEdges.length}`);
  assert(severedEdges.map(e => e.id).sort().join(',') === 'e_f_16,e_f_17', 'Edges e_f_16 and e_f_17 must be marked severed');

  console.log(`✓ Test 6 Passed: Visualization data properly adapted with active severed markers.`);
  passedTests++;

  console.log('\n==================================================');
  console.log(`ALL ATTACK GRAPH TESTS PASSED (${passedTests}/${passedTests}) — Phase 3 Complete`);
  console.log('==================================================\n');
}

runAttackGraphTests().catch(err => {
  console.error('\n❌ Attack Graph test suite failed:', err);
  process.exit(1);
});

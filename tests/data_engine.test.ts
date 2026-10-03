/**
 * QuantumShield — Data Engine Test Suite
 * Validates dataset loading, CVE parsing, referential constraints, scenario schemas,
 * and deterministic reproducibility across random seeds.
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateAllDatasets } from '../scripts/generate_datasets';
import { validateDatasets } from '../scripts/validate_datasets';
import {
  getAllAssets,
  getAllControls,
  getAllNetworkEdges,
  getAllPermissions,
  getAllScenarios,
  getAllVulnerabilities,
  getScenario,
  getVulnerabilityByCveId,
} from '../src/data/dataAccess';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('QuantumShield — Data Engine Verification Test Suite');
  console.log('==================================================');

  let passedTests = 0;

  // Test 1: Raw CVE Snapshot Parsing & Integrity
  console.log('\n[Test 1] Validating raw NVD CVE snapshot structure...');
  const cves = getAllVulnerabilities();
  assert(cves.length >= 25, `Expected >= 25 CVEs, found ${cves.length}`);
  for (const cve of cves) {
    assert(cve.cve_id.startsWith('CVE-'), `Invalid CVE ID: ${cve.cve_id}`);
    assert(
      cve.cvss_v3_base_score >= 0.0 && cve.cvss_v3_base_score <= 10.0,
      `CVSS out of range for ${cve.cve_id}: ${cve.cvss_v3_base_score}`
    );
    assert(cve.is_synthetic === false, `CVE ${cve.cve_id} must have is_synthetic=false`);
    assert(cve.source_url.includes('nvd.nist.gov'), `Source URL must point to NVD`);
  }
  const log4j = getVulnerabilityByCveId('CVE-2021-44228');
  assert(log4j !== undefined, 'Log4j (CVE-2021-44228) must be present in snapshot');
  assert(log4j?.cvss_v3_base_score === 10.0, 'Log4j CVSS score must be 10.0');
  console.log(`✓ Test 1 Passed: ${cves.length} real NVD CVE records verified.`);
  passedTests++;

  // Test 2: Dataset Validation Tooling
  console.log('\n[Test 2] Running dataset validation suite...');
  const validationResult = validateDatasets();
  assert(validationResult.isValid === true, 'Dataset validation must pass with zero errors');
  assert(validationResult.errors.length === 0, `Expected 0 validation errors, got ${validationResult.errors.length}`);
  console.log('✓ Test 2 Passed: 100% schema and referential integrity confirmed.');
  passedTests++;

  // Test 3: Asset Model & Criticality Verification
  console.log('\n[Test 3] Verifying synthetic asset attributes & business roles...');
  const assets = getAllAssets();
  assert(assets.length >= 50, `Expected >= 50 assets across scenarios, found ${assets.length}`);
  for (const asset of assets) {
    assert(!!asset.asset_id, 'Asset must have asset_id');
    assert(!!asset.asset_name, 'Asset must have asset_name');
    assert(
      ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(asset.criticality),
      `Invalid criticality on ${asset.asset_id}: ${asset.criticality}`
    );
    assert(
      asset.trust_level >= 1 && asset.trust_level <= 5,
      `Trust level out of bounds on ${asset.asset_id}: ${asset.trust_level}`
    );
  }
  console.log(`✓ Test 3 Passed: ${assets.length} synthetic enterprise assets verified.`);
  passedTests++;

  // Test 4: Network Edges & Transition Topologies
  console.log('\n[Test 4] Verifying network transitions and edge endpoints...');
  const edges = getAllNetworkEdges();
  const assetIdSet = new Set(assets.map(a => a.asset_id));
  assert(edges.length >= 70, `Expected >= 70 edges, found ${edges.length}`);
  for (const edge of edges) {
    assert(assetIdSet.has(edge.source), `Edge ${edge.edge_id} has invalid source ${edge.source}`);
    assert(assetIdSet.has(edge.destination), `Edge ${edge.edge_id} has invalid destination ${edge.destination}`);
    assert(edge.source !== edge.destination, `Self-loops prohibited on ${edge.edge_id}`);
    assert(edge.port >= 0 && edge.port <= 65535, `Port out of bounds on ${edge.edge_id}: ${edge.port}`);
  }
  console.log(`✓ Test 4 Passed: ${edges.length} network edges structurally valid.`);
  passedTests++;

  // Test 5: Defensive Controls & Mapping
  console.log('\n[Test 5] Verifying defensive controls and edge cut mappings...');
  const controls = getAllControls();
  const edgeIdSet = new Set(edges.map(e => e.edge_id));
  assert(controls.length >= 25, `Expected >= 25 controls, found ${controls.length}`);
  for (const ctrl of controls) {
    assert(ctrl.deployment_cost > 0, `Control ${ctrl.control_id} must have cost > 0`);
    assert(ctrl.operational_friction >= 0, `Control ${ctrl.control_id} friction must be >= 0`);
    for (const affectedEdge of ctrl.affected_edges) {
      assert(edgeIdSet.has(affectedEdge), `Control ${ctrl.control_id} cuts non-existent edge ${affectedEdge}`);
    }
  }
  console.log(`✓ Test 5 Passed: ${controls.length} defensive controls and cut mappings verified.`);
  passedTests++;

  // Test 6: Permissions Model
  console.log('\n[Test 6] Verifying IAM and access permissions...');
  const permissions = getAllPermissions();
  assert(permissions.length >= 20, `Expected >= 20 permissions, found ${permissions.length}`);
  for (const perm of permissions) {
    assert(assetIdSet.has(perm.target_asset), `Permission target ${perm.target_asset} not found`);
    assert(!!perm.source_identity, 'Permission must have source_identity');
  }
  console.log(`✓ Test 6 Passed: ${permissions.length} privilege mappings verified.`);
  passedTests++;

  // Test 7: Scenario Verification (Small, Financial, Large)
  console.log('\n[Test 7] Verifying scenario definitions...');
  const scenarios = getAllScenarios();
  assert(scenarios.length === 3, `Expected 3 scenarios, found ${scenarios.length}`);

  const small = getScenario('small');
  assert(small !== undefined, 'Small scenario must exist');
  assert(small?.assets.length === 12, 'Small scenario must have 12 assets');

  const fin = getScenario('financial');
  assert(fin !== undefined, 'Financial scenario must exist');
  assert(fin?.assets.length === 18, 'Financial scenario must have 18 assets');
  const finCrownJewel = fin?.assets.find(a => a.asset_id === 'fin_db_ledger');
  assert(finCrownJewel !== undefined, 'Financial scenario must contain fin_db_ledger');
  assert(finCrownJewel?.criticality === 'CRITICAL', 'Finance ledger must be marked CRITICAL');

  const large = getScenario('large');
  assert(large !== undefined, 'Large scenario must exist');
  assert(large?.assets.length === 30, 'Large scenario must have 30 assets');
  console.log('✓ Test 7 Passed: Small (12), Financial (18), and Large (30) scenarios verified.');
  passedTests++;

  // Test 8: Deterministic Reproducibility
  console.log('\n[Test 8] Testing deterministic reproducibility (Same Seed → Same Dataset)...');
  const runA = generateAllDatasets(42);
  const runB = generateAllDatasets(42);

  assert(
    runA.allAssets.length === runB.allAssets.length,
    'Asset count must match for same seed'
  );
  assert(
    runA.allEdges.length === runB.allEdges.length,
    'Edge count must match for same seed'
  );
  assert(
    JSON.stringify(runA.scenarioFinancial) === JSON.stringify(runB.scenarioFinancial),
    'Financial scenario must be byte-for-byte identical with same seed'
  );
  console.log('✓ Same seed (42) produced identical datasets.');

  console.log('Testing seed variation (Different Seed → Different Generated Topology)...');
  const runC = generateAllDatasets(999);
  // Large scenario is generated via PRNG, so edges and CVE assignments differ
  const edgeSignaturesA = runA.scenarioLarge.network_edges.map(e => `${e.source}->${e.destination}`).join('|');
  const edgeSignaturesC = runC.scenarioLarge.network_edges.map(e => `${e.source}->${e.destination}`).join('|');
  assert(
    edgeSignaturesA !== edgeSignaturesC,
    'Different seed must produce different synthetic topology'
  );
  console.log('✓ Different seed (999) produced distinct randomized enterprise topology.');
  console.log('✓ Test 8 Passed: Reproducibility and seed determinism fully confirmed.');
  passedTests++;

  // Restore canonical seed 42 on disk
  generateAllDatasets(42);

  // Test 9: Processed CSV Files Verification
  console.log('\n[Test 9] Verifying processed CSV exports on disk...');
  const csvFiles = ['vulnerabilities.csv', 'assets.csv', 'network_edges.csv', 'permissions.csv', 'controls.csv'];
  for (const f of csvFiles) {
    const p = path.resolve(process.cwd(), 'data/processed', f);
    assert(fs.existsSync(p), `Missing processed CSV: ${f}`);
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.trim().split('\n');
    assert(lines.length > 2, `CSV ${f} has insufficient rows (${lines.length})`);
  }
  console.log(`✓ Test 9 Passed: All 5 processed CSV files verified on disk.`);
  passedTests++;

  console.log('\n==================================================');
  console.log(`ALL TESTS PASSED (${passedTests}/${passedTests}) — Phase 2 Data Engine Complete`);
  console.log('==================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});

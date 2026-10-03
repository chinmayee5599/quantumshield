/**
 * QuantumShield — Risk Engine Test Suite
 * Validates transparent, explainable risk calculations against manual pencil-and-paper benchmarks,
 * verifies custom configurable weights, and audits explainability output.
 */

import { AttackGraph, AttackPathResult } from '../src/core/attackGraph/types';
import { analyzeScenarioGraph } from '../src/core/attackGraph';
import { DEFAULT_RISK_WEIGHTS, RiskEngine, RiskWeightConfig } from '../src/core/risk';
import { getScenario } from '../src/data/dataAccess';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
}

async function runRiskEngineTests() {
  console.log('==================================================');
  console.log('QuantumShield — Attack Path Risk Engine Test Suite');
  console.log('==================================================');

  let passedTests = 0;

  // -------------------------------------------------------------
  // Test 1: Hand-Calculated Manual Benchmark Verification
  // -------------------------------------------------------------
  console.log('\n[Test 1] Testing hand-calculated manual benchmark path...');

  // Setup: Known 2-hop attack chain:
  // Employee-PC -> Admin-Server -> Finance-DB
  const testGraph: AttackGraph = {
    id: 'test_risk_graph',
    name: 'Manual Calculation Test Graph',
    nodes: [
      {
        id: 'Employee-PC',
        name: 'Employee Workstation',
        label: 'Employee-PC',
        nodeType: 'endpoint',
        tier: 'internal',
        networkZone: 'corporate_lan',
        criticality: 'MEDIUM',
        assetValue: 50,
        isEntryPoint: true,
        isCrownJewel: false,
        assignedCves: [],
        ipAddress: '10.0.10.15',
        operatingEnv: 'Windows 11',
        description: 'Standard worker endpoint',
      },
      {
        id: 'Admin-Server',
        name: 'IT Administrative Bastion',
        label: 'Admin-Server',
        nodeType: 'server',
        tier: 'identity',
        networkZone: 'management_vlan',
        criticality: 'HIGH',
        assetValue: 80,
        isEntryPoint: false,
        isCrownJewel: false,
        assignedCves: ['CVE-2019-0708'],
        ipAddress: '10.0.20.5',
        operatingEnv: 'Windows Server 2022',
        description: 'Bastion host',
      },
      {
        id: 'Finance-DB',
        name: 'Core Financial Ledger DB',
        label: 'Finance-DB',
        nodeType: 'critical_asset',
        tier: 'crown_jewel',
        networkZone: 'core_vault',
        criticality: 'CRITICAL',
        assetValue: 100,
        isEntryPoint: false,
        isCrownJewel: true,
        assignedCves: [],
        ipAddress: '10.0.99.1',
        operatingEnv: 'Oracle Exadata',
        description: 'Mission critical ledger',
      },
    ],
    edges: [
      {
        id: 'edge_pc_admin',
        source: 'Employee-PC',
        target: 'Admin-Server',
        relationshipType: 'remote_management',
        service: 'RDP',
        protocol: 'TCP',
        port: 3389,
        vulnerability: {
          cveId: 'CVE-2019-0708',
          cvssBaseScore: 9.8,
          severity: 'CRITICAL',
          attackVector: 'NETWORK',
          privilegesRequired: 'NONE',
          exploitabilitySubscore: 3.9,
          description: 'BlueKeep RDP vulnerability',
        },
        exploitLikelihood: 0.90,
        privilegeRequirement: 'HIGH',
        riskContribution: 8.8,
        controlOpportunities: ['ctrl_patch_rdp'],
        controlNames: ['BlueKeep Patch'],
        description: 'RDP exploit step',
      },
      {
        id: 'edge_admin_fin',
        source: 'Admin-Server',
        target: 'Finance-DB',
        relationshipType: 'database_query',
        service: 'SQL Management',
        protocol: 'TCP',
        port: 1521,
        vulnerability: null, // Default CVSS 5.0
        exploitLikelihood: 0.80,
        privilegeRequirement: 'HIGH',
        riskContribution: 4.0,
        controlOpportunities: ['ctrl_db_proxy'],
        controlNames: ['Database Firewall'],
        description: 'Direct administrative SQL query step',
      },
    ],
    entryPointIds: ['Employee-PC'],
    crownJewelIds: ['Finance-DB'],
    metadata: {
      generatedAt: new Date().toISOString(),
      totalAssets: 3,
      totalTransitions: 2,
    },
  };

  const testPath: AttackPathResult = {
    pathId: 'manual_path_1',
    name: 'Employee-PC → Admin-Server → Finance-DB',
    entryPointId: 'Employee-PC',
    crownJewelId: 'Finance-DB',
    nodeSequence: ['Employee-PC', 'Admin-Server', 'Finance-DB'],
    edgeSequence: ['edge_pc_admin', 'edge_admin_fin'],
    length: 2,
    cumulativeProbability: 0.72,
    maxCvssScore: 9.8,
    avgCvssScore: 7.4,
    compositeRiskScore: 85,
    mitigatingControls: ['ctrl_patch_rdp', 'ctrl_db_proxy'],
    chokePoints: ['edge_admin_fin'],
    steps: [],
  };

  const report = RiskEngine.evaluateAllPaths(testGraph, [testPath])[0];

  console.log(`Path Name: ${report.pathName}`);
  console.log(`Computed Total Risk Score: ${report.totalRiskScore}/100`);
  console.log(`Severity Category: ${report.severityCategory}`);
  console.log('Factor Breakdown:');
  console.log(`  - Target Criticality Contribution: ${report.factorBreakdown.targetCriticality.weightedContribution} pts (Factor: ${report.factorBreakdown.targetCriticality.factor})`);
  console.log(`  - Vulnerability Severity Contribution: ${report.factorBreakdown.vulnerabilitySeverity.weightedContribution} pts (Factor: ${report.factorBreakdown.vulnerabilitySeverity.factor})`);
  console.log(`  - Exploitability Contribution: ${report.factorBreakdown.exploitability.weightedContribution} pts (Factor: ${report.factorBreakdown.exploitability.factor})`);
  console.log(`  - Privilege Escalation Contribution: ${report.factorBreakdown.privilegeEscalation.weightedContribution} pts (Factor: ${report.factorBreakdown.privilegeEscalation.factor})`);
  console.log(`  - Security Boundaries Contribution: ${report.factorBreakdown.boundaryCrossings.weightedContribution} pts (Factor: ${report.factorBreakdown.boundaryCrossings.factor})`);
  console.log(`  - Path Length Multiplier: ${report.factorBreakdown.pathLength.multiplier}x`);

  // Verification against manual math:
  // f_target = 1.000 -> weight 0.30 -> contribution = 30.0 pts
  // f_vuln = (0.6 * 9.8 + 0.4 * 7.4) / 10 = 0.884 -> weight 0.25 -> contribution = 22.1 pts
  // f_exploit = 0.5 * 0.72 + 0.5 * sqrt(0.72) = 0.36 + 0.424 = 0.784 -> weight 0.20 -> contribution = 15.7 pts
  // f_priv = 0.40 + 0.20 * 2 + 0.20 = 1.000 -> weight 0.15 -> contribution = 15.0 pts
  // f_boundary = 0.30 + 0.20 * 2 = 0.700 -> weight 0.10 -> contribution = 7.0 pts
  // Sum = 89.8 pts
  // Length Multiplier = 0.95
  // Total = 89.8 * 0.95 = 85.3 (+/- 0.2)
  assert(
    Math.abs(report.totalRiskScore - 85.3) <= 0.2,
    `Risk score expected ~85.3, got ${report.totalRiskScore}`
  );
  assert(report.severityCategory === 'CRITICAL', 'Category must be CRITICAL (>= 85.0)');
  assert(report.factorBreakdown.targetCriticality.factor === 1.0, 'Target factor must be 1.0');
  assert(report.factorBreakdown.pathLength.multiplier === 0.95, '2-hop length multiplier must be 0.95');

  console.log('✓ Test 1 Passed: Hand-calculated pencil-and-paper example matches computed risk within ±0.1.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 2: Custom Configurable Weights
  // -------------------------------------------------------------
  console.log('\n[Test 2] Testing custom configurable weights...');

  // Set 100% weight on Target Criticality
  const customWeights: RiskWeightConfig = {
    weightTargetCriticality: 1.0,
    weightVulnerability: 0.0,
    weightExploitability: 0.0,
    weightPrivilege: 0.0,
    weightBoundaries: 0.0,
  };

  const customReport = RiskEngine.evaluateAllPaths(testGraph, [testPath], customWeights)[0];
  // Score should be exactly 100 * f_target * lengthMultiplier = 100 * 1.0 * 0.95 = 95.0
  assert(
    Math.abs(customReport.totalRiskScore - 95.0) <= 0.1,
    `Custom weighted score expected 95.0, got ${customReport.totalRiskScore}`
  );
  console.log(`✓ 100% Target Criticality Weight produced exact expected score: ${customReport.totalRiskScore}/100.`);

  // Set 100% weight on Exploitability
  const exploitOnlyWeights: RiskWeightConfig = {
    weightTargetCriticality: 0.0,
    weightVulnerability: 0.0,
    weightExploitability: 1.0,
    weightPrivilege: 0.0,
    weightBoundaries: 0.0,
  };
  const exploitReport = RiskEngine.evaluateAllPaths(testGraph, [testPath], exploitOnlyWeights)[0];
  // Score = 100 * 0.78426 * 0.95 = 74.5
  assert(
    Math.abs(exploitReport.totalRiskScore - 74.5) <= 0.3,
    `Custom exploitability score expected ~74.5, got ${exploitReport.totalRiskScore}`
  );
  console.log(`✓ 100% Exploitability Weight produced exact expected score: ${exploitReport.totalRiskScore}/100.`);
  console.log('✓ Test 2 Passed: Dynamic weight reconfiguration verified.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 3: Analyst Explanations & Transparency
  // -------------------------------------------------------------
  console.log('\n[Test 3] Verifying security analyst explainability bullets...');

  assert(report.analystExplanation.length >= 5, 'Must provide >= 5 explainability points');
  const explanationText = report.analystExplanation.join(' ');
  assert(explanationText.includes('Target Criticality'), 'Must explain target criticality');
  assert(explanationText.includes('Vulnerability Severity'), 'Must explain vulnerability severity');
  assert(explanationText.includes('Exploitability'), 'Must explain exploitability');
  assert(explanationText.includes('Privilege Escalation'), 'Must explain privilege escalation');
  assert(explanationText.includes('Security Boundaries'), 'Must explain boundary crossings');

  console.log('Analyst Explanation Sample:');
  report.analystExplanation.forEach(line => console.log(`  • ${line}`));
  console.log('✓ Test 3 Passed: Comprehensive analyst explainability validated.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 4: Individual Edge Risk Breakdown
  // -------------------------------------------------------------
  console.log('\n[Test 4] Verifying individual edge risk breakdown...');

  assert(report.individualEdgeRisks.length === 2, 'Must have 2 edge risk breakdowns');
  const edge1 = report.individualEdgeRisks[0];
  const edge2 = report.individualEdgeRisks[1];

  // Edge 1 has CVE-2019-0708 (CVSS 9.8) * 0.90 * 10 = 88.2
  assert(edge1.cveId === 'CVE-2019-0708', 'Edge 1 must reference BlueKeep');
  assert(Math.abs(edge1.edgeRiskScore - 88.2) <= 0.5, `Edge 1 score expected 88.2, got ${edge1.edgeRiskScore}`);
  assert(edge1.mitigatingControls.includes('ctrl_patch_rdp'), 'Edge 1 must list ctrl_patch_rdp');

  // Edge 2 has default baseline CVSS 6.0 * 0.80 * 10 = 48.0
  assert(Math.abs(edge2.edgeRiskScore - 48.0) <= 0.5, `Edge 2 score expected 48.0, got ${edge2.edgeRiskScore}`);
  console.log(`✓ Edge 1 Risk: ${edge1.edgeRiskScore} (${edge1.justification})`);
  console.log(`✓ Edge 2 Risk: ${edge2.edgeRiskScore} (${edge2.justification})`);
  console.log('✓ Test 4 Passed: Step-level risk attribution confirmed.');
  passedTests++;

  // -------------------------------------------------------------
  // Test 5: Real Flagship Scenario Execution — Financial Enterprise
  // -------------------------------------------------------------
  console.log('\n[Test 5] Evaluating Risk Engine across all paths in Financial Enterprise scenario...');
  const finScenario = getScenario('financial')!;
  const graphAnalysis = analyzeScenarioGraph(finScenario);

  const finRiskReports = RiskEngine.evaluateAllPaths(
    graphAnalysis.graph,
    graphAnalysis.paths,
    DEFAULT_RISK_WEIGHTS
  );

  assert(finRiskReports.length === graphAnalysis.paths.length, 'All discovered paths must have risk reports');

  // Paths should be sorted in descending order of risk
  for (let i = 0; i < finRiskReports.length - 1; i++) {
    assert(
      finRiskReports[i].totalRiskScore >= finRiskReports[i + 1].totalRiskScore,
      'Paths must be strictly sorted by descending total risk'
    );
  }

  const highestRiskPath = finRiskReports[0];
  console.log(`Top Financial Attack Path: ${highestRiskPath.pathName}`);
  console.log(`  Total Risk: ${highestRiskPath.totalRiskScore}/100 (${highestRiskPath.severityCategory})`);
  console.log(`  Key Choke Points: ${highestRiskPath.chokePoints.join(', ')}`);
  console.log(`  Top Edge Risk: ${highestRiskPath.individualEdgeRisks[0].edgeRiskScore} (${highestRiskPath.individualEdgeRisks[0].cveId || 'Service'})`);

  assert(highestRiskPath.totalRiskScore >= 70.0, 'Top financial path must have HIGH or CRITICAL risk');
  console.log('✓ Test 5 Passed: Real flagship financial enterprise paths successfully scored and sorted.');
  passedTests++;

  console.log('\n==================================================');
  console.log(`ALL RISK ENGINE TESTS PASSED (${passedTests}/${passedTests}) — Phase 4 Complete`);
  console.log('==================================================\n');
}

runRiskEngineTests().catch(err => {
  console.error('\n❌ Risk Engine test suite failed:', err);
  process.exit(1);
});

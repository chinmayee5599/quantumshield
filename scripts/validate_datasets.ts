/**
 * QuantumShield — Dataset Validation Suite
 * Validates integrity, schema adherence, referential constraints, and CVSS bounds.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  CriticalityLevel,
  ScenarioDefinition,
  SyntheticAssetRecord,
  VulnerabilityRecord,
} from '../src/data/dataTypes';

export interface ValidationError {
  type: string;
  entityId: string;
  field: string;
  message: string;
}

export function validateDatasets(): {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  summary: Record<string, number>;
} {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  const rawPath = path.resolve(process.cwd(), 'data/raw/nvd_cve_snapshot.json');
  const scenariosDir = path.resolve(process.cwd(), 'data/scenarios');
  const processedDir = path.resolve(process.cwd(), 'data/processed');

  if (!fs.existsSync(rawPath)) {
    errors.push({
      type: 'MISSING_FILE',
      entityId: 'data/raw/nvd_cve_snapshot.json',
      field: 'file',
      message: 'Raw NVD CVE snapshot file is missing.',
    });
    return { isValid: false, errors, warnings, summary: {} };
  }

  // 1. Validate Raw CVE Records
  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const cves: VulnerabilityRecord[] = rawData.cves || [];
  const knownCveIds = new Set<string>();

  for (const cve of cves) {
    if (!cve.cve_id || typeof cve.cve_id !== 'string' || !cve.cve_id.startsWith('CVE-')) {
      errors.push({
        type: 'INVALID_CVE_ID',
        entityId: cve.cve_id || 'unknown',
        field: 'cve_id',
        message: `Invalid or missing CVE ID format: ${cve.cve_id}`,
      });
    }

    if (knownCveIds.has(cve.cve_id)) {
      errors.push({
        type: 'DUPLICATE_CVE_ID',
        entityId: cve.cve_id,
        field: 'cve_id',
        message: `Duplicate CVE ID detected in raw snapshot: ${cve.cve_id}`,
      });
    }
    knownCveIds.add(cve.cve_id);

    // CVSS score validation: must be between 0.0 and 10.0
    if (
      typeof cve.cvss_v3_base_score !== 'number' ||
      cve.cvss_v3_base_score < 0.0 ||
      cve.cvss_v3_base_score > 10.0
    ) {
      errors.push({
        type: 'INVALID_CVSS_SCORE',
        entityId: cve.cve_id,
        field: 'cvss_v3_base_score',
        message: `CVSS v3 base score must be between 0.0 and 10.0. Found: ${cve.cvss_v3_base_score}`,
      });
    }

    // Severity validation
    const validSeverities = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validSeverities.includes(cve.severity)) {
      errors.push({
        type: 'INVALID_SEVERITY',
        entityId: cve.cve_id,
        field: 'severity',
        message: `Invalid severity: ${cve.severity}. Must be one of: ${validSeverities.join(', ')}`,
      });
    }
  }

  // 2. Validate Scenarios (small, financial, large)
  const scenarioFiles = ['small.json', 'financial.json', 'large.json'];
  let totalAssetsChecked = 0;
  let totalEdgesChecked = 0;
  let totalControlsChecked = 0;
  let totalPermissionsChecked = 0;

  for (const fileName of scenarioFiles) {
    const scPath = path.join(scenariosDir, fileName);
    if (!fs.existsSync(scPath)) {
      errors.push({
        type: 'MISSING_SCENARIO_FILE',
        entityId: fileName,
        field: 'file',
        message: `Scenario file missing: ${scPath}`,
      });
      continue;
    }

    const scenario: ScenarioDefinition = JSON.parse(fs.readFileSync(scPath, 'utf8'));
    const assetIdSet = new Set<string>();

    // Validate assets in scenario
    for (const asset of scenario.assets) {
      totalAssetsChecked++;
      if (!asset.asset_id || typeof asset.asset_id !== 'string') {
        errors.push({
          type: 'MISSING_ASSET_ID',
          entityId: 'unnamed_asset',
          field: 'asset_id',
          message: `Asset in scenario ${scenario.scenario_id} is missing an asset_id.`,
        });
      }

      if (assetIdSet.has(asset.asset_id)) {
        errors.push({
          type: 'DUPLICATE_ASSET_ID',
          entityId: asset.asset_id,
          field: 'asset_id',
          message: `Duplicate asset ID ${asset.asset_id} in scenario ${scenario.scenario_id}.`,
        });
      }
      assetIdSet.add(asset.asset_id);

      // Validate criticality
      const validCriticalities: CriticalityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validCriticalities.includes(asset.criticality)) {
        errors.push({
          type: 'INVALID_CRITICALITY',
          entityId: asset.asset_id,
          field: 'criticality',
          message: `Asset ${asset.asset_id} has invalid criticality: ${asset.criticality}`,
        });
      }

      // Validate assigned CVEs exist in raw snapshot
      for (const cveId of asset.assigned_cves) {
        if (!knownCveIds.has(cveId)) {
          errors.push({
            type: 'UNKNOWN_CVE_REFERENCE',
            entityId: asset.asset_id,
            field: 'assigned_cves',
            message: `Asset ${asset.asset_id} references unknown CVE ID: ${cveId}`,
          });
        }
      }
    }

    // Validate entry points and crown jewels exist
    for (const entryId of scenario.entry_point_asset_ids) {
      if (!assetIdSet.has(entryId)) {
        errors.push({
          type: 'DANGLING_ENTRY_POINT',
          entityId: entryId,
          field: 'entry_point_asset_ids',
          message: `Entry point asset ID ${entryId} not found in scenario assets.`,
        });
      }
    }

    for (const crownId of scenario.crown_jewel_asset_ids) {
      if (!assetIdSet.has(crownId)) {
        errors.push({
          type: 'DANGLING_CROWN_JEWEL',
          entityId: crownId,
          field: 'crown_jewel_asset_ids',
          message: `Crown jewel asset ID ${crownId} not found in scenario assets.`,
        });
      } else {
        const crownAsset = scenario.assets.find(a => a.asset_id === crownId);
        if (crownAsset && crownAsset.criticality !== 'CRITICAL') {
          warnings.push(
            `Crown jewel ${crownId} in scenario ${scenario.scenario_id} has criticality ${crownAsset.criticality} (recommended: CRITICAL).`
          );
        }
      }
    }

    // Validate Network Edges
    const edgeIdSet = new Set<string>();
    for (const edge of scenario.network_edges) {
      totalEdgesChecked++;
      if (edgeIdSet.has(edge.edge_id)) {
        errors.push({
          type: 'DUPLICATE_EDGE_ID',
          entityId: edge.edge_id,
          field: 'edge_id',
          message: `Duplicate edge ID ${edge.edge_id} in scenario ${scenario.scenario_id}.`,
        });
      }
      edgeIdSet.add(edge.edge_id);

      // Check endpoints exist
      if (!assetIdSet.has(edge.source)) {
        errors.push({
          type: 'DANGLING_EDGE_SOURCE',
          entityId: edge.edge_id,
          field: 'source',
          message: `Edge ${edge.edge_id} references nonexistent source asset: ${edge.source}`,
        });
      }

      if (!assetIdSet.has(edge.destination)) {
        errors.push({
          type: 'DANGLING_EDGE_DESTINATION',
          entityId: edge.edge_id,
          field: 'destination',
          message: `Edge ${edge.edge_id} references nonexistent destination asset: ${edge.destination}`,
        });
      }

      // Check exploitable CVE reference if present
      if (edge.exploitable_cve_id && !knownCveIds.has(edge.exploitable_cve_id)) {
        errors.push({
          type: 'DANGLING_EDGE_CVE',
          entityId: edge.edge_id,
          field: 'exploitable_cve_id',
          message: `Edge ${edge.edge_id} references unknown CVE: ${edge.exploitable_cve_id}`,
        });
      }
    }

    // Validate Permissions
    for (const perm of scenario.permissions) {
      totalPermissionsChecked++;
      if (!assetIdSet.has(perm.target_asset)) {
        errors.push({
          type: 'DANGLING_PERMISSION_TARGET',
          entityId: perm.permission_id,
          field: 'target_asset',
          message: `Permission ${perm.permission_id} references nonexistent target asset: ${perm.target_asset}`,
        });
      }
    }

    // Validate Defensive Controls
    const controlIdSet = new Set<string>();
    for (const ctrl of scenario.controls) {
      totalControlsChecked++;
      if (controlIdSet.has(ctrl.control_id)) {
        errors.push({
          type: 'DUPLICATE_CONTROL_ID',
          entityId: ctrl.control_id,
          field: 'control_id',
          message: `Duplicate control ID ${ctrl.control_id} in scenario ${scenario.scenario_id}.`,
        });
      }
      controlIdSet.add(ctrl.control_id);

      if (typeof ctrl.deployment_cost !== 'number' || ctrl.deployment_cost <= 0) {
        errors.push({
          type: 'INVALID_CONTROL_COST',
          entityId: ctrl.control_id,
          field: 'deployment_cost',
          message: `Control ${ctrl.control_id} must have a positive deployment cost.`,
        });
      }

      // Check that all affected_edges actually exist in the scenario
      for (const affectedEdge of ctrl.affected_edges) {
        if (!edgeIdSet.has(affectedEdge)) {
          errors.push({
            type: 'DANGLING_CONTROL_EDGE',
            entityId: ctrl.control_id,
            field: 'affected_edges',
            message: `Control ${ctrl.control_id} references nonexistent edge: ${affectedEdge}`,
          });
        }
      }
    }
  }

  // 3. Validate Processed CSV files exist
  const csvFiles = [
    'vulnerabilities.csv',
    'assets.csv',
    'network_edges.csv',
    'permissions.csv',
    'controls.csv',
  ];
  for (const csv of csvFiles) {
    const csvPath = path.join(processedDir, csv);
    if (!fs.existsSync(csvPath) || fs.statSync(csvPath).size === 0) {
      errors.push({
        type: 'MISSING_PROCESSED_CSV',
        entityId: csv,
        field: 'file',
        message: `Processed CSV file missing or empty: ${csvPath}`,
      });
    }
  }

  const summary = {
    cvesCount: knownCveIds.size,
    totalAssetsChecked,
    totalEdgesChecked,
    totalControlsChecked,
    totalPermissionsChecked,
    errorCount: errors.length,
    warningCount: warnings.length,
  };

  const isValid = errors.length === 0;

  return { isValid, errors, warnings, summary };
}

// Run CLI validation if invoked directly
if (process.argv[1]?.endsWith('validate_datasets.ts')) {
  const result = validateDatasets();
  console.log('\n==================================================');
  console.log('QuantumShield — Dataset Integrity Validation Report');
  console.log('==================================================');
  console.log(`Validation Status: ${result.isValid ? 'PASSED (100% VALID)' : 'FAILED'}`);
  console.log(`Summary Metrics:`);
  console.log(`  - Curated NVD CVE Records: ${result.summary.cvesCount}`);
  console.log(`  - Total Scenario Assets Verified: ${result.summary.totalAssetsChecked}`);
  console.log(`  - Total Network Transitions Verified: ${result.summary.totalEdgesChecked}`);
  console.log(`  - Total Security Controls Verified: ${result.summary.totalControlsChecked}`);
  console.log(`  - Total Identity Permissions Verified: ${result.summary.totalPermissionsChecked}`);

  if (result.warnings.length > 0) {
    console.log(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach(w => console.log(`  [WARN] ${w}`));
  }

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach(e =>
      console.log(`  [ERR] ${e.type} at ${e.entityId}.${e.field}: ${e.message}`)
    );
    process.exit(1);
  } else {
    console.log('\nAll foreign key references, bounds, and schemas verified successfully.');
    console.log('==================================================\n');
  }
}

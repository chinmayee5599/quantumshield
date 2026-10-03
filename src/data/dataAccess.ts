/**
 * QuantumShield — Data Access API Layer
 * Provides clean, decoupled interfaces for accessing vulnerabilities, synthetic assets,
 * network topologies, permissions, defensive controls, and pre-packaged scenarios.
 * Operates offline by default using the verified local data snapshot.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ControlRecord,
  NetworkEdgeRecord,
  PermissionRecord,
  ScenarioDefinition,
  SyntheticAssetRecord,
  VulnerabilityRecord,
} from './dataTypes';

class DataEngineStore {
  private vulnerabilities: VulnerabilityRecord[] = [];
  private assets: SyntheticAssetRecord[] = [];
  private networkEdges: NetworkEdgeRecord[] = [];
  private permissions: PermissionRecord[] = [];
  private controls: ControlRecord[] = [];
  private scenarios: Map<string, ScenarioDefinition> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.loadSnapshot();
  }

  /**
   * Loads the local snapshot from data/raw and data/scenarios into memory.
   */
  public loadSnapshot(): void {
    try {
      const basePath = process.cwd();
      const rawCvePath = path.resolve(basePath, 'data/raw/nvd_cve_snapshot.json');
      const scenariosDir = path.resolve(basePath, 'data/scenarios');

      // Load raw NVD CVEs
      if (fs.existsSync(rawCvePath)) {
        const rawJson = JSON.parse(fs.readFileSync(rawCvePath, 'utf8'));
        this.vulnerabilities = rawJson.cves.map((c: any) => ({
          ...c,
          is_synthetic: false,
        }));
      }

      // Load Scenarios
      const scenarioFiles = ['small.json', 'financial.json', 'large.json'];
      this.scenarios.clear();

      const allAssetsMap = new Map<string, SyntheticAssetRecord>();
      const allEdgesMap = new Map<string, NetworkEdgeRecord>();
      const allPermsMap = new Map<string, PermissionRecord>();
      const allControlsMap = new Map<string, ControlRecord>();

      for (const file of scenarioFiles) {
        const scPath = path.join(scenariosDir, file);
        if (fs.existsSync(scPath)) {
          const sc: ScenarioDefinition = JSON.parse(fs.readFileSync(scPath, 'utf8'));
          this.scenarios.set(sc.scenario_id, sc);
          // Also set by short category name ('small', 'financial', 'large')
          this.scenarios.set(sc.scenario_category, sc);

          sc.assets.forEach(a => allAssetsMap.set(a.asset_id, a));
          sc.network_edges.forEach(e => allEdgesMap.set(e.edge_id, e));
          sc.permissions.forEach(p => allPermsMap.set(p.permission_id, p));
          sc.controls.forEach(c => allControlsMap.set(c.control_id, c));
        }
      }

      this.assets = Array.from(allAssetsMap.values());
      this.networkEdges = Array.from(allEdgesMap.values());
      this.permissions = Array.from(allPermsMap.values());
      this.controls = Array.from(allControlsMap.values());

      this.initialized = true;
    } catch (err) {
      console.warn('[QuantumShield DataAccess] Failed to load snapshot files from disk:', err);
    }
  }

  public getAllVulnerabilities(): VulnerabilityRecord[] {
    return [...this.vulnerabilities];
  }

  public getVulnerabilityByCveId(cveId: string): VulnerabilityRecord | undefined {
    return this.vulnerabilities.find(v => v.cve_id === cveId);
  }

  public getAllAssets(): SyntheticAssetRecord[] {
    return [...this.assets];
  }

  public getAssetById(assetId: string): SyntheticAssetRecord | undefined {
    return this.assets.find(a => a.asset_id === assetId);
  }

  public getAllNetworkEdges(): NetworkEdgeRecord[] {
    return [...this.networkEdges];
  }

  public getAllPermissions(): PermissionRecord[] {
    return [...this.permissions];
  }

  public getAllControls(): ControlRecord[] {
    return [...this.controls];
  }

  public getControlById(controlId: string): ControlRecord | undefined {
    return this.controls.find(c => c.control_id === controlId);
  }

  public getAllScenarios(): ScenarioDefinition[] {
    // Return unique scenarios by scenario_id
    const uniqueIds = new Set<string>();
    const list: ScenarioDefinition[] = [];
    for (const sc of this.scenarios.values()) {
      if (!uniqueIds.has(sc.scenario_id)) {
        uniqueIds.add(sc.scenario_id);
        list.push(sc);
      }
    }
    return list;
  }

  public getScenario(scenarioIdOrCategory: string): ScenarioDefinition | undefined {
    return this.scenarios.get(scenarioIdOrCategory);
  }
}

// Export singleton instance and top-level helper functions
export const dataEngine = new DataEngineStore();

export const getAllVulnerabilities = () => dataEngine.getAllVulnerabilities();
export const getVulnerabilityByCveId = (id: string) => dataEngine.getVulnerabilityByCveId(id);
export const getAllAssets = () => dataEngine.getAllAssets();
export const getAssetById = (id: string) => dataEngine.getAssetById(id);
export const getAllNetworkEdges = () => dataEngine.getAllNetworkEdges();
export const getAllPermissions = () => dataEngine.getAllPermissions();
export const getAllControls = () => dataEngine.getAllControls();
export const getControlById = (id: string) => dataEngine.getControlById(id);
export const getAllScenarios = () => dataEngine.getAllScenarios();
export const getScenario = (id: string) => dataEngine.getScenario(id);

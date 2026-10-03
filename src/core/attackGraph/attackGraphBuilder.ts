/**
 * QuantumShield — Attack Graph Builder
 * Converts synthetic enterprise assets, network transitions, and real-world CVE metadata
 * into a directed attack graph with rich edge exploitability attributes.
 */

import { ScenarioDefinition, SyntheticAssetRecord, VulnerabilityRecord } from '../../data/dataTypes';
import {
  AttackGraph,
  AttackGraphEdge,
  AttackGraphNode,
  AttackGraphNodeType,
  EdgeVulnerabilityMetadata,
} from './types';

export class AttackGraphBuilder {
  /**
   * Builds an AttackGraph from a ScenarioDefinition.
   */
  public static buildFromScenario(scenario: ScenarioDefinition): AttackGraph {
    const cveMap = new Map<string, VulnerabilityRecord>(
      scenario.vulnerabilities.map(v => [v.cve_id, v])
    );

    // Map control opportunities for each edge
    const edgeToControlsMap = new Map<string, { ids: string[]; names: string[] }>();
    for (const ctrl of scenario.controls) {
      for (const edgeId of ctrl.affected_edges) {
        const existing = edgeToControlsMap.get(edgeId) || { ids: [], names: [] };
        existing.ids.push(ctrl.control_id);
        existing.names.push(ctrl.control_name);
        edgeToControlsMap.set(edgeId, existing);
      }
    }

    // 1. Build Nodes
    const nodes: AttackGraphNode[] = scenario.assets.map((asset, index) => {
      const isEntry = scenario.entry_point_asset_ids.includes(asset.asset_id);
      const isCrown = scenario.crown_jewel_asset_ids.includes(asset.asset_id);

      const nodeType = this.classifyNodeType(asset, isCrown);
      const assetValue = this.calculateAssetValue(asset, isCrown);

      // Deterministic layout coordinates based on network zone and index
      const { x, y } = this.calculateCoordinates(asset, index, scenario.assets.length);

      return {
        id: asset.asset_id,
        name: asset.asset_name,
        label: this.generateShortLabel(asset.asset_name, nodeType),
        nodeType,
        tier: this.zoneToTier(asset.network_zone),
        networkZone: asset.network_zone,
        criticality: asset.criticality,
        assetValue,
        isEntryPoint: isEntry,
        isCrownJewel: isCrown,
        assignedCves: [...asset.assigned_cves],
        ipAddress: this.generateSyntheticIp(asset, index),
        operatingEnv: asset.operating_environment,
        description: asset.description,
        x,
        y,
      };
    });

    const nodeMap = new Map<string, AttackGraphNode>(nodes.map(n => [n.id, n]));

    // 2. Build Edges
    const edges: AttackGraphEdge[] = scenario.network_edges.map(edge => {
      let vulnMeta: EdgeVulnerabilityMetadata | null = null;
      let exploitLikelihood = 0.70;
      let privilegeRequirement: 'NONE' | 'LOW' | 'HIGH' = 'NONE';
      let riskContribution = 5.0;

      if (edge.exploitable_cve_id && cveMap.has(edge.exploitable_cve_id)) {
        const cve = cveMap.get(edge.exploitable_cve_id)!;
        vulnMeta = {
          cveId: cve.cve_id,
          cvssBaseScore: cve.cvss_v3_base_score,
          severity: cve.severity,
          attackVector: cve.attack_vector,
          privilegesRequired: cve.privileges_required,
          exploitabilitySubscore: cve.exploitability_subscore,
          description: cve.description,
        };

        // Derive exploit likelihood from real CVSS exploitability subscore (0 - 3.9)
        exploitLikelihood = Math.min(0.98, Math.max(0.35, (cve.exploitability_subscore / 3.9) * 0.95));
        privilegeRequirement = cve.privileges_required as any;
        riskContribution = Number((cve.cvss_v3_base_score * exploitLikelihood).toFixed(2));
      } else {
        // Transition without specific CVE (e.g. credential relay or direct management pivot)
        if (edge.relationship_type === 'credential_relay') {
          exploitLikelihood = 0.85;
          privilegeRequirement = 'LOW';
          riskContribution = 7.5;
        } else if (edge.relationship_type === 'remote_management') {
          exploitLikelihood = 0.80;
          privilegeRequirement = 'HIGH';
          riskContribution = 7.0;
        } else if (edge.relationship_type === 'database_query') {
          exploitLikelihood = 0.75;
          privilegeRequirement = 'LOW';
          riskContribution = 6.5;
        } else {
          exploitLikelihood = 0.60;
          privilegeRequirement = 'NONE';
          riskContribution = 5.0;
        }
      }

      const controls = edgeToControlsMap.get(edge.edge_id) || { ids: [], names: [] };

      return {
        id: edge.edge_id,
        source: edge.source,
        target: edge.destination,
        relationshipType: edge.relationship_type,
        service: edge.service,
        protocol: edge.protocol,
        port: edge.port,
        trustTransition: edge.trust_transition,
        vulnerability: vulnMeta,
        exploitLikelihood: Number(exploitLikelihood.toFixed(2)),
        privilegeRequirement,
        riskContribution,
        controlOpportunities: controls.ids,
        controlNames: controls.names,
        description: edge.description,
      };
    });

    return {
      id: `graph_${scenario.scenario_id}`,
      name: `Attack Graph: ${scenario.scenario_name}`,
      nodes,
      edges,
      entryPointIds: [...scenario.entry_point_asset_ids],
      crownJewelIds: [...scenario.crown_jewel_asset_ids],
      metadata: {
        generatedAt: new Date().toISOString(),
        scenarioCategory: scenario.scenario_category,
        totalAssets: nodes.length,
        totalTransitions: edges.length,
      },
    };
  }

  private static classifyNodeType(
    asset: SyntheticAssetRecord,
    isCrown: boolean
  ): AttackGraphNodeType {
    if (isCrown || asset.asset_type === 'finance_database') return 'critical_asset';
    if (asset.asset_type === 'employee_workstation') return 'endpoint';
    if (
      asset.asset_type === 'domain_identity_server' ||
      asset.asset_type === 'authentication_server'
    )
      return 'identity';
    if (asset.asset_type === 'general_database') return 'database';
    if (asset.asset_type === 'internal_api_server' || asset.asset_type === 'internet_gateway')
      return 'service';
    return 'server';
  }

  private static calculateAssetValue(asset: SyntheticAssetRecord, isCrown: boolean): number {
    if (isCrown) return 100;
    switch (asset.criticality) {
      case 'CRITICAL':
        return 95;
      case 'HIGH':
        return 75;
      case 'MEDIUM':
        return 50;
      case 'LOW':
        return 30;
      default:
        return 50;
    }
  }

  private static zoneToTier(zone: string): string {
    switch (zone) {
      case 'external_internet':
      case 'perimeter_dmz':
        return 'dmz';
      case 'corporate_lan':
        return 'internal';
      case 'management_vlan':
        return 'identity';
      case 'restricted_pci':
        return 'core_server';
      case 'core_vault':
        return 'crown_jewel';
      default:
        return 'internal';
    }
  }

  private static generateShortLabel(name: string, type: AttackGraphNodeType): string {
    if (name.length <= 18) return name;
    // Extract key tokens
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return name.slice(0, 18);
  }

  private static generateSyntheticIp(asset: SyntheticAssetRecord, index: number): string {
    switch (asset.network_zone) {
      case 'perimeter_dmz':
        return `10.0.1.${10 + index}`;
      case 'corporate_lan':
        return `10.0.10.${50 + index}`;
      case 'management_vlan':
        return `10.0.20.${100 + index}`;
      case 'restricted_pci':
        return `10.0.50.${20 + index}`;
      case 'core_vault':
        return `10.0.99.${index + 1}`;
      default:
        return `172.16.${index}.10`;
    }
  }

  private static calculateCoordinates(
    asset: SyntheticAssetRecord,
    index: number,
    total: number
  ): { x: number; y: number } {
    // 5 horizontal tier columns
    const zoneColumns: Record<string, number> = {
      external_internet: 60,
      perimeter_dmz: 140,
      corporate_lan: 320,
      management_vlan: 480,
      restricted_pci: 640,
      core_vault: 780,
    };

    const x = zoneColumns[asset.network_zone] || (100 + (index / total) * 680);
    // Vertical staggered spacing
    const y = 80 + ((index % 5) * 65);

    return { x: Math.round(x), y: Math.round(y) };
  }
}

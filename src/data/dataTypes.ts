/**
 * QuantumShield — Data Engine Type Definitions
 * Represents authentic NVD CVE records, synthetic enterprise assets, network topologies,
 * permission models, defensive controls, and reproducible scenario definitions.
 */

export type CriticalityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CvssSeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface VulnerabilityRecord {
  cve_id: string;
  published_date: string;
  cvss_v3_base_score: number;
  cvss_v3_vector: string;
  severity: CvssSeverity;
  attack_vector: string;
  attack_complexity: string;
  privileges_required: string;
  user_interaction: string;
  scope: string;
  confidentiality_impact: string;
  integrity_impact: string;
  availability_impact: string;
  exploitability_subscore: number;
  impact_subscore: number;
  affected_product: string;
  affected_category: string;
  description: string;
  source_url: string;
  is_synthetic: boolean; // Always false for real NVD CVEs
}

export interface SyntheticAssetRecord {
  asset_id: string;
  asset_name: string;
  asset_type:
    | 'internet_gateway'
    | 'web_server'
    | 'application_server'
    | 'employee_workstation'
    | 'vpn_gateway'
    | 'authentication_server'
    | 'domain_identity_server'
    | 'admin_server'
    | 'internal_api_server'
    | 'general_database'
    | 'finance_database'
    | 'backup_server'
    | 'monitoring_server';
  business_role: string;
  criticality: CriticalityLevel;
  trust_level: number; // 1 (lowest / untrusted) to 5 (highest / vault)
  network_zone:
    | 'external_internet'
    | 'perimeter_dmz'
    | 'corporate_lan'
    | 'management_vlan'
    | 'restricted_pci'
    | 'core_vault';
  operating_environment: string;
  description: string;
  assigned_cves: string[];
}

export interface NetworkEdgeRecord {
  edge_id: string;
  source: string; // asset_id
  destination: string; // asset_id
  relationship_type:
    | 'network_traffic'
    | 'api_call'
    | 'remote_management'
    | 'database_query'
    | 'replication'
    | 'vpn_tunnel'
    | 'credential_relay';
  service: string;
  protocol: string;
  port: number;
  trust_transition:
    | 'same_zone'
    | 'ingress'
    | 'lateral_escalation'
    | 'egress'
    | 'privilege_boundary';
  allowed: boolean;
  exploitable_cve_id: string | null;
  description: string;
}

export interface PermissionRecord {
  permission_id: string;
  source_identity: string;
  target_asset: string; // asset_id
  privilege_level: 'User' | 'Read' | 'Execute' | 'Write' | 'Administrative' | 'System_Root';
  relationship_type:
    | 'local_logon'
    | 'rdp_access'
    | 'service_principal'
    | 'database_admin'
    | 'iam_assume_role'
    | 'ssh_certificate';
  escalation_possible: boolean;
  description: string;
}

export interface ControlRecord {
  control_id: string;
  control_name: string;
  control_category:
    | 'Multi_Factor_Authentication'
    | 'Network_Segmentation'
    | 'Vulnerability_Patching'
    | 'Privilege_Restriction'
    | 'Firewall_Rule'
    | 'Service_Hardening'
    | 'Zero_Trust_Access';
  description: string;
  deployment_cost: number; // Synthetic relative optimization cost (1 - 20)
  operational_friction: number; // Synthetic disruption penalty (1 - 10)
  affected_asset_types: string[];
  affected_edges: string[]; // edge_ids that this control severs or mitigates
  implementation_assumption: string;
}

export interface ScenarioDefinition {
  scenario_id: string;
  scenario_name: string;
  scenario_category: 'small' | 'financial' | 'large';
  seed: number;
  description: string;
  entry_point_asset_ids: string[];
  crown_jewel_asset_ids: string[];
  assets: SyntheticAssetRecord[];
  network_edges: NetworkEdgeRecord[];
  permissions: PermissionRecord[];
  controls: ControlRecord[];
  vulnerabilities: VulnerabilityRecord[];
}

/**
 * QuantumShield — Deterministic Synthetic Dataset Generator
 * Combines authentic real-world NVD CVE records with synthetic enterprise topologies.
 * Uses a seedable Pseudo-Random Number Generator (PRNG) for 100% reproducible benchmarks.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ControlRecord,
  CriticalityLevel,
  NetworkEdgeRecord,
  PermissionRecord,
  ScenarioDefinition,
  SyntheticAssetRecord,
  VulnerabilityRecord,
} from '../src/data/dataTypes';

// Seedable PRNG (Mulberry32)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert objects array to CSV string
function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = Array.isArray(val) ? val.join(';') : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [headers.join(',')];
  for (const row of rows) {
    csvRows.push(headers.map(h => escapeCell(row[h])).join(','));
  }
  return csvRows.join('\n');
}

export function generateAllDatasets(seed: number = 42) {
  const prng = mulberry32(seed);

  // 1. Read raw NVD snapshot
  const rawPath = path.resolve(process.cwd(), 'data/raw/nvd_cve_snapshot.json');
  if (!fs.existsSync(rawPath)) {
    throw new Error(`Raw NVD snapshot not found at ${rawPath}`);
  }

  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const rawCves: any[] = rawData.cves;

  const vulnerabilities: VulnerabilityRecord[] = rawCves.map(c => ({
    cve_id: c.cve_id,
    published_date: c.published_date,
    cvss_v3_base_score: c.cvss_v3_base_score,
    cvss_v3_vector: c.cvss_v3_vector,
    severity: c.severity,
    attack_vector: c.attack_vector,
    attack_complexity: c.attack_complexity,
    privileges_required: c.privileges_required,
    user_interaction: c.user_interaction,
    scope: c.scope,
    confidentiality_impact: c.confidentiality_impact,
    integrity_impact: c.integrity_impact,
    availability_impact: c.availability_impact,
    exploitability_subscore: c.exploitability_subscore,
    impact_subscore: c.impact_subscore,
    affected_product: c.affected_product,
    affected_category: c.affected_category,
    description: c.description,
    source_url: c.source_url,
    is_synthetic: false,
  }));

  const cveMap = new Map(vulnerabilities.map(v => [v.cve_id, v]));

  // -------------------------------------------------------------
  // Scenario 1: Small Enterprise (12 Assets)
  // -------------------------------------------------------------
  const smallAssets: SyntheticAssetRecord[] = [
    {
      asset_id: 'small_gw_01',
      asset_name: 'Edge Perimeter Gateway',
      asset_type: 'internet_gateway',
      business_role: 'External Border Router & Ingress Filter',
      criticality: 'HIGH',
      trust_level: 1,
      network_zone: 'perimeter_dmz',
      operating_environment: 'VyOS Linux Router',
      description: 'Border gateway facing public internet, routing inbound traffic to DMZ.',
      assigned_cves: ['CVE-2023-28771'],
    },
    {
      asset_id: 'small_web_01',
      asset_name: 'Corporate Web Portal',
      asset_type: 'web_server',
      business_role: 'Customer Marketing & Inquiry Frontend',
      criticality: 'HIGH',
      trust_level: 2,
      network_zone: 'perimeter_dmz',
      operating_environment: 'Apache HTTP 2.4.49 / Ubuntu LTS',
      description: 'Public facing web server hosting corporate website.',
      assigned_cves: ['CVE-2021-41773', 'CVE-2023-3824'],
    },
    {
      asset_id: 'small_app_01',
      asset_name: 'Business ERP Application Server',
      asset_type: 'application_server',
      business_role: 'Internal Work Order & Invoicing Processing',
      criticality: 'HIGH',
      trust_level: 3,
      network_zone: 'corporate_lan',
      operating_environment: 'Spring Boot 2.5 on OpenJDK 11',
      description: 'Application server handling internal billing and supplier logistics.',
      assigned_cves: ['CVE-2022-22965'],
    },
    {
      asset_id: 'small_ws_01',
      asset_name: 'Office Reception Workstation',
      asset_type: 'employee_workstation',
      business_role: 'Front-desk visitor check-in and email workstation',
      criticality: 'MEDIUM',
      trust_level: 2,
      network_zone: 'corporate_lan',
      operating_environment: 'Windows 10 Enterprise 21H2',
      description: 'End-user desktop used by office coordinator, receiving external emails.',
      assigned_cves: ['CVE-2024-21413', 'CVE-2022-30190'],
    },
    {
      asset_id: 'small_vpn_01',
      asset_name: 'Remote Access VPN Appliance',
      asset_type: 'vpn_gateway',
      business_role: 'Employee Remote Access Ingress',
      criticality: 'HIGH',
      trust_level: 2,
      network_zone: 'perimeter_dmz',
      operating_environment: 'Fortinet FortiOS SSL-VPN',
      description: 'SSL-VPN endpoint used by remote workers to dial into corporate network.',
      assigned_cves: ['CVE-2023-27997'],
    },
    {
      asset_id: 'small_auth_01',
      asset_name: 'Central Identity & LDAP Server',
      asset_type: 'authentication_server',
      business_role: 'User Authentication & Single Sign-On',
      criticality: 'CRITICAL',
      trust_level: 4,
      network_zone: 'management_vlan',
      operating_environment: 'OpenLDAP / Kerberos on Debian',
      description: 'Directory server validating enterprise user credentials.',
      assigned_cves: [],
    },
    {
      asset_id: 'small_api_01',
      asset_name: 'Internal Partner REST API',
      asset_type: 'internal_api_server',
      business_role: 'B2B order integration gateway',
      criticality: 'MEDIUM',
      trust_level: 3,
      network_zone: 'corporate_lan',
      operating_environment: 'Node.js Express / Docker',
      description: 'Middleware API bridging order requests with back-office databases.',
      assigned_cves: [],
    },
    {
      asset_id: 'small_db_gen_01',
      asset_name: 'General Operational Database',
      asset_type: 'general_database',
      business_role: 'Inventory & Inventory Catalog Data Store',
      criticality: 'MEDIUM',
      trust_level: 4,
      network_zone: 'corporate_lan',
      operating_environment: 'PostgreSQL 13 on Ubuntu',
      description: 'Relational database storing non-sensitive product inventory.',
      assigned_cves: [],
    },
    {
      asset_id: 'small_admin_01',
      asset_name: 'IT Administrative Bastion',
      asset_type: 'admin_server',
      business_role: 'Systems Management & Remote RDP Bastion',
      criticality: 'HIGH',
      trust_level: 4,
      network_zone: 'management_vlan',
      operating_environment: 'Windows Server 2019',
      description: 'Administrative jump box used for fleet management.',
      assigned_cves: ['CVE-2019-0708'],
    },
    {
      asset_id: 'small_db_fin_01',
      asset_name: 'Corporate Accounting & Payroll DB',
      asset_type: 'finance_database',
      business_role: 'Core General Ledger and Employee Bank Details',
      criticality: 'CRITICAL',
      trust_level: 5,
      network_zone: 'core_vault',
      operating_environment: 'Encrypted Microsoft SQL Server 2019',
      description: 'Crown Jewel storing company financial ledger and salary disbursements.',
      assigned_cves: [],
    },
    {
      asset_id: 'small_backup_01',
      asset_name: 'Nightly Backup Repository',
      asset_type: 'backup_server',
      business_role: 'Disaster Recovery Storage Repository',
      criticality: 'HIGH',
      trust_level: 4,
      network_zone: 'management_vlan',
      operating_environment: 'Veeam Backup Appliance on Linux',
      description: 'Local snapshot repository containing incremental database backups.',
      assigned_cves: [],
    },
    {
      asset_id: 'small_mon_01',
      asset_name: 'Network Monitoring & Syslog',
      asset_type: 'monitoring_server',
      business_role: 'SNMP Telemetry and Central Log Aggregator',
      criticality: 'LOW',
      trust_level: 3,
      network_zone: 'management_vlan',
      operating_environment: 'Zabbix / Elasticsearch',
      description: 'Monitors server heartbeats and ingests syslog streams.',
      assigned_cves: [],
    },
  ];

  const smallEdges: NetworkEdgeRecord[] = [
    {
      edge_id: 'e_s_01',
      source: 'small_gw_01',
      destination: 'small_web_01',
      relationship_type: 'network_traffic',
      service: 'HTTPS Ingress',
      protocol: 'TCP',
      port: 443,
      trust_transition: 'ingress',
      allowed: true,
      exploitable_cve_id: 'CVE-2021-41773',
      description: 'Public internet requests forwarded to DMZ web server.',
    },
    {
      edge_id: 'e_s_02',
      source: 'small_gw_01',
      destination: 'small_vpn_01',
      relationship_type: 'vpn_tunnel',
      service: 'SSL-VPN Portal',
      protocol: 'TCP',
      port: 10443,
      trust_transition: 'ingress',
      allowed: true,
      exploitable_cve_id: 'CVE-2023-27997',
      description: 'Remote worker VPN gateway exposed to internet.',
    },
    {
      edge_id: 'e_s_03',
      source: 'small_web_01',
      destination: 'small_app_01',
      relationship_type: 'api_call',
      service: 'Internal Backend API',
      protocol: 'HTTP',
      port: 8080,
      trust_transition: 'lateral_escalation',
      allowed: true,
      exploitable_cve_id: 'CVE-2022-22965',
      description: 'Web server communicates with Spring ERP application backend.',
    },
    {
      edge_id: 'e_s_04',
      source: 'small_vpn_01',
      destination: 'small_ws_01',
      relationship_type: 'network_traffic',
      service: 'LAN Tunnel Access',
      protocol: 'IP',
      port: 0,
      trust_transition: 'lateral_escalation',
      allowed: true,
      exploitable_cve_id: null,
      description: 'VPN clients bridge directly into Corporate LAN subnet.',
    },
    {
      edge_id: 'e_s_05',
      source: 'small_ws_01',
      destination: 'small_admin_01',
      relationship_type: 'remote_management',
      service: 'Remote Desktop',
      protocol: 'RDP',
      port: 3389,
      trust_transition: 'privilege_boundary',
      allowed: true,
      exploitable_cve_id: 'CVE-2019-0708',
      description: 'Workstation initiates remote desktop to administrative bastion.',
    },
    {
      edge_id: 'e_s_06',
      source: 'small_app_01',
      destination: 'small_api_01',
      relationship_type: 'api_call',
      service: 'Partner Data Exchange',
      protocol: 'HTTPS',
      port: 8443,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Application server queries internal order API.',
    },
    {
      edge_id: 'e_s_07',
      source: 'small_app_01',
      destination: 'small_db_gen_01',
      relationship_type: 'database_query',
      service: 'PostgreSQL Database',
      protocol: 'TCP',
      port: 5432,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: null,
      description: 'ERP application pulls product catalog from general DB.',
    },
    {
      edge_id: 'e_s_08',
      source: 'small_app_01',
      destination: 'small_db_fin_01',
      relationship_type: 'database_query',
      service: 'TDS SQL Connection',
      protocol: 'TCP',
      port: 1433,
      trust_transition: 'privilege_boundary',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Direct billing transaction writes to finance database.',
    },
    {
      edge_id: 'e_s_09',
      source: 'small_admin_01',
      destination: 'small_db_fin_01',
      relationship_type: 'remote_management',
      service: 'SQL Server Management',
      protocol: 'TCP',
      port: 1433,
      trust_transition: 'privilege_boundary',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Administrator console has unrestricted management access to Finance DB.',
    },
    {
      edge_id: 'e_s_10',
      source: 'small_admin_01',
      destination: 'small_auth_01',
      relationship_type: 'remote_management',
      service: 'Directory Administration',
      protocol: 'LDAPS',
      port: 636,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Admin manages user directory accounts.',
    },
    {
      edge_id: 'e_s_11',
      source: 'small_db_fin_01',
      destination: 'small_backup_01',
      relationship_type: 'replication',
      service: 'Backup Agent Push',
      protocol: 'TCP',
      port: 6162,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Nightly incremental backup replication of finance ledger.',
    },
    {
      edge_id: 'e_s_12',
      source: 'small_admin_01',
      destination: 'small_backup_01',
      relationship_type: 'remote_management',
      service: 'Backup Console Management',
      protocol: 'HTTPS',
      port: 9443,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Admin manages backup retention schedules.',
    },
  ];

  const smallPermissions: PermissionRecord[] = [
    {
      permission_id: 'perm_s_01',
      source_identity: 'user:receptionist',
      target_asset: 'small_ws_01',
      privilege_level: 'User',
      relationship_type: 'local_logon',
      escalation_possible: true,
      description: 'Local standard user privileges on front-desk computer.',
    },
    {
      permission_id: 'perm_s_02',
      source_identity: 'user:receptionist',
      target_asset: 'small_vpn_01',
      privilege_level: 'User',
      relationship_type: 'local_logon',
      escalation_possible: false,
      description: 'Standard VPN account credential.',
    },
    {
      permission_id: 'perm_s_03',
      source_identity: 'service:erp_daemon',
      target_asset: 'small_app_01',
      privilege_level: 'Execute',
      relationship_type: 'service_principal',
      escalation_possible: true,
      description: 'Local system service account running application server.',
    },
    {
      permission_id: 'perm_s_04',
      source_identity: 'service:erp_daemon',
      target_asset: 'small_db_fin_01',
      privilege_level: 'Write',
      relationship_type: 'database_admin',
      escalation_possible: false,
      description: 'Database connection credentials with INSERT/UPDATE rights.',
    },
    {
      permission_id: 'perm_s_05',
      source_identity: 'role:it_sysadmin',
      target_asset: 'small_admin_01',
      privilege_level: 'Administrative',
      relationship_type: 'rdp_access',
      escalation_possible: false,
      description: 'Domain administrator logon to management jump box.',
    },
    {
      permission_id: 'perm_s_06',
      source_identity: 'role:it_sysadmin',
      target_asset: 'small_db_fin_01',
      privilege_level: 'System_Root',
      relationship_type: 'database_admin',
      escalation_possible: false,
      description: 'Full database SA rights across finance repositories.',
    },
  ];

  const smallControls: ControlRecord[] = [
    {
      control_id: 'ctrl_s_patch_web',
      control_name: 'Emergency Web & PHP Patching',
      control_category: 'Vulnerability_Patching',
      description: 'Patch Apache HTTP Server (CVE-2021-41773) and PHP interpreter (CVE-2023-3824).',
      deployment_cost: 3,
      operational_friction: 1,
      affected_asset_types: ['web_server'],
      affected_edges: ['e_s_01'],
      implementation_assumption: 'Rolling container rebuild and automated smoke testing in DMZ.',
    },
    {
      control_id: 'ctrl_s_patch_vpn',
      control_name: 'VPN Firmware Update (FortiOS)',
      control_category: 'Vulnerability_Patching',
      description: 'Apply security patch for Fortinet FortiOS heap overflow (CVE-2023-27997).',
      deployment_cost: 4,
      operational_friction: 2,
      affected_asset_types: ['vpn_gateway'],
      affected_edges: ['e_s_02'],
      implementation_assumption: 'Scheduled 15-minute maintenance window for gateway reboot.',
    },
    {
      control_id: 'ctrl_s_mfa_vpn',
      control_name: 'FIDO2 Hardware MFA on VPN Gateway',
      control_category: 'Multi_Factor_Authentication',
      description: 'Mandate hardware FIDO2 authentication for all inbound SSL-VPN connections.',
      deployment_cost: 5,
      operational_friction: 3,
      affected_asset_types: ['vpn_gateway', 'employee_workstation'],
      affected_edges: ['e_s_02', 'e_s_04'],
      implementation_assumption: 'Hardware keys distributed to staff; biometric fallback enabled.',
    },
    {
      control_id: 'ctrl_s_seg_dmz',
      control_name: 'DMZ-to-LAN Strict Microsegmentation',
      control_category: 'Network_Segmentation',
      description: 'Block direct ingress from DMZ Web Server to internal ERP port 8080.',
      deployment_cost: 6,
      operational_friction: 3,
      affected_asset_types: ['web_server', 'application_server'],
      affected_edges: ['e_s_03'],
      implementation_assumption: 'Enforce stateful firewall proxy with request payload inspection.',
    },
    {
      control_id: 'ctrl_s_patch_rdp',
      control_name: 'Patch BlueKeep on Admin Jump Host',
      control_category: 'Vulnerability_Patching',
      description: 'Apply Microsoft security rollup remediating CVE-2019-0708 on administrative bastion.',
      deployment_cost: 3,
      operational_friction: 1,
      affected_asset_types: ['admin_server'],
      affected_edges: ['e_s_05'],
      implementation_assumption: 'Standard WSUS update cycle with automated regression rollback.',
    },
    {
      control_id: 'ctrl_s_vault_proxy',
      control_name: 'Finance DB Mutual-TLS Proxy Isolation',
      control_category: 'Zero_Trust_Access',
      description: 'Isolate Finance Database behind an Envoy mTLS proxy requiring signed JWT tokens.',
      deployment_cost: 8,
      operational_friction: 4,
      affected_asset_types: ['finance_database'],
      affected_edges: ['e_s_08', 'e_s_09'],
      implementation_assumption: 'All application and administrative queries pass through TLS client cert inspection.',
    },
  ];

  // -------------------------------------------------------------
  // Scenario 2: Financial Enterprise (18 Assets) — Main Hackathon Demo
  // -------------------------------------------------------------
  const finAssets: SyntheticAssetRecord[] = [
    {
      asset_id: 'fin_inet_gw',
      asset_name: 'Border BGP Ingress Gateway',
      asset_type: 'internet_gateway',
      business_role: 'Public Internet Border Peering Router',
      criticality: 'HIGH',
      trust_level: 1,
      network_zone: 'perimeter_dmz',
      operating_environment: 'Cisco IOS-XE Border Controller',
      description: 'High-throughput border router handling public payment traffic.',
      assigned_cves: [],
    },
    {
      asset_id: 'fin_adc_citrix',
      asset_name: 'Public Ingress Citrix NetScaler ADC',
      asset_type: 'internet_gateway',
      business_role: 'Application Delivery Controller & SSL Offloader',
      criticality: 'HIGH',
      trust_level: 2,
      network_zone: 'perimeter_dmz',
      operating_environment: 'Citrix NetScaler ADC 13.1',
      description: 'Terminates client HTTPS sessions and routes to web tier.',
      assigned_cves: ['CVE-2023-4966', 'CVE-2023-3519'],
    },
    {
      asset_id: 'fin_web_portal',
      asset_name: 'Online Banking Customer Portal',
      asset_type: 'web_server',
      business_role: 'Customer Account Login & Balance Inquiry Web App',
      criticality: 'HIGH',
      trust_level: 2,
      network_zone: 'perimeter_dmz',
      operating_environment: 'Nginx + Node.js Next.js SSR',
      description: 'Front-end web portal serving retail banking customers.',
      assigned_cves: ['CVE-2021-44228'], // Log4j in Java telemetry agent
    },
    {
      asset_id: 'fin_mft_gateway',
      asset_name: 'External File Transfer Gateway (MOVEit)',
      asset_type: 'internal_api_server',
      business_role: 'B2B Automated Clearing House (ACH) File Exchange',
      criticality: 'HIGH',
      trust_level: 2,
      network_zone: 'perimeter_dmz',
      operating_environment: 'Progress MOVEit Transfer 2021',
      description: 'Transfers daily wire clearing files with external Federal Reserve systems.',
      assigned_cves: ['CVE-2023-34362'],
    },
    {
      asset_id: 'fin_ws_trader',
      asset_name: 'Institutional Trader Workstation',
      asset_type: 'employee_workstation',
      business_role: 'Securities and Bond Trading Terminal',
      criticality: 'MEDIUM',
      trust_level: 2,
      network_zone: 'corporate_lan',
      operating_environment: 'Windows 11 Enterprise 22H2',
      description: 'Trader desktop running Bloomberg terminal and Outlook email.',
      assigned_cves: ['CVE-2024-21413', 'CVE-2023-23397', 'CVE-2021-36934'],
    },
    {
      asset_id: 'fin_ws_ops',
      asset_name: 'Settlement Operations Workstation',
      asset_type: 'employee_workstation',
      business_role: 'Back-office payment reconciliation desktop',
      criticality: 'MEDIUM',
      trust_level: 2,
      network_zone: 'corporate_lan',
      operating_environment: 'Windows 10 Enterprise 21H2',
      description: 'Operational analyst workstation processing exception wire queues.',
      assigned_cves: ['CVE-2022-30190', 'CVE-2021-34527'],
    },
    {
      asset_id: 'fin_vpn_bastion',
      asset_name: 'Engineering Management VPN Bastion',
      asset_type: 'vpn_gateway',
      business_role: 'DevOps & DBA Remote Administration Access',
      criticality: 'HIGH',
      trust_level: 2,
      network_zone: 'perimeter_dmz',
      operating_environment: 'FortiOS 7.0 SSL-VPN Gateway',
      description: 'Isolated VPN gateway reserved for system administrators.',
      assigned_cves: ['CVE-2023-27997'],
    },
    {
      asset_id: 'fin_ad_dc01',
      asset_name: 'Primary Active Directory Domain Controller',
      asset_type: 'domain_identity_server',
      business_role: 'Enterprise Kerberos, LDAP, and Group Policy Authority',
      criticality: 'CRITICAL',
      trust_level: 4,
      network_zone: 'management_vlan',
      operating_environment: 'Windows Server 2022 Active Directory',
      description: 'Central domain controller managing all corporate and tier-1 server accounts.',
      assigned_cves: ['CVE-2020-1472', 'CVE-2022-26925'], // Zerologon & PetitPotam
    },
    {
      asset_id: 'fin_app_txengine',
      asset_name: 'Core Transaction Routing Engine',
      asset_type: 'application_server',
      business_role: 'Real-time Payment Clearing & Fraud Scoring',
      criticality: 'HIGH',
      trust_level: 3,
      network_zone: 'restricted_pci',
      operating_environment: 'Java Spring Cloud / Kubernetes Worker',
      description: 'Validates cryptographic payment signatures and authorizes wire debits.',
      assigned_cves: ['CVE-2022-22965'],
    },
    {
      asset_id: 'fin_msg_broker',
      asset_name: 'High-Volume Payment Event Broker',
      asset_type: 'internal_api_server',
      business_role: 'Asynchronous Settlement Message Queue',
      criticality: 'HIGH',
      trust_level: 3,
      network_zone: 'restricted_pci',
      operating_environment: 'Apache ActiveMQ OpenWire 5.17',
      description: 'Distributes settlement events between clearing microservices.',
      assigned_cves: ['CVE-2023-46604'],
    },
    {
      asset_id: 'fin_cache_redis',
      asset_name: 'Active Session & Auth Token Cache',
      asset_type: 'application_server',
      business_role: 'In-Memory JWT & Session Revocation Store',
      criticality: 'HIGH',
      trust_level: 3,
      network_zone: 'restricted_pci',
      operating_environment: 'Redis Cluster 6.2 on Alpine Linux',
      description: 'Stores active bearer tokens for online banking sessions.',
      assigned_cves: [],
    },
    {
      asset_id: 'fin_vault_kms',
      asset_name: 'Hardware Security Module & Secrets Vault',
      asset_type: 'admin_server',
      business_role: 'Cryptographic Key Management & Database Encryption Keys',
      criticality: 'CRITICAL',
      trust_level: 5,
      network_zone: 'core_vault',
      operating_environment: 'HashiCorp Vault Enterprise + Thales HSM',
      description: 'Stores root encryption keys for the core ledger.',
      assigned_cves: [],
    },
    {
      asset_id: 'fin_admin_jump',
      asset_name: 'Tier-0 Privileged Access Bastion',
      asset_type: 'admin_server',
      business_role: 'Privileged Access Workstation for DBAs',
      criticality: 'HIGH',
      trust_level: 4,
      network_zone: 'management_vlan',
      operating_environment: 'Hardened Windows Server 2022',
      description: 'Jump host enforcing session recording for database administrators.',
      assigned_cves: ['CVE-2019-0708'],
    },
    {
      asset_id: 'fin_db_ledger',
      asset_name: 'Core Financial Ledger & Customer Balance DB',
      asset_type: 'finance_database',
      business_role: 'Master Double-Entry Bookkeeping and Real-Time Wire Ledger',
      criticality: 'CRITICAL',
      trust_level: 5,
      network_zone: 'core_vault',
      operating_environment: 'Oracle Exadata Database Machine / Linux',
      description: 'The definitive Crown Jewel of the enterprise: stores $4.2B in customer deposits.',
      assigned_cves: [],
    },
    {
      asset_id: 'fin_db_audit',
      asset_name: 'Immutable Financial Audit Trail Store',
      asset_type: 'general_database',
      business_role: 'Compliance & SEC Regulatory Audit Logs',
      criticality: 'HIGH',
      trust_level: 4,
      network_zone: 'core_vault',
      operating_environment: 'PostgreSQL WORM Storage',
      description: 'Write-Once-Read-Many regulatory log archive.',
      assigned_cves: [],
    },
    {
      asset_id: 'fin_backup_vault',
      asset_name: 'Air-Gapped Cold Backup Vault',
      asset_type: 'backup_server',
      business_role: 'Ransomware Recovery Snapshot Repository',
      criticality: 'HIGH',
      trust_level: 5,
      network_zone: 'core_vault',
      operating_environment: 'Rubrik Zero Trust Backup Appliance',
      description: 'Immutable snapshots of core ledger databases.',
      assigned_cves: [],
    },
    {
      asset_id: 'fin_siem_soc',
      asset_name: 'Enterprise SIEM & EDR Console',
      asset_type: 'monitoring_server',
      business_role: 'Security Operations Center Detection Platform',
      criticality: 'HIGH',
      trust_level: 4,
      network_zone: 'management_vlan',
      operating_environment: 'Splunk Enterprise / CrowdStrike Agent',
      description: 'Ingests security telemetry from all domain tiers.',
      assigned_cves: [],
    },
    {
      asset_id: 'fin_collab_wiki',
      asset_name: 'Internal Engineering Confluence Wiki',
      asset_type: 'web_server',
      business_role: 'Internal Architecture & Runbook Knowledge Base',
      criticality: 'MEDIUM',
      trust_level: 3,
      network_zone: 'corporate_lan',
      operating_environment: 'Atlassian Confluence Server 7.18',
      description: 'Internal documentation portal holding architecture runbooks.',
      assigned_cves: ['CVE-2023-22515', 'CVE-2022-26134'],
    },
  ];

  const finEdges: NetworkEdgeRecord[] = [
    {
      edge_id: 'e_f_01',
      source: 'fin_inet_gw',
      destination: 'fin_adc_citrix',
      relationship_type: 'network_traffic',
      service: 'HTTPS Ingress',
      protocol: 'TCP',
      port: 443,
      trust_transition: 'ingress',
      allowed: true,
      exploitable_cve_id: 'CVE-2023-4966',
      description: 'Public traffic forwarded to Citrix ADC frontend.',
    },
    {
      edge_id: 'e_f_02',
      source: 'fin_inet_gw',
      destination: 'fin_mft_gateway',
      relationship_type: 'api_call',
      service: 'ACH File Delivery',
      protocol: 'HTTPS',
      port: 443,
      trust_transition: 'ingress',
      allowed: true,
      exploitable_cve_id: 'CVE-2023-34362',
      description: 'External bank file exchange pushes wire batches to MOVEit.',
    },
    {
      edge_id: 'e_f_03',
      source: 'fin_adc_citrix',
      destination: 'fin_web_portal',
      relationship_type: 'network_traffic',
      service: 'Reverse Proxy Routing',
      protocol: 'HTTP',
      port: 8080,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: 'CVE-2021-44228',
      description: 'Citrix ADC proxies customer login traffic to portal frontend.',
    },
    {
      edge_id: 'e_f_04',
      source: 'fin_web_portal',
      destination: 'fin_cache_redis',
      relationship_type: 'database_query',
      service: 'Session Validation',
      protocol: 'TCP',
      port: 6379,
      trust_transition: 'lateral_escalation',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Web portal reads and writes customer session tokens.',
    },
    {
      edge_id: 'e_f_05',
      source: 'fin_web_portal',
      destination: 'fin_app_txengine',
      relationship_type: 'api_call',
      service: 'Transaction Dispatch',
      protocol: 'gRPC',
      port: 50051,
      trust_transition: 'lateral_escalation',
      allowed: true,
      exploitable_cve_id: 'CVE-2022-22965',
      description: 'Portal dispatches money transfer requests to payment engine.',
    },
    {
      edge_id: 'e_f_06',
      source: 'fin_mft_gateway',
      destination: 'fin_msg_broker',
      relationship_type: 'api_call',
      service: 'ACH Ingestion Queue',
      protocol: 'OpenWire TCP',
      port: 61616,
      trust_transition: 'lateral_escalation',
      allowed: true,
      exploitable_cve_id: 'CVE-2023-46604',
      description: 'MOVEit pushes received wire files to ActiveMQ queue.',
    },
    {
      edge_id: 'e_f_07',
      source: 'fin_msg_broker',
      destination: 'fin_app_txengine',
      relationship_type: 'api_call',
      service: 'Queue Processing Event',
      protocol: 'TCP',
      port: 9000,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Transaction engine consumes clearing events from queue.',
    },
    {
      edge_id: 'e_f_08',
      source: 'fin_ws_trader',
      destination: 'fin_ad_dc01',
      relationship_type: 'credential_relay',
      service: 'Kerberos Authentication',
      protocol: 'Kerberos / LDAP',
      port: 88,
      trust_transition: 'privilege_boundary',
      allowed: true,
      exploitable_cve_id: 'CVE-2020-1472',
      description: 'Trader desktop requests Kerberos TGT tickets from domain controller.',
    },
    {
      edge_id: 'e_f_09',
      source: 'fin_ws_trader',
      destination: 'fin_collab_wiki',
      relationship_type: 'network_traffic',
      service: 'Confluence HTTP',
      protocol: 'HTTP',
      port: 8090,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: 'CVE-2023-22515',
      description: 'Trader accesses internal documentation portal.',
    },
    {
      edge_id: 'e_f_10',
      source: 'fin_collab_wiki',
      destination: 'fin_admin_jump',
      relationship_type: 'credential_relay',
      service: 'Hardcoded SSH Keys',
      protocol: 'SSH',
      port: 22,
      trust_transition: 'privilege_boundary',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Confluence config file leaks administrative SSH keypair for jump host.',
    },
    {
      edge_id: 'e_f_11',
      source: 'fin_ws_ops',
      destination: 'fin_vpn_bastion',
      relationship_type: 'vpn_tunnel',
      service: 'Admin Bastion Ingress',
      protocol: 'TCP',
      port: 443,
      trust_transition: 'ingress',
      allowed: true,
      exploitable_cve_id: 'CVE-2023-27997',
      description: 'Ops staff initiates VPN to engineering bastion.',
    },
    {
      edge_id: 'e_f_12',
      source: 'fin_vpn_bastion',
      destination: 'fin_admin_jump',
      relationship_type: 'remote_management',
      service: 'RDP Session',
      protocol: 'RDP',
      port: 3389,
      trust_transition: 'lateral_escalation',
      allowed: true,
      exploitable_cve_id: 'CVE-2019-0708',
      description: 'VPN tunnel forwards RDP connection to administrative jump box.',
    },
    {
      edge_id: 'e_f_13',
      source: 'fin_ad_dc01',
      destination: 'fin_admin_jump',
      relationship_type: 'remote_management',
      service: 'Domain Controller Admin Push',
      protocol: 'WinRM / SMB',
      port: 5985,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Domain admin tools synchronize with bastion.',
    },
    {
      edge_id: 'e_f_14',
      source: 'fin_admin_jump',
      destination: 'fin_vault_kms',
      relationship_type: 'remote_management',
      service: 'Vault Management API',
      protocol: 'HTTPS',
      port: 8200,
      trust_transition: 'privilege_boundary',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Administrator rotates or extracts master encryption keys.',
    },
    {
      edge_id: 'e_f_15',
      source: 'fin_app_txengine',
      destination: 'fin_vault_kms',
      relationship_type: 'api_call',
      service: 'Transit Key Decryption',
      protocol: 'HTTPS',
      port: 8200,
      trust_transition: 'privilege_boundary',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Transaction engine queries Vault to decrypt customer card numbers.',
    },
    {
      edge_id: 'e_f_16',
      source: 'fin_app_txengine',
      destination: 'fin_db_ledger',
      relationship_type: 'database_query',
      service: 'Core Ledger SQL Transaction',
      protocol: 'SQL*Net / TCP',
      port: 1521,
      trust_transition: 'privilege_boundary',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Direct SQL execution writing balance debits and credits.',
    },
    {
      edge_id: 'e_f_17',
      source: 'fin_admin_jump',
      destination: 'fin_db_ledger',
      relationship_type: 'remote_management',
      service: 'DBA Administrative SQL Console',
      protocol: 'SQL*Net / TCP',
      port: 1521,
      trust_transition: 'privilege_boundary',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Direct administrative DBA console with unmonitored dump rights.',
    },
    {
      edge_id: 'e_f_18',
      source: 'fin_vault_kms',
      destination: 'fin_db_ledger',
      relationship_type: 'database_query',
      service: 'Transparent Data Encryption (TDE)',
      protocol: 'Internal IPC',
      port: 0,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: null,
      description: 'HSM unlocks transparent database encryption tablespaces.',
    },
    {
      edge_id: 'e_f_19',
      source: 'fin_db_ledger',
      destination: 'fin_backup_vault',
      relationship_type: 'replication',
      service: 'Continuous Data Replication',
      protocol: 'TLS Storage',
      port: 443,
      trust_transition: 'same_zone',
      allowed: true,
      exploitable_cve_id: null,
      description: 'Replicates real-time write-ahead logs to backup vault.',
    },
  ];

  const finPermissions: PermissionRecord[] = [
    {
      permission_id: 'perm_f_01',
      source_identity: 'user:trader_corp',
      target_asset: 'fin_ws_trader',
      privilege_level: 'User',
      relationship_type: 'local_logon',
      escalation_possible: true,
      description: 'Standard trader domain account login.',
    },
    {
      permission_id: 'perm_f_02',
      source_identity: 'user:ops_clerk',
      target_asset: 'fin_ws_ops',
      privilege_level: 'User',
      relationship_type: 'local_logon',
      escalation_possible: true,
      description: 'Settlement clerk standard domain login.',
    },
    {
      permission_id: 'perm_f_03',
      source_identity: 'service:netscaler_proxy',
      target_asset: 'fin_adc_citrix',
      privilege_level: 'Administrative',
      relationship_type: 'service_principal',
      escalation_possible: false,
      description: 'ADC root daemon process.',
    },
    {
      permission_id: 'perm_f_04',
      source_identity: 'service:tx_engine_svc',
      target_asset: 'fin_app_txengine',
      privilege_level: 'Execute',
      relationship_type: 'service_principal',
      escalation_possible: true,
      description: 'Kubernetes worker container runtime account.',
    },
    {
      permission_id: 'perm_f_05',
      source_identity: 'service:tx_engine_svc',
      target_asset: 'fin_db_ledger',
      privilege_level: 'Write',
      relationship_type: 'database_admin',
      escalation_possible: false,
      description: 'Oracle database application schema user (LEDGER_APP).',
    },
    {
      permission_id: 'perm_f_06',
      source_identity: 'role:domain_admin',
      target_asset: 'fin_ad_dc01',
      privilege_level: 'System_Root',
      relationship_type: 'local_logon',
      escalation_possible: false,
      description: 'Active Directory Enterprise Admins group member.',
    },
    {
      permission_id: 'perm_f_07',
      source_identity: 'role:domain_admin',
      target_asset: 'fin_admin_jump',
      privilege_level: 'Administrative',
      relationship_type: 'rdp_access',
      escalation_possible: false,
      description: 'Administrative RDP group permissions on bastion.',
    },
    {
      permission_id: 'perm_f_08',
      source_identity: 'role:master_dba',
      target_asset: 'fin_admin_jump',
      privilege_level: 'Administrative',
      relationship_type: 'rdp_access',
      escalation_possible: false,
      description: 'DBA team bastion access.',
    },
    {
      permission_id: 'perm_f_09',
      source_identity: 'role:master_dba',
      target_asset: 'fin_db_ledger',
      privilege_level: 'System_Root',
      relationship_type: 'database_admin',
      escalation_possible: false,
      description: 'SYSDBA root administrative rights on core financial database.',
    },
    {
      permission_id: 'perm_f_10',
      source_identity: 'role:secops_analyst',
      target_asset: 'fin_siem_soc',
      privilege_level: 'Administrative',
      relationship_type: 'local_logon',
      escalation_possible: false,
      description: 'SIEM management privileges.',
    },
  ];

  const finControls: ControlRecord[] = [
    {
      control_id: 'ctrl_f_patch_citrix',
      control_name: 'Patch Citrix NetScaler Bleed & RCE',
      control_category: 'Vulnerability_Patching',
      description: 'Upgrade Citrix ADC firmware mitigating CVE-2023-4966 (Citrix Bleed) and CVE-2023-3519 unauthenticated RCE.',
      deployment_cost: 5,
      operational_friction: 2,
      affected_asset_types: ['internet_gateway'],
      affected_edges: ['e_f_01'],
      implementation_assumption: 'Rolling cluster update across HA gateway pair with zero packet drops.',
    },
    {
      control_id: 'ctrl_f_patch_moveit',
      control_name: 'MOVEit SQLi Remediation & WAF Virtual Patch',
      control_category: 'Vulnerability_Patching',
      description: 'Patch MOVEit Transfer (CVE-2023-34362) and enforce Cloud WAF regex filtering on payload headers.',
      deployment_cost: 4,
      operational_friction: 1,
      affected_asset_types: ['internal_api_server'],
      affected_edges: ['e_f_02'],
      implementation_assumption: 'Vendor hotfix applied; WAF rule deployed with zero legitimate ACH transfer disruption.',
    },
    {
      control_id: 'ctrl_f_patch_log4j',
      control_name: 'Log4j Enterprise Upgrade (v2.17.1)',
      control_category: 'Vulnerability_Patching',
      description: 'Upgrade Log4j libraries across online banking web portals to remediate JNDI lookup RCE (CVE-2021-44228).',
      deployment_cost: 6,
      operational_friction: 2,
      affected_asset_types: ['web_server'],
      affected_edges: ['e_f_03'],
      implementation_assumption: 'CI/CD automated dependency bump and container image rebuild.',
    },
    {
      control_id: 'ctrl_f_seg_web_app',
      control_name: 'PCI-DSS Network Microsegmentation',
      control_category: 'Network_Segmentation',
      description: 'Isolate perimeter web portal from payment transaction engine using Calico microsegmentation and mTLS.',
      deployment_cost: 7,
      operational_friction: 3,
      affected_asset_types: ['web_server', 'application_server'],
      affected_edges: ['e_f_05'],
      implementation_assumption: 'Traffic restricted to verified SPIFFE/SPIRE mTLS identities only.',
    },
    {
      control_id: 'ctrl_f_patch_activemq',
      control_name: 'Apache ActiveMQ OpenWire Hardening',
      control_category: 'Service_Hardening',
      description: 'Upgrade ActiveMQ (CVE-2023-46604) and disable insecure class serialization over port 61616.',
      deployment_cost: 4,
      operational_friction: 2,
      affected_asset_types: ['internal_api_server'],
      affected_edges: ['e_f_06'],
      implementation_assumption: 'Service configuration update with TLS mutual authentication required for message producers.',
    },
    {
      control_id: 'ctrl_f_patch_zerologon',
      control_name: 'Enforce Secure Netlogon & RPC Sealing',
      control_category: 'Vulnerability_Patching',
      description: 'Enforce Microsoft Netlogon secure channel enforcement mode blocking Zerologon (CVE-2020-1472).',
      deployment_cost: 5,
      operational_friction: 2,
      affected_asset_types: ['domain_identity_server'],
      affected_edges: ['e_f_08'],
      implementation_assumption: 'Active Directory registry policy enforced; legacy non-compliant clients isolated.',
    },
    {
      control_id: 'ctrl_f_patch_confluence',
      control_name: 'Confluence OGNL & Auth Bypass Patch',
      control_category: 'Vulnerability_Patching',
      description: 'Apply security patches for CVE-2023-22515 and CVE-2022-26134 on internal engineering wiki.',
      deployment_cost: 3,
      operational_friction: 1,
      affected_asset_types: ['web_server'],
      affected_edges: ['e_f_09'],
      implementation_assumption: 'Internal documentation server rebooted during scheduled maintenance.',
    },
    {
      control_id: 'ctrl_f_mfa_jump',
      control_name: 'FIDO2 Hardware MFA on Privileged Bastion',
      control_category: 'Multi_Factor_Authentication',
      description: 'Enforce hardware FIDO2 key authentication for all RDP access to administrative jump box.',
      deployment_cost: 6,
      operational_friction: 3,
      affected_asset_types: ['admin_server'],
      affected_edges: ['e_f_12', 'e_f_13'],
      implementation_assumption: 'All DBAs and Sysadmins issued physical YubiKeys; password-only RDP disabled.',
    },
    {
      control_id: 'ctrl_f_zt_ledger_proxy',
      control_name: 'Core Ledger Zero-Trust SQL Inspection Proxy',
      control_category: 'Zero_Trust_Access',
      description: 'Enforce inline SQL firewall proxy with dynamic query rate-limiting directly in front of Core Ledger DB.',
      deployment_cost: 9,
      operational_friction: 4,
      affected_asset_types: ['finance_database'],
      affected_edges: ['e_f_16', 'e_f_17'],
      implementation_assumption: 'Terminates unauthorized SQL bulk dumps (>500 rows) and enforces mTLS.',
    },
    {
      control_id: 'ctrl_f_vault_short_lease',
      control_name: 'Vault Ephemeral Dynamic Leases',
      control_category: 'Privilege_Restriction',
      description: 'Transition static database passwords to 15-minute dynamic ephemeral credentials generated by Vault.',
      deployment_cost: 7,
      operational_friction: 3,
      affected_asset_types: ['admin_server', 'finance_database'],
      affected_edges: ['e_f_14', 'e_f_15'],
      implementation_assumption: 'Microservices obtain transient short-lived database tokens via STS assume-role.',
    },
  ];

  // -------------------------------------------------------------
  // Scenario 3: Large Enterprise (30 Assets) — Scalability & Stress
  // -------------------------------------------------------------
  const largeAssets: SyntheticAssetRecord[] = [];
  const largeEdges: NetworkEdgeRecord[] = [];
  const largePermissions: PermissionRecord[] = [];
  const largeControls: ControlRecord[] = [];

  // Generate 30 deterministic assets using PRNG
  const zoneList: SyntheticAssetRecord['network_zone'][] = [
    'external_internet',
    'perimeter_dmz',
    'corporate_lan',
    'management_vlan',
    'restricted_pci',
    'core_vault',
  ];

  const typesList: SyntheticAssetRecord['asset_type'][] = [
    'internet_gateway',
    'web_server',
    'application_server',
    'employee_workstation',
    'vpn_gateway',
    'authentication_server',
    'domain_identity_server',
    'admin_server',
    'internal_api_server',
    'general_database',
    'finance_database',
    'backup_server',
    'monitoring_server',
  ];

  for (let i = 1; i <= 30; i++) {
    const isCrownJewel = i === 30;
    const isEntry = i === 1;
    const zone = isEntry
      ? 'perimeter_dmz'
      : isCrownJewel
      ? 'core_vault'
      : zoneList[1 + Math.floor(prng() * 4)];
    const assetType = isEntry
      ? 'internet_gateway'
      : isCrownJewel
      ? 'finance_database'
      : typesList[1 + Math.floor(prng() * (typesList.length - 2))];

    const crit: CriticalityLevel = isCrownJewel
      ? 'CRITICAL'
      : isEntry
      ? 'HIGH'
      : (['LOW', 'MEDIUM', 'HIGH'][Math.floor(prng() * 3)] as CriticalityLevel);

    const cveSelection =
      !isCrownJewel && prng() > 0.4
        ? [vulnerabilities[Math.floor(prng() * vulnerabilities.length)].cve_id]
        : [];

    largeAssets.push({
      asset_id: `large_asset_${i.toString().padStart(2, '0')}`,
      asset_name: isCrownJewel
        ? 'Enterprise Central Core Ledger & ERP Database'
        : isEntry
        ? 'Global Edge Traffic Dispatcher'
        : `Enterprise Host Node ${i} (${assetType})`,
      asset_type: assetType,
      business_role: isCrownJewel
        ? 'Mission Critical Crown Jewel'
        : isEntry
        ? 'Perimeter Ingress Point'
        : `Departmental workload node ${i}`,
      criticality: crit,
      trust_level: isCrownJewel ? 5 : isEntry ? 1 : 1 + Math.floor(prng() * 4),
      network_zone: zone,
      operating_environment: `Standard Enterprise OS Tier ${i % 3}`,
      description: `Synthetic asset ${i} in large benchmark enterprise topology.`,
      assigned_cves: cveSelection,
    });
  }

  // Connect large assets deterministically (feed-forward multi-tier DAG)
  let edgeCounter = 1;
  for (let i = 1; i < 30; i++) {
    // Connect to 2-3 higher index nodes to ensure paths reach node 30 without cycles
    const targets = [
      Math.min(30, i + 1 + Math.floor(prng() * 3)),
      Math.min(30, i + 2 + Math.floor(prng() * 4)),
    ];

    for (const tgt of Array.from(new Set(targets))) {
      if (tgt <= 30 && tgt !== i) {
        const edgeId = `e_l_${edgeCounter.toString().padStart(3, '0')}`;
        const sourceAsset = largeAssets[i - 1];
        const assignedCve = sourceAsset.assigned_cves[0] || null;

        largeEdges.push({
          edge_id: edgeId,
          source: sourceAsset.asset_id,
          destination: largeAssets[tgt - 1].asset_id,
          relationship_type:
            tgt === 30 ? 'database_query' : prng() > 0.5 ? 'network_traffic' : 'api_call',
          service: `Port ${1000 + (edgeCounter % 9000)}`,
          protocol: 'TCP',
          port: 1000 + (edgeCounter % 9000),
          trust_transition: tgt === 30 ? 'privilege_boundary' : 'lateral_escalation',
          allowed: true,
          exploitable_cve_id: assignedCve,
          description: `Synthetic network transition from ${sourceAsset.asset_id} to ${largeAssets[tgt - 1].asset_id}`,
        });
        edgeCounter++;
      }
    }
  }

  // Create 16 large defensive controls covering edge subsets
  for (let c = 1; c <= 16; c++) {
    const coveredEdges = largeEdges
      .filter((_, idx) => idx % 16 === c - 1 || (idx + 3) % 16 === c - 1)
      .map(e => e.edge_id);

    largeControls.push({
      control_id: `ctrl_l_${c.toString().padStart(2, '0')}`,
      control_name: `Enterprise Security Control ${c}`,
      control_category:
        c % 5 === 0
          ? 'Multi_Factor_Authentication'
          : c % 4 === 0
          ? 'Network_Segmentation'
          : c % 3 === 0
          ? 'Zero_Trust_Access'
          : 'Vulnerability_Patching',
      description: `Comprehensive defensive hardening control covering cluster ${c}.`,
      deployment_cost: 3 + Math.floor(prng() * 12),
      operational_friction: 1 + Math.floor(prng() * 6),
      affected_asset_types: ['application_server', 'database'],
      affected_edges: coveredEdges,
      implementation_assumption: `Enterprise policy deployment bundle ${c}.`,
    });
  }

  // Large permissions
  for (let p = 1; p <= 15; p++) {
    largePermissions.push({
      permission_id: `perm_l_${p.toString().padStart(2, '0')}`,
      source_identity: `role:enterprise_operator_${p}`,
      target_asset: largeAssets[p % 30].asset_id,
      privilege_level: p % 4 === 0 ? 'Administrative' : 'User',
      relationship_type: p % 3 === 0 ? 'rdp_access' : 'local_logon',
      escalation_possible: p % 2 === 0,
      description: `Enterprise operational permission assignment ${p}.`,
    });
  }

  // Assemble the 3 Scenarios
  const scenarioSmall: ScenarioDefinition = {
    scenario_id: 'small_enterprise',
    scenario_name: 'Scenario 1: Small Enterprise Network',
    scenario_category: 'small',
    seed,
    description: 'Fast demo topology consisting of 12 assets, perimeter gateway, web tier, and corporate accounting database.',
    entry_point_asset_ids: ['small_gw_01'],
    crown_jewel_asset_ids: ['small_db_fin_01'],
    assets: smallAssets,
    network_edges: smallEdges,
    permissions: smallPermissions,
    controls: smallControls,
    vulnerabilities: vulnerabilities.filter(v =>
      smallAssets.some(a => a.assigned_cves.includes(v.cve_id))
    ),
  };

  const scenarioFinancial: ScenarioDefinition = {
    scenario_id: 'financial_enterprise',
    scenario_name: 'Scenario 2: Financial Enterprise Banking & Transaction Infrastructure',
    scenario_category: 'financial',
    seed,
    description: 'Flagship hackathon scenario: 18 assets, Citrix ADC ingress, NetScaler Bleed, Confluence, Active Directory Zerologon, and CRITICAL Core Ledger database.',
    entry_point_asset_ids: ['fin_inet_gw', 'fin_ws_trader'],
    crown_jewel_asset_ids: ['fin_db_ledger'],
    assets: finAssets,
    network_edges: finEdges,
    permissions: finPermissions,
    controls: finControls,
    vulnerabilities: vulnerabilities.filter(v =>
      finAssets.some(a => a.assigned_cves.includes(v.cve_id))
    ),
  };

  const scenarioLarge: ScenarioDefinition = {
    scenario_id: 'large_enterprise',
    scenario_name: 'Scenario 3: Large Multi-Tier Enterprise Infrastructure',
    scenario_category: 'large',
    seed,
    description: 'Scalability benchmark scenario: 30 assets, multi-zone feed-forward DAG with 16 defensive controls.',
    entry_point_asset_ids: ['large_asset_01'],
    crown_jewel_asset_ids: ['large_asset_30'],
    assets: largeAssets,
    network_edges: largeEdges,
    permissions: largePermissions,
    controls: largeControls,
    vulnerabilities,
  };

  // Combine all unique assets, edges, permissions, controls for processed CSVs
  const allAssetsMap = new Map<string, SyntheticAssetRecord>();
  [...smallAssets, ...finAssets, ...largeAssets].forEach(a => allAssetsMap.set(a.asset_id, a));

  const allEdgesMap = new Map<string, NetworkEdgeRecord>();
  [...smallEdges, ...finEdges, ...largeEdges].forEach(e => allEdgesMap.set(e.edge_id, e));

  const allPermsMap = new Map<string, PermissionRecord>();
  [...smallPermissions, ...finPermissions, ...largePermissions].forEach(p =>
    allPermsMap.set(p.permission_id, p)
  );

  const allControlsMap = new Map<string, ControlRecord>();
  [...smallControls, ...finControls, ...largeControls].forEach(c => allControlsMap.set(c.control_id, c));

  // Write out files
  const processedDir = path.resolve(process.cwd(), 'data/processed');
  const scenariosDir = path.resolve(process.cwd(), 'data/scenarios');

  fs.mkdirSync(processedDir, { recursive: true });
  fs.mkdirSync(scenariosDir, { recursive: true });

  fs.writeFileSync(
    path.join(processedDir, 'vulnerabilities.csv'),
    toCsv(vulnerabilities),
    'utf8'
  );
  fs.writeFileSync(
    path.join(processedDir, 'assets.csv'),
    toCsv(Array.from(allAssetsMap.values())),
    'utf8'
  );
  fs.writeFileSync(
    path.join(processedDir, 'network_edges.csv'),
    toCsv(Array.from(allEdgesMap.values())),
    'utf8'
  );
  fs.writeFileSync(
    path.join(processedDir, 'permissions.csv'),
    toCsv(Array.from(allPermsMap.values())),
    'utf8'
  );
  fs.writeFileSync(
    path.join(processedDir, 'controls.csv'),
    toCsv(Array.from(allControlsMap.values())),
    'utf8'
  );

  fs.writeFileSync(
    path.join(scenariosDir, 'small.json'),
    JSON.stringify(scenarioSmall, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(scenariosDir, 'financial.json'),
    JSON.stringify(scenarioFinancial, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(scenariosDir, 'large.json'),
    JSON.stringify(scenarioLarge, null, 2),
    'utf8'
  );

  console.log(`[QuantumShield DataEngine] Generated datasets with seed=${seed}:`);
  console.log(`  - Vulnerabilities: ${vulnerabilities.length} real NVD records`);
  console.log(`  - Assets: ${allAssetsMap.size} across 3 scenarios (Small: 12, Financial: 18, Large: 30)`);
  console.log(`  - Network Edges: ${allEdgesMap.size}`);
  console.log(`  - Permissions: ${allPermsMap.size}`);
  console.log(`  - Controls: ${allControlsMap.size}`);
  console.log(`  - Files written to data/processed/ and data/scenarios/`);

  return {
    vulnerabilities,
    allAssets: Array.from(allAssetsMap.values()),
    allEdges: Array.from(allEdgesMap.values()),
    allPermissions: Array.from(allPermsMap.values()),
    allControls: Array.from(allControlsMap.values()),
    scenarioSmall,
    scenarioFinancial,
    scenarioLarge,
  };
}

// Execute generator if invoked directly
if (process.argv[1]?.endsWith('generate_datasets.ts')) {
  generateAllDatasets(42);
}

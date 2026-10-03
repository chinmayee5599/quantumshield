/**
 * QuantumShield — Defensive Control Catalog & Registry
 * Provides enterprise cybersecurity countermeasures covering all 8 core control archetypes:
 * MFA, Network Segmentation, Vulnerability Patching, Service Disabling, Privilege Restriction,
 * Firewall Rules, Access Policies, and Account Hardening.
 */

import { DefensiveControl } from './types';

export const ENTERPRISE_DEFENSIVE_CONTROLS_CATALOG: DefensiveControl[] = [
  // 1. Multi-Factor Authentication (MFA)
  {
    controlId: 'ctrl_mfa_hardware_fido2',
    name: 'Hardware FIDO2 Multi-Factor Authentication',
    category: 'Multi_Factor_Authentication',
    description: 'Enforce hardware FIDO2 cryptographic tokens for all remote access and administrative jump bastions.',
    deploymentCost: 6,
    operationalFriction: 3,
    affectedAssetIds: ['vpn_gateway', 'admin_server', 'employee_workstation'],
    affectedEdgeIds: ['e_s_02', 'e_s_05', 'e_f_11', 'e_f_12'],
    implementationAssumptions: 'Staff issued physical YubiKeys; eliminates credential theft and SMS phishing bypass.',
    mitigationType: 'complete_severance',
    attenuationFactor: 1.0,
  },
  // 2. Network Segmentation
  {
    controlId: 'ctrl_net_microsegmentation',
    name: 'Zero-Trust Network Microsegmentation',
    category: 'Network_Segmentation',
    description: 'Isolate DMZ workloads from internal enterprise LANs using distributed software-defined firewall policies.',
    deploymentCost: 8,
    operationalFriction: 4,
    affectedAssetIds: ['web_server', 'application_server', 'internet_gateway'],
    affectedEdgeIds: ['e_s_03', 'e_f_05', 'e_f_06'],
    implementationAssumptions: 'Calico / Envoy proxy enforces mTLS and drops non-whitelisted cross-tier lateral TCP packets.',
    mitigationType: 'complete_severance',
    attenuationFactor: 1.0,
  },
  // 3. Vulnerability Patching
  {
    controlId: 'ctrl_patch_critical_rce',
    name: 'Emergency CVE Rollup Patching',
    category: 'Patch_Vulnerability',
    description: 'Deploy emergency security patches remediating active remote code execution vulnerabilities (Log4j, Zerologon, Citrix Bleed, BlueKeep).',
    deploymentCost: 5,
    operationalFriction: 2,
    affectedAssetIds: ['web_server', 'domain_identity_server', 'vpn_gateway', 'admin_server'],
    affectedEdgeIds: ['e_s_01', 'e_s_02', 'e_s_05', 'e_f_01', 'e_f_02', 'e_f_03', 'e_f_08'],
    implementationAssumptions: 'Automated CI/CD dependency bump, container rebuild, and staging smoke test.',
    mitigationType: 'complete_severance',
    attenuationFactor: 1.0,
  },
  // 4. Disable Vulnerable Service
  {
    controlId: 'ctrl_disable_insecure_services',
    name: 'Decommission Legacy & Vulnerable Protocols',
    category: 'Disable_Vulnerable_Service',
    description: 'Disable unencrypted LDAP, SMBv1, and legacy ActiveMQ OpenWire serialization on internal infrastructure.',
    deploymentCost: 4,
    operationalFriction: 3,
    affectedAssetIds: ['internal_api_server', 'domain_identity_server', 'employee_workstation'],
    affectedEdgeIds: ['e_f_06', 'e_f_08'],
    implementationAssumptions: 'Audited legacy service discovery; dependent services migrated to secure TLS alternatives.',
    mitigationType: 'complete_severance',
    attenuationFactor: 1.0,
  },
  // 5. Restrict Privilege
  {
    controlId: 'ctrl_privilege_just_in_time',
    name: 'Just-in-Time Ephemeral Privileged Access',
    category: 'Restrict_Privilege',
    description: 'Strip permanent domain administrative privileges; require dynamic 15-minute Vault credential checkouts.',
    deploymentCost: 7,
    operationalFriction: 4,
    affectedAssetIds: ['admin_server', 'finance_database', 'core_vault'],
    affectedEdgeIds: ['e_s_09', 'e_f_10', 'e_f_14', 'e_f_17'],
    implementationAssumptions: 'Administrative tasks require peer-approved transient credential issuance through PAM vault.',
    mitigationType: 'complete_severance',
    attenuationFactor: 1.0,
  },
  // 6. Firewall Rule
  {
    controlId: 'ctrl_perimeter_firewall_acl',
    name: 'Strict Perimeter & Vault Ingress Firewall ACLs',
    category: 'Firewall_Rule',
    description: 'Enforce stateful packet filtering blocking direct TCP port 1433/1521/3389 database and RDP connections from untrusted subnets.',
    deploymentCost: 4,
    operationalFriction: 1,
    affectedAssetIds: ['internet_gateway', 'admin_server', 'finance_database'],
    affectedEdgeIds: ['e_s_08', 'e_s_09', 'e_f_16', 'e_f_17'],
    implementationAssumptions: 'Router ACL updated to reject external syn packets to private RFC 1918 internal services.',
    mitigationType: 'complete_severance',
    attenuationFactor: 1.0,
  },
  // 7. Access Policy
  {
    controlId: 'ctrl_conditional_access_mtls',
    name: 'Mutual-TLS Identity-Bound Access Policy',
    category: 'Access_Policy',
    description: 'Enforce device health attestation and client certificate mTLS authentication for all database queries.',
    deploymentCost: 6,
    operationalFriction: 3,
    affectedAssetIds: ['application_server', 'finance_database'],
    affectedEdgeIds: ['e_s_08', 'e_f_15', 'e_f_16'],
    implementationAssumptions: 'Every backend service issued a short-lived x509 cert managed by HashiCorp Vault / SPIFFE.',
    mitigationType: 'complete_severance',
    attenuationFactor: 1.0,
  },
  // 8. Account Hardening
  {
    controlId: 'ctrl_account_domain_hardening',
    name: 'Active Directory Kerberos & Netlogon Sealing',
    category: 'Account_Hardening',
    description: 'Enforce Kerberos AES encryption, disable NTLM relaying, and mandate Netlogon RPC sealing across domain controllers.',
    deploymentCost: 5,
    operationalFriction: 2,
    affectedAssetIds: ['domain_identity_server', 'employee_workstation'],
    affectedEdgeIds: ['e_f_08', 'e_f_13'],
    implementationAssumptions: 'Group Policy enforced domain-wide; eliminates PetitPotam and Zerologon exploitability.',
    mitigationType: 'complete_severance',
    attenuationFactor: 1.0,
  },
];

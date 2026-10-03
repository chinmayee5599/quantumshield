# QuantumShield Data Engine — Provenance & Reproducibility Documentation

**Dataset Version**: 1.0.0  
**Retrieval & Snapshot Date**: 2024-03-15T00:00:00Z  
**Primary Seed**: `42`  
**License / Terms**: NIST Public Domain / MIT Research Use  

---

## 1. Research Disclaimer & Purpose

> **"The enterprise topology, asset relationships, permissions and control costs are synthetic and intended for reproducible research experimentation. Vulnerability metadata is grounded in publicly available CVE/CVSS information."**

*Notice: The environments, asset hostnames, IP topologies, user identities, and network configurations described in this dataset are entirely fictional. They do NOT represent any actual company, financial institution, or operational network. Synthetic assumptions are designed specifically to evaluate hybrid classical-quantum optimization algorithms (QUBO & QAOA) on defensive cybersecurity graph cuts.*

---

## 2. Real-World vs. Synthetic Field Attribution

To ensure scientific integrity and eliminate synthetic hallucination, all fields are explicitly distinguished by origin:

| Field Name | Entity | Origin | Verification / Source |
| :--- | :--- | :--- | :--- |
| `cve_id` | Vulnerability | **Real** | NIST National Vulnerability Database (NVD) |
| `published_date` | Vulnerability | **Real** | Official CVE publication timestamp |
| `cvss_v3_base_score` | Vulnerability | **Real** | Official CVSS v3.1 base metric ($0.0 - 10.0$) |
| `cvss_v3_vector` | Vulnerability | **Real** | Canonical CVSS v3.1 vector string |
| `severity` | Vulnerability | **Real** | NVD Severity Rating (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `attack_vector` | Vulnerability | **Real** | CVSS metric (`NETWORK`, `LOCAL`, `ADJACENT`) |
| `attack_complexity`| Vulnerability | **Real** | CVSS metric (`LOW`, `HIGH`) |
| `privileges_required`| Vulnerability | **Real** | CVSS metric (`NONE`, `LOW`, `HIGH`) |
| `user_interaction` | Vulnerability | **Real** | CVSS metric (`NONE`, `REQUIRED`) |
| `scope` | Vulnerability | **Real** | CVSS metric (`UNCHANGED`, `CHANGED`) |
| `confidentiality_impact` | Vulnerability | **Real** | CVSS metric (`NONE`, `LOW`, `HIGH`) |
| `integrity_impact` | Vulnerability | **Real** | CVSS metric (`NONE`, `LOW`, `HIGH`) |
| `availability_impact` | Vulnerability | **Real** | CVSS metric (`NONE`, `LOW`, `HIGH`) |
| `exploitability_subscore`| Vulnerability | **Real** | Mathematical CVSS v3.1 formula output |
| `impact_subscore` | Vulnerability | **Real** | Mathematical CVSS v3.1 formula output |
| `affected_product` | Vulnerability | **Real** | Software vendor & package name |
| `description` (CVE) | Vulnerability | **Real** | Official NVD vulnerability summary text |
| `source_url` | Vulnerability | **Real** | NIST NVD detail canonical URL |
| `asset_id`, `asset_name`| Asset | **Synthetic** | Deterministically generated identifier |
| `asset_type` | Asset | **Synthetic** | Fictional enterprise role (e.g., `finance_database`) |
| `criticality` | Asset | **Synthetic** | Business criticality policy (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `trust_level` | Asset | **Synthetic** | Integer scale ($1 - 5$) representing security zone trust |
| `network_zone` | Asset | **Synthetic** | Network segment (`perimeter_dmz`, `core_vault`, etc.) |
| `assigned_cves` | Asset | **Synthetic Mapping** | Deterministic association of real CVE to synthetic asset |
| `edge_id`, `relationship_type` | Edge | **Synthetic** | Simulated network flow or remote protocol transition |
| `permission_id` | Permission | **Synthetic** | Simulated role-based privilege model |
| `deployment_cost` | Control | **Synthetic** | Relative optimization weight ($1 - 20$) |
| `operational_friction` | Control | **Synthetic** | Disruption penalty ($1 - 10$) |
| `affected_edges` | Control | **Synthetic Mapping** | Deterministic cut set of edges mitigated by this control |

---

## 3. How Synthetic Assets Are Generated

1. **Role-Driven Taxonomy**: Assets represent standard enterprise infrastructure tiers:
   - Ingress Gateways & Reverse Proxies (Edge / DMZ)
   - Application & Microservice Engines (Corporate LAN / Restricted PCI)
   - Identity & Authentication Authorities (Active Directory, Kerberos, LDAP)
   - Employee Endpoints & Jump Bastions
   - Mission-Critical Storage (Core General Ledger, Customer Database, Vault)
2. **Criticality Assignment**: Criticality is assigned based on business role:
   - `CRITICAL`: Master Financial Ledger, Primary Active Directory Domain Controller, HSM Secrets Vault.
   - `HIGH`: Border Ingress Gateways, Core Transaction Engines, Backup Repositories.
   - `MEDIUM`: Employee Workstations, Internal Departmental Wikis, General Operational DBs.
   - `LOW`: Network Telemetry & Syslog collectors.
3. **Reproducibility Guarantee**: In the large benchmark scenario (30 assets), node roles and zones are generated using the Mulberry32 PRNG initialized with seed `42`.

---

## 4. How Network Relationships Are Generated

Network edges represent valid protocol transitions between assets based on realistic enterprise architectures:
- Public Ingress $\rightarrow$ Perimeter Web Server / ADC (ports 80, 443, 10443).
- DMZ $\rightarrow$ Internal Application Tier (ports 8080, 8443, 50051).
- Internal Applications $\rightarrow$ Databases & Queues (ports 1433, 1521, 5432, 61616).
- Endpoints $\rightarrow$ Jump Bastions $\rightarrow$ Restricted Core Vault (ports 22, 3389).
- Cyclic loops are prohibited to ensure acyclic directed paths for algorithmic graph cut evaluation.

---

## 5. How Vulnerabilities Are Mapped to Assets

Real CVE records are deterministically assigned based on realistic software stack alignment:
- `CVE-2021-44228` (Log4j): Mapped to Java-based web portals and logging agents.
- `CVE-2020-1472` (Zerologon): Mapped to Windows Active Directory Domain Controllers.
- `CVE-2019-0708` (BlueKeep): Mapped to administrative RDP jump hosts.
- `CVE-2023-4966` (Citrix Bleed) & `CVE-2023-3519`: Mapped to Citrix NetScaler Application Delivery Controllers.
- `CVE-2023-27997` (FortiOS SSL-VPN): Mapped to perimeter VPN appliances.
- `CVE-2024-21413` (Outlook MonikerLink) & `CVE-2022-30190` (Follina): Mapped to corporate employee workstations.
- `CVE-2023-34362` (MOVEit Transfer): Mapped to financial file exchange gateways.
- `CVE-2023-22515` (Confluence RCE): Mapped to internal collaboration wikis.

---

## 6. How Defensive Controls Are Created

Controls represent concrete, realistic cybersecurity countermeasures:
- **Vulnerability Patching**: Removes the exploitation opportunity for specific CVEs.
- **Multi-Factor Authentication (MFA)**: Enforces FIDO2 hardware keys on VPN and administrative jump hosts.
- **Network Microsegmentation**: Disallows unauthorized cross-zone lateral packet traversal.
- **Zero-Trust SQL Inspection**: Deploys an inline proxy with anomaly detection in front of core databases.
- **Vault Dynamic Secrets**: Eliminates static administrative credentials in favor of 15-minute ephemeral leases.

**Cost Interpretation**:
`deployment_cost` ($1 - 20$) and `operational_friction` ($1 - 10$) are normalized unitless weights representing relative engineering complexity, software licensing, and user disruption. They provide the trade-off objective for the QUBO solver.

---

## 7. The Three Benchmarked Scenarios

### Scenario 1: Small Enterprise (`data/scenarios/small.json`)
- **Assets**: 12 assets (Edge Router, Web Server, ERP App, Workstation, VPN, LDAP, General DB, Admin Host, Finance DB, Backup, Monitor).
- **Vulnerabilities**: 6 real CVEs.
- **Network Transitions**: 12 edges.
- **Controls**: 6 defensive controls.
- **Purpose**: Rapid unit testing, quick verification of solver optimality, and visualization sanity checks.

### Scenario 2: Financial Enterprise (`data/scenarios/financial.json`) — Flagship
- **Assets**: 18 assets (Citrix NetScaler ADC, MOVEit Transfer, Online Banking Portal, Trader Workstation, Ops PC, Fortinet VPN Bastion, Active Directory DC, Transaction Engine, ActiveMQ Broker, Redis Cache, HSM Vault, Core Financial Ledger, Audit Store, Backup Vault, Confluence Wiki).
- **Crown Jewel**: Core Financial Ledger & Customer Balance DB (`fin_db_ledger`, Criticality: `CRITICAL`, $4.2B customer deposit store).
- **Vulnerabilities**: 12 real CVEs (Zerologon, Citrix Bleed, MOVEit SQLi, Log4j, ActiveMQ, Confluence OGNL, BlueKeep, MonikerLink).
- **Network Transitions**: 19 edges.
- **Controls**: 10 defensive controls.
- **Purpose**: Primary hackathon demonstration showcasing multi-vector attacks (SSRF, lateral movement, credential theft) and quantum-classical optimization comparisons.

### Scenario 3: Large Multi-Tier Enterprise (`data/scenarios/large.json`)
- **Assets**: 30 assets across 6 network tiers.
- **Vulnerabilities**: 24 real CVEs.
- **Network Transitions**: 53 edges.
- **Controls**: 16 defensive controls.
- **Purpose**: Algorithmic scalability, benchmark execution times, and stress testing.

---

## 8. Dataset Limitations

1. **No Live Traffic Modeling**: The dataset models potential static reachability paths rather than dynamic, packet-level stateful traffic.
2. **Deterministic Exploit Probability**: In the risk model, exploitability is derived from CVSS exploitability subscores rather than dynamic exploit kits or threat telemetry.
3. **Acyclic Assumption**: Network attack edges are structured as directed acyclic topologies to ensure exact path enumeration without infinite loops.

---

## 9. Reproduction Command

To regenerate the exact datasets from source using the fixed seed `42`:

```bash
npx tsx scripts/generate_datasets.ts
```

To validate integrity and referential constraints:

```bash
npx tsx scripts/validate_datasets.ts
```

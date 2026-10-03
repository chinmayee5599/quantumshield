# QuantumShield: Phase 1 — Comprehensive System Architecture Specification
**Platform**: Hybrid Quantum-AI Cybersecurity Optimization Platform  
**Target Domain**: Enterprise Defensive Cybersecurity, Graph Theory, QUBO & QAOA Optimization  
**Document Version**: 1.0.0 (Phase 1 Baseline)

---

## 1. System Overview & Architectural Objectives

QuantumShield is a defensive cybersecurity optimization platform designed to solve the **Defensive Control Selection Problem** across enterprise attack graphs. Given a compromised network entry point and multiple lateral movement paths toward critical Crown Jewels, security teams face a combinatorial challenge: which subset of defensive controls (firewall rules, patches, IAM hardening, MFA, network microsegmentation) should be deployed to eliminate threat exposure while minimizing implementation cost and operational disruption?

### Key System Directives:
1. **Modularity & Decoupling**: The system architecture enforces strict isolation between data ingestion, graph analysis, QUBO compilation, and solver execution. Quantum and classical solvers implement a unified `SolverInterface` and can be swapped or executed in parallel.
2. **Scientific Rigor**: No synthetic "quantum advantage" claims. Ground truth is evaluated using classical exhaustive search ($N \le 30$) and simulated annealing. QAOA is treated as a variational heuristic, measuring approximation ratios ($r = \langle H_C \rangle / E_{\min}$) and ground state overlap probabilities.
3. **Defensive Only**: Operates strictly on synthetic and simulated network topologies, adhering to MITRE ATT&CK and CVE profiles without live network probing or malware deployment.

---

## 2. The 16 Logical Modules

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   QUANTUMSHIELD CORE                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
 [01. Data Ingestion] ──────► [02. Enterprise Asset Model] ───► [03. Vulnerability Model]
                                                                        │
                                                                        ▼
 [06. Risk Scoring] ◄──────── [05. Path Enumeration] ◄────── [04. Attack Graph Engine]
         │
         ▼
 [07. Security Control Model] ──► [08. QUBO Formulation Engine]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
     [09. Classical Baselines]                                     [10. Quantum QAOA Engine]
     (Exact, Greedy, Annealing)                                    (Ansatz, Simulator, Shots)
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                ▼
                                    [11. Solution Validation]
                                                │
                                                ▼
                                   [12. Explainability Layer]
                                                │
                                                ▼
     [13. REST / API Layer] ◄───────────────────┼──────────────────► [16. Benchmark Module]
                 │                                                             │
                 ▼                                                             ▼
     [14. Frontend Dashboard] ─────────────────────────────────────► [15. Visualization Layer]
```

### Module 1: Data Ingestion Layer (`/src/core/ingestion/`)
- Ingests synthetic network topologies, asset inventories, CMDB dumps, and cloud IAM permission graphs.
- Supports JSON/STIX format containing asset metadata, IP allocations, subnet boundaries, and installed software components.

### Module 2: Enterprise Asset Model (`/src/types/cyber.ts`)
- Represents discrete network and identity entities:
  - **Asset Tiers**: Perimeter / DMZ, Internal Workstation, Identity / IdP, Core Application Server, Crown Jewel Database.
  - **Node Attributes**: Asset ID, Hostname, IPv4/Subnet, Business Criticality ($V \in [1, 100]$), Compromise Status (`compromised_entry`, `exposed`, `protected`, `crown_jewel`).

### Module 3: Vulnerability Model (`/src/core/models/vulnerability.ts`)
- Represents actionable attack primitives:
  - CVE Identifiers (e.g., CVE-2023-22515, Log4j, BlueKeep).
  - CVSS v3.1 Base Scores ($0.0 - 10.0$) and Exploit Likelihood ($P \in [0.1, 0.99]$).
  - MITRE ATT&CK Enterprise Matrix mapping (e.g., T1190 Initial Exploit, T1552 Credential Access, T1021 Lateral Movement, T1078 Valid Accounts).

### Module 4: Attack Graph Construction (`/src/core/graph/attackGraph.ts`)
- Directs node and transition graphs $G = (V, E)$.
- Enforces attack pre-conditions (e.g., access to tier $k$) and post-conditions (access to tier $k+1$).
- Adjacency list representation supporting forward reachability and backward pruning from Crown Jewels.

### Module 5: Attack Path Enumeration (`/src/core/graph/pathFinder.ts`)
- Discovers all acyclic directed attack trajectories from compromised ingress nodes $v_{\text{entry}}$ to Crown Jewel targets $v_{\text{crown}}$.
- Depth-First Search with cycle detection and Yen's K-shortest paths ranking by risk.

### Module 6: Risk Scoring Engine (`/src/core/risk/riskCalculator.ts`)
- Calculates path risk metrics:
  $$R(p) = V_{\text{target}} \cdot \prod_{e \in p} P_{\text{exploit}}(e) \cdot \left(\frac{\overline{\text{CVSS}}(p)}{10}\right) \cdot \lambda_{\text{impact}}$$
- Normalizes risk on a $1 - 100$ scale for human prioritization and optimization weighting.

### Module 7: Security Control Model (`/src/core/models/controls.ts`)
- Catalog of defensive interventions $\{C_1, \dots, C_n\}$.
- **Control Attributes**:
  - Implementation Cost $w_i \in [1, 20]$ (budget, engineer hours).
  - Operational Friction $d_i \in [1, 10]$ (workflow latency, business disruption).
  - Mitigated Edges $E(C_i) \subseteq E$ and Mitigated Nodes $V(C_i) \subseteq V$.
  - Control Category: Patch, Network, Identity, ZeroTrust, Endpoint EDR.

### Module 8: QUBO Formulation Engine (`/src/core/qubo/quboEngine.ts`)
- Translates the graph cut problem into Quadratic Unconstrained Binary Optimization:
  $$H(x) = \alpha \sum_{i=1}^n (w_i + d_i) x_i + \beta \sum_{k=1}^K R_k \left(1 - \sum_{i \in S_k} x_i\right)^2$$
- Derives the exact matrix $Q \in \mathbb{R}^{n \times n}$ where $H(x) = C_0 + x^T Q x$.
- Mappings to Ising Hamiltonian $H_C = \sum h_i Z_i + \sum_{i<j} J_{ij} Z_i Z_j + \text{offset}$ via $x_i = \frac{I - Z_i}{2}$.

### Module 9: Classical Optimization Baselines (`/src/core/solvers/classical/`)
- **Exact Exhaustive Solver**: Evaluates all $2^n$ bitstrings for $N \le 30$ to establish the ground truth global minimum.
- **Greedy Heuristic Solver**: Polynomial-time marginal gain picker ($\max \Delta \text{Risk} / \text{Cost}$).
- **Simulated Annealing**: Metropolis-Hastings thermal MCMC with geometric cooling $T_{k+1} = \gamma T_k$.

### Module 10: QAOA / Quantum Optimization Engine (`/src/core/solvers/quantum/`)
- Unitary statevector simulator implementing:
  $$|\psi(\vec{\gamma}, \vec{\beta})\rangle = \prod_{l=1}^p \left( e^{-i \beta_l \sum X_k} e^{-i \gamma_l H_C} \right) |+\rangle^{\otimes n}$$
- Classical variational feedback loop optimizing parameter vectors $\vec{\gamma}, \vec{\beta} \in \mathbb{R}^{2p}$.
- Shot-based measurement sampling simulating quantum readout statistics and shot noise.
- Generates 2D variational energy landscapes $\langle H_C(\gamma, \beta) \rangle$.

### Module 11: Solution Validation Layer (`/src/core/validation/validator.ts`)
- Verifies candidate bitstrings against hard constraints.
- Re-traverses the graph with active controls applied: verifies that every path to the Crown Jewel is severed.
- Computes residual exposure and flags unmitigated bypass routes.

### Module 12: Explainability Layer (`/src/core/explainability/explainer.ts`)
- Translates binary bitstrings into actionable security analyst intelligence:
  - Identifies bottleneck choke points severed.
  - Explains why expensive controls were rejected in favor of high-leverage defenses.
  - Evaluates defense-in-depth redundancy (defense depth $> 1$).

### Module 13: REST / API Layer (`/server.ts` or `/src/api/`)
- Standardized RESTful contracts for graph ingestion, QUBO compilation, solver dispatch, and benchmark polling.

### Module 14: Frontend Dashboard (`/src/App.tsx` & `/src/components/`)
- High-density, professional cybersecurity analyst cockpit:
  - Scenario switcher, threat actor profile, graph canvas, controls catalog, and configuration consoles.

### Module 15: Visualization Layer (`/src/components/`)
- Interactive SVG/Canvas attack graph with real-time path highlighting and severed edge markers.
- QUBO $Q_{ij}$ heatmap matrix and Ising $J_{ij}$ coupling display.
- Convergence curves and 2D parameter energy landscapes.
- Measurement probability distribution histograms.

### Module 16: Experiment & Benchmark Module (`/src/core/benchmarks/`)
- Head-to-head empirical comparison: QAOA vs Exact vs Greedy vs Simulated Annealing.
- Calculates approximation ratios $r$, ground state overlap %, and execution runtimes with scientific positioning notes.

---

## 3. Directory & Folder Structure

```
/quantumshield
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docs/
│   ├── ARCHITECTURE.md                  # Comprehensive technical specification
│   ├── PHASE_1_ARCHITECTURE.md          # Phase 1 architectural blueprint
│   └── API_SPECIFICATION.md             # OpenAPI contracts
├── src/
│   ├── main.tsx                         # Client application entry point
│   ├── index.css                        # Tailwind v4 theme, fonts, custom scrollbars
│   ├── App.tsx                          # Primary dashboard coordinator
│   ├── types/
│   │   ├── cyber.ts                     # Nodes, Edges, Paths, Controls, Scenarios
│   │   ├── quantum.ts                   # QUBO, Ising, QAOA, Solvers, Benchmarks
│   │   └── api.ts                       # REST payload and response contracts
│   ├── core/
│   │   ├── scenarios.ts                 # 3 enterprise scenarios (FinCloud, OT/ICS, EHR)
│   │   ├── graphAnalyzer.ts             # Path discovery, traversal, risk scoring
│   │   ├── quboEngine.ts                # QUBO matrix formulation & Ising mapping
│   │   ├── qaoaSimulator.ts             # Statevector QAOA, parameter optimization, shots
│   │   ├── classicalSolvers.ts          # Exact, Greedy, Simulated Annealing
│   │   ├── hybridSolver.ts              # Solver coordinator & benchmark execution
│   │   └── explainer.ts                 # Cybersecurity explainability & reasoning
│   ├── components/
│   │   ├── Header.tsx                   # Top navigation, scenario selector, docs modal
│   │   ├── ScenarioOverview.tsx         # Environment threat actor & Crown Jewel stats
│   │   ├── AttackGraphCanvas.tsx        # Interactive SVG graph visualizer
│   │   ├── AttackPathsTable.tsx         # Discovered paths & risk breakdown
│   │   ├── DefensiveControlsList.tsx    # Candidate controls & manual override toggles
│   │   ├── QuboMatrixView.tsx           # Heatmap of Q_ij & trade-off sliders (alpha, beta)
│   │   ├── QaoaConsole.tsx              # Circuit depth p, shots, convergence sparkline
│   │   ├── QuantumStateVisualizer.tsx   # Measurement histogram & 2D (gamma, beta) surface
│   │   ├── BenchmarkComparison.tsx      # Head-to-head quantum vs classical table
│   │   ├── ExplainabilityPanel.tsx      # Defensive reasoning & choke point analysis
│   │   └── ArchitectureModal.tsx        # In-app architecture & mathematics paper
│   └── api/                             # Optional backend client or server routes
│       └── client.ts                    # Strongly typed API client
└── server.ts                            # Express API server for full-stack integration
```

---

## 4. Frontend & Backend Architecture

### 4.1 Frontend Architecture
- **Framework**: React 19 SPA running on Vite with TypeScript.
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";`), custom dark-mode typography pairing (`Plus Jakarta Sans` for UI, `JetBrains Mono` with `tabular-nums` for data).
- **State Management**: React `useState` and `useMemo` functional pipelines. Single source of truth at `App.tsx` ensuring reactive updates across graph visualization, QUBO matrix, solver outputs, and explainability cards.
- **Visual Design Compliance**: Anti-AI slop discipline (no arbitrary decorative pills, single elevation depth, tabular numbers for all metrics,WCAG AA contrast).

### 4.2 Backend Architecture & Computational Engine
- **In-Browser TypeScript Engine**:
  - The statevector QAOA simulator and classical solvers run in pure TypeScript. For $N \le 16$ qubits ($2^{16} = 65,536$ states), client-side evaluation executes in milliseconds without network round-trips.
- **Full-Stack Extensibility (`server.ts`)**:
  - For scaling up to $N \ge 24$ or connecting to Python NetworkX / Qiskit microservices, Express routes (`/api/optimize/qaoa`, `/api/optimize/classical`, `/api/graph/analyze`) accept the graph payload and return typed `SolverResult` structures.

---

## 5. Data Flow Diagram

```
[1. User selects Scenario & tunes weights (alpha, beta)]
                         │
                         ▼
[2. GraphAnalyzer: Traverses Graph via DFS]
   - Computes all simple attack paths from Ingress to Crown Jewel
   - Calculates path risk R_k = V_target * Prod P_e * (CVSS / 10)
                         │
                         ▼
[3. QuboEngine: Compiles Problem Formulation]
   - Maps paths & controls into QUBO matrix Q_ij
   - Diagonal Q_ii = Cost - Risk Rewards
   - Off-Diagonal Q_ij = 2 * Pairwise Redundancy Penalties
   - Computes Ising Hamiltonian: H_C = sum h_i Z_i + sum J_ij Z_i Z_j
                         │
                         ▼
[4. HybridSolver: Dispatches Solvers in Parallel]
   ├── Classical Exact (Exhaustive search over 2^n states)
   ├── Classical Greedy (Marginal risk reduction per cost)
   ├── Classical Simulated Annealing (Thermal MCMC)
   └── Quantum QAOA Simulator:
         - Initializes |+>^n superposition
         - Evolves state under p alternating layers of U(H_C, gamma) and U(H_M, beta)
         - Optimizes (gamma, beta) to minimize <H_C>
         - Samples S measurement shots from final wavefunction
                         │
                         ▼
[5. Solution Validation & Explainability]
   - Re-evaluates graph path cuts with selected control bitstring
   - Verifies whether Crown Jewel is fortified (0 open paths)
   - Computes Cost-Efficiency Ratio and residual exposure
   - Generates security analyst briefing
                         │
                         ▼
[6. Dashboard Visualization]
   - Graph Canvas updates severed edges (dashed with blue shields)
   - Benchmark table updates approximation ratio and runtimes
   - Measurement histogram and 2D landscape rendered
```

---

## 6. How QUBO Connects to QAOA (Mathematical Derivation)

### Step 1: Combinatorial Formulation
We define binary decision variables $x_i \in \{0, 1\}$ for each defensive control $C_i$:
- Cost penalty: $\sum_{i=1}^n c_i x_i$ where $c_i = \alpha (w_i + d_i)$.
- Path risk penalty: For each path $p_k$, if none of its intercepting controls $S_k$ are active, a penalty $P_k = \beta R_k$ is incurred:
  $$H(x) = \sum_{i=1}^n c_i x_i + \sum_{k=1}^K P_k \left( 1 - \sum_{i \in S_k} x_i \right)^2$$

### Step 2: Binary Idempotency to Canonical QUBO
Since $x_i^2 = x_i$ for $x_i \in \{0, 1\}$:
$$\left( 1 - \sum_{i \in S_k} x_i \right)^2 = 1 - 2\sum_{i \in S_k} x_i + \sum_{i \in S_k} x_i + 2 \sum_{i < j, \, i,j \in S_k} x_i x_j = 1 - \sum_{i \in S_k} x_i + 2 \sum_{i < j, \, i,j \in S_k} x_i x_j$$
This yields the upper-triangular matrix $Q$:
$$Q_{ii} = \alpha (w_i + d_i) - \beta \sum_{k: i \in S_k} R_k$$
$$Q_{ij} = 2 \beta \sum_{k: i,j \in S_k} R_k \quad (i < j)$$

### Step 3: Mapping to Ising Spin Hamiltonian
In quantum mechanics, qubits are physical spin-$\frac{1}{2}$ systems with eigenvalues $\pm 1$ of the Pauli-Z operator $Z = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}$.
We map classical bit $x_i \in \{0, 1\}$ to Pauli operator $Z_i \in \{-1, +1\}$ via:
$$x_i = \frac{I - Z_i}{2}$$
$$x_i x_j = \frac{I - Z_i - Z_j + Z_i Z_j}{4}$$

Substituting into the QUBO objective:
$$H_C = \sum_{i=1}^n h_i Z_i + \sum_{i < j} J_{ij} Z_i Z_j + \text{Offset}$$
Where:
- $J_{ij} = \frac{Q_{ij}}{4}$ (two-body Ising spin coupling, implemented as $R_{ZZ}(2\gamma J_{ij})$ gates)
- $h_i = -\frac{Q_{ii}}{2} - \sum_{j \neq i} \frac{Q_{ij}}{4}$ (single-qubit longitudinal magnetic field, implemented as $R_Z(2\gamma h_i)$ gates)

### Step 4: QAOA Unitary Evolution
The quantum processor applies:
1. **Initial State**: $|\psi_0\rangle = H^{\otimes n} |0\rangle^{\otimes n} = |+\rangle^{\otimes n}$
2. **Problem Phase Separator**:
   $$U(H_C, \gamma) = e^{-i \gamma H_C} = \exp\left( -i \gamma \sum_{i<j} J_{ij} Z_i Z_j - i \gamma \sum_i h_i Z_i \right)$$
   Applies phase shifts proportional to the classical cost function $E(x)$ to each computational basis state $|x\rangle$.
3. **Transverse Mixer**:
   $$U(H_M, \beta) = e^{-i \beta \sum X_i} = \bigotimes_{i=1}^n R_X(2\beta)$$
   Induces quantum superposition and tunneling between bitstrings.
4. **Variational Loop**: Classical optimizer updates $(\vec{\gamma}, \vec{\beta})$ to minimize $\langle \psi(\vec{\gamma}, \vec{\beta}) | H_C | \psi(\vec{\gamma}, \vec{\beta}) \rangle$.
5. **Measurement Sampling**: Collapse wavefunction into classical bitstrings; evaluate lowest-energy valid control set.

---

## 7. Testing Strategy

1. **Unit Tests (`/tests/unit/`)**:
   - `graphAnalyzer.test.ts`: Validates that DFS path enumeration correctly identifies all simple paths, prevents loops, and computes correct product probabilities.
   - `quboEngine.test.ts`: Verifies algebraic equivalence between the penalty objective and matrix $x^T Q x$, checking symmetry and diagonal values.
   - `qaoaSimulator.test.ts`: Verifies unitary preservation ($\sum P(x) = 1.0$), correct expectation calculation, and analytical 2-qubit benchmarks.
2. **Mathematical Invariant Tests**:
   - For any bitstring $x$, verify $E_{\text{QUBO}}(x) \equiv \langle x | H_C | x \rangle_{\text{Ising}}$.
   - Verify that adding a redundant control strictly increases the objective function when $Q_{ij} > 0$.
3. **Integration & Regression Tests**:
   - Compares QAOA output against Exact ground truth; verifies approximation ratio $r \ge 0.70$ across standard benchmarks.

---

## 8. Implementation Roadmap (Phases 1 through 6)

- **Phase 1 (CURRENT)**: System Architecture, Mathematical QUBO-to-Ising Derivation, System Contracts, and Pipeline Design.
- **Phase 2**: Enterprise Asset, Vulnerability & Attack Graph Engine (Data Ingestion, MITRE ATT&CK modeling, DFS path discovery, composite risk calculation).
- **Phase 3**: QUBO Formulation & Classical Baseline Optimization (Matrix compilation, exact exhaustive search, greedy heuristic, simulated annealing).
- **Phase 4**: QAOA Quantum Simulation & Hybrid Variational Feedback Loop (Unitary state evolution, parameter optimization, measurement sampling, 2D energy landscape).
- **Phase 5**: Solution Validation, Defense-in-Depth Auditing & Explainability Layer (Choke point neutralization reasoning, residual threat assessment, analyst briefing).
- **Phase 6**: Polished Enterprise Dashboard UI, Benchmark Comparison Matrix & Hackathon Demonstration Packaging.

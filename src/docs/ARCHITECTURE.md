# QuantumShield: Hybrid Quantum-AI Defensive Cybersecurity Architecture

## 1. Executive Summary & Scientific Positioning

**QuantumShield** is a proof-of-concept hybrid quantum-classical optimization platform designed to solve the **Defensive Cybersecurity Control Selection Problem** on enterprise attack graphs.

### Scientific Grounding & Non-Hype Positioning
1. **No Unsubstantiated Quantum Advantage Claims**: On current Noisy Intermediate-Scale Quantum (NISQ) devices and classical simulators for $N \le 64$ variables, state-of-the-art classical solvers (branch-and-bound, CPLEX, simulated annealing) solve sparse QUBO instances faster and with lower overhead than physical QPUs.
2. **Technical Purpose of QAOA**: Quantum Approximate Optimization Algorithm (QAOA) serves as an ansatz for mapping non-convex combinatorial cut problems onto physical Ising spin glasses. We analyze approximation ratios, energy expectation landscapes $\langle H_C(\vec{\gamma}, \vec{\beta}) \rangle$, state amplitudes, and shot sampling distributions to evaluate how quantum heuristics scale as attack graph complexity grows.
3. **Defensive Cyber Context**: The system analyzes simulated enterprise attack paths, isolating choke points to protect mission-critical Crown Jewels without executing live offensive operations.

---

## 2. Mathematical QUBO Formulation

### 2.1 Attack Graph & Variables
Let the network be represented as a directed graph $G = (V, E)$, where:
- $V$ is the set of assets (perimeter gateways, internal servers, identity providers, and Crown Jewels).
- $E$ is the set of attack transitions (exploits, lateral pivots, privilege escalations).
- $P = \{p_1, p_2, \dots, p_K\}$ is the set of simple paths from the compromised entry point to the Crown Jewel.
- Each path $p_k$ carries a composite risk score $R_k = V_{\text{target}} \cdot \prod_{e \in p_k} P_{\text{exploit}}(e) \cdot \left(\frac{\overline{\text{CVSS}}}{10}\right)$.

Let $\{C_1, C_2, \dots, C_n\}$ be the catalog of available defensive controls (e.g. strict IMDSv2, network microsegmentation, patch deployment, MFA enforcement).
We assign a binary decision variable $x_i \in \{0, 1\}$ to each control $C_i$:
$$x_i = \begin{cases} 1 & \text{if Control } C_i \text{ is deployed} \\ 0 & \text{otherwise} \end{cases}$$

### 2.2 Objective Function
A security leader faces a dual objective:
1. Maximize risk mitigation by severing all high-risk attack paths.
2. Minimize total implementation cost $w_i$ and operational disruption friction $d_i$.

Let $S_k \subseteq \{1, \dots, n\}$ be the index set of controls capable of severing at least one transition in path $p_k$. Path $p_k$ remains active if and only if:
$$\prod_{i \in S_k} (1 - x_i) = 1 \iff \sum_{i \in S_k} x_i = 0$$

We formulate the unconstrained minimization Hamiltonian:
$$H(x) = \alpha \sum_{i=1}^n (w_i + d_i) x_i + \beta \sum_{k=1}^K R_k \left( 1 - \sum_{i \in S_k} x_i \right)^2$$

### 2.3 Algebraic Expansion to Canonical Matrix Form
Using the binary property $x_i^2 = x_i$:
$$\left( 1 - \sum_{i \in S_k} x_i \right)^2 = 1 - 2\sum_{i \in S_k} x_i + \left(\sum_{i \in S_k} x_i\right)^2 = 1 - \sum_{i \in S_k} x_i + 2 \sum_{i < j, \, i,j \in S_k} x_i x_j$$

Substituting into $H(x)$:
$$H(x) = C_0 + \sum_{i=1}^n Q_{ii} x_i + \sum_{i < j} Q_{ij} x_i x_j$$

Where:
- Constant energy offset: $C_0 = \beta \sum_{k=1}^K R_k$
- Diagonal linear terms:
  $$Q_{ii} = \alpha (w_i + d_i) - \beta \sum_{k: i \in S_k} R_k$$
- Off-diagonal quadratic interaction terms:
  $$Q_{ij} = 2 \beta \sum_{k: i,j \in S_k} R_k \quad (i < j)$$

**Physical Interpretation**:
- $Q_{ii} < 0$ rewards activating high-leverage controls that sever high-risk paths.
- $Q_{ij} > 0$ penalizes redundant controls that cover the same paths, driving the solver to find the Pareto-optimal minimal cut set.

---

## 3. Mapping QUBO to Ising Spin Hamiltonian

To simulate or execute on quantum hardware, binary variables $x_i \in \{0, 1\}$ are mapped to Pauli-Z spin operators $Z_i \in \{-1, +1\}$ via:
$$x_i = \frac{I - Z_i}{2}$$
$$x_i x_j = \frac{I - Z_i - Z_j + Z_i Z_j}{4}$$

Yielding the problem Hamiltonian:
$$H_C = \sum_{i=1}^n h_i Z_i + \sum_{i < j} J_{ij} Z_i Z_j + \text{Offset}$$

Where:
$$J_{ij} = \frac{Q_{ij}}{4}$$
$$h_i = -\frac{Q_{ii}}{2} - \sum_{j \neq i} \frac{Q_{ij}}{4}$$
$$\text{Offset} = C_0 + \sum_{i=1}^n \frac{Q_{ii}}{2} + \sum_{i < j} \frac{Q_{ij}}{4}$$

---

## 4. Quantum Approximate Optimization Algorithm (QAOA)

### 4.1 Circuit Ansatz
1. **Initial State Preparation**: Initialize $n$ qubits in an equal superposition state:
   $$|\psi_0\rangle = |+\rangle^{\otimes n} = \frac{1}{\sqrt{2^n}} \sum_{x \in \{0,1\}^n} |x\rangle$$
2. **Alternating Unitaries**: Apply $p$ layers of problem and mixer evolutions:
   $$|\psi(\vec{\gamma}, \vec{\beta})\rangle = \prod_{l=1}^p \left( e^{-i \beta_l H_M} e^{-i \gamma_l H_C} \right) |\psi_0\rangle$$
   - **Cost Unitary**: $U(H_C, \gamma_l) = e^{-i \gamma_l H_C}$ applies a relative phase $e^{-i \gamma_l E(x)}$ to each computational basis state $|x\rangle$.
   - **Mixer Unitary**: $U(H_M, \beta_l) = e^{-i \beta_l \sum_{k=1}^n X_k} = \bigotimes_{k=1}^n (\cos\beta_l I - i \sin\beta_l X_k)$ facilitates quantum tunneling between orthogonal bitstrings.

### 4.2 Variational Parameter Optimization
The hybrid loop optimizes parameters $(\vec{\gamma}, \vec{\beta}) \in \mathbb{R}^{2p}$ using classical optimization:
$$\min_{\vec{\gamma}, \vec{\beta}} \langle H_C \rangle = \min_{\vec{\gamma}, \vec{\beta}} \langle \psi(\vec{\gamma}, \vec{\beta}) | H_C | \psi(\vec{\gamma}, \vec{\beta}) \rangle$$

### 4.3 Quantum Measurement & Sampling
Upon reaching variational convergence, $S$ measurement shots are sampled from the final quantum state $|\psi(\vec{\gamma}^*, \vec{\beta}^*)\rangle$:
$$P(x) = |\langle x | \psi(\vec{\gamma}^*, \vec{\beta}^*) \rangle|^2$$
The lowest-energy valid bitstring sampled corresponds to the recommended defensive posture.

---

## 5. Classical Benchmarks & Verification
To maintain strict empirical rigor, QAOA results are systematically benchmarked against:
1. **Exact Exhaustive Search**: Complete enumeration over all $2^n$ basis states to identify the absolute global minimum ground truth and calculate true approximation ratios:
   $$r = \frac{\langle H_C \rangle_{\text{QAOA}}}{E_{\text{Exact}}}$$
2. **Greedy Marginal Heuristic**: Iterative polynomial-time selection of controls maximizing $\frac{\Delta \text{Risk Severed}}{\text{Cost}}$.
3. **Simulated Annealing**: Classical Metropolis-Hastings Markov Chain Monte Carlo (MCMC) with geometric temperature decay schedule $T_{k+1} = \gamma T_k$.

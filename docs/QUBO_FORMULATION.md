# QuantumShield — QUBO Mathematical Formulation

## 1. Executive Summary

QuantumShield transforms the enterprise cybersecurity defensive control selection problem into a **Quadratic Unconstrained Binary Optimization (QUBO)** problem. The objective is to identify the Pareto-optimal combination of defensive countermeasures (MFA, network segmentation, zero-trust proxies, patching) that maximizes attack path severance while minimizing deployment overhead and operational disruption.

---

## 2. Decision Variables

Let $C = \{c_0, c_1, \dots, c_{N-1}\}$ denote the candidate defensive security controls.
Each control is assigned a binary decision variable:

$$x_i \in \{0, 1\} \quad \text{for } i \in \{0, 1, \dots, N-1\}$$

where:
- $x_i = 1$: Control $c_i$ is deployed.
- $x_i = 0$: Control $c_i$ is not deployed.

---

## 3. Objective Function Formulation

The total optimization Hamiltonian is formulated as:

$$\min_{\mathbf{x} \in \{0,1\}^N} H(\mathbf{x}) = H_{\text{cost}}(\mathbf{x}) + H_{\text{path}}(\mathbf{x}) + H_{\text{budget}}(\mathbf{x})$$

Which expands into standard QUBO upper-triangular matrix form:

$$H(\mathbf{x}) = \mathbf{x}^T Q \mathbf{x} + C_0 = \sum_{i=0}^{N-1} Q_{ii} x_i + \sum_{i < j} Q_{ij} x_i x_j + C_0$$

### 3.1 Control Deployment & Friction Cost Term ($H_{\text{cost}}$)

Every control $c_i$ has a measurable deployment cost $\text{cost}(c_i) \in [1, 20]$ and operational business friction penalty $\text{friction}(c_i) \in [1, 10]$:

$$H_{\text{cost}}(\mathbf{x}) = \alpha \sum_{i=0}^{N-1} \big( \text{cost}(c_i) + \text{friction}(c_i) \big) x_i$$

Where $\alpha > 0$ is the cost sensitivity weighting parameter.
- **Diagonal Contribution**: Adds $+\alpha \cdot (\text{cost}(c_i) + \text{friction}(c_i))$ to $Q_{ii}$.

### 3.2 Unblocked Attack Path Risk Penalty Term ($H_{\text{path}}$)

Let $\mathcal{P} = \{p_0, p_1, \dots, p_{M-1}\}$ be the set of critical attack paths discovered by the Attack Graph Engine.
Each path $p_k$ has a risk score $R(p_k) \in [1, 100]$ (derived from Phase 4 explainable risk metrics).

Let $S_k \subseteq \{0, 1, \dots, N-1\}$ be the indices of all controls that sever at least one edge in path $p_k$.
A path is **blocked** if at least one control in $S_k$ is active ($\sum_{i \in S_k} x_i \ge 1$).
A path is **unblocked** if no control in $S_k$ is active ($\sum_{i \in S_k} x_i = 0$).

To penalize leaving high-risk paths open while penalizing redundant duplicate controls:

$$H_{\text{path}}(\mathbf{x}) = \beta \sum_{k=0}^{M-1} R(p_k) \cdot \left( 1 - \sum_{i \in S_k} x_i \right)^2$$

Using binary identity $x_i^2 = x_i$:

$$\left( 1 - \sum_{i \in S_k} x_i \right)^2 = 1 - \sum_{i \in S_k} x_i + 2 \sum_{i < j \in S_k} x_i x_j$$

Therefore:
- **Constant Offset ($C_0$)**: Adds $+\beta \sum_{k=0}^{M-1} R(p_k)$.
- **Diagonal Reward ($Q_{ii}$)**: Adds $-\beta \cdot R(p_k)$ to $Q_{ii}$ for each $i \in S_k$.
- **Off-Diagonal Interaction ($Q_{ij}$)**: Adds $+2 \beta \cdot R(p_k)$ to $Q_{ij}$ for each pair $i < j \in S_k$.

### 3.3 Optional Budget Constraint Term ($H_{\text{budget}}$)

If a total financial expenditure budget $B$ is specified:

$$\sum_{i=0}^{N-1} \text{cost}(c_i) x_i \le B$$

The constraint is converted into an unconstrained quadratic penalty:

$$H_{\text{budget}}(\mathbf{x}) = \gamma \left( \sum_{i=0}^{N-1} \text{cost}(c_i) x_i - B \right)^2$$

Expanding:

$$H_{\text{budget}}(\mathbf{x}) = \gamma \left[ \sum_{i=0}^{N-1} \text{cost}(c_i)^2 x_i + 2 \sum_{i < j} \text{cost}(c_i) \text{cost}(c_j) x_i x_j - 2 B \sum_{i=0}^{N-1} \text{cost}(c_i) x_i + B^2 \right]$$

- **Constant Offset**: $+\gamma B^2$
- **Diagonal Entry**: $+\gamma (\text{cost}(c_i)^2 - 2 B \text{cost}(c_i))$
- **Off-Diagonal Entry**: $+2 \gamma \text{cost}(c_i) \text{cost}(c_j)$

---

## 4. Deterministic Behavior & Mathematical Properties

1. **Path Risk Prioritization**: Higher risk paths have larger $R(p_k)$, yielding larger negative coefficients $- \beta R(p_k)$ on their severing controls. The optimizer naturally prioritizes high-impact choke points over marginal perimeter controls.
2. **Anti-Redundancy Off-Diagonal Terms**: The positive quadratic terms $+2 \beta R(p_k) x_i x_j$ ensure that if control $i$ is selected, control $j$ receives a penalty penalty if it covers the exact same path without adding new coverage.
3. **Exact Global Optimality**: For benchmark instances $N \le 22$, classical exhaustive evaluation over all $2^N$ states provides an exact, non-heuristic mathematical ground truth against which quantum algorithms (QAOA) can be benchmarked.

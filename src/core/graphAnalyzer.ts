/**
 * QuantumShield — Attack Graph Analyzer
 * Graph traversal, attack path discovery, and cybersecurity risk scoring.
 */

import { AttackPath, CyberScenario, DefensiveControl, NetworkEdge, NetworkNode } from '../types/cyber';

export class GraphAnalyzer {
  private scenario: CyberScenario;
  private nodeMap: Map<string, NetworkNode>;
  private edgeMap: Map<string, NetworkEdge>;
  private adjacencyList: Map<string, NetworkEdge[]>;

  constructor(scenario: CyberScenario) {
    this.scenario = scenario;
    this.nodeMap = new Map(scenario.nodes.map(n => [n.id, n]));
    this.edgeMap = new Map(scenario.edges.map(e => [e.id, e]));
    this.adjacencyList = new Map();

    for (const node of scenario.nodes) {
      this.adjacencyList.set(node.id, []);
    }

    for (const edge of scenario.edges) {
      const edges = this.adjacencyList.get(edge.source) || [];
      edges.push(edge);
      this.adjacencyList.set(edge.source, edges);
    }
  }

  /**
   * Discovers all simple attack paths from entry point to crown jewel.
   */
  public findAllAttackPaths(): AttackPath[] {
    const entryId = this.scenario.entryPointNodeId;
    const targetId = this.scenario.crownJewelNodeId;
    const targetNode = this.nodeMap.get(targetId);
    const targetValue = targetNode ? targetNode.assetValue : 100;

    const paths: AttackPath[] = [];
    const visitedNodes = new Set<string>();

    const dfs = (currentNodeId: string, currentNodes: string[], currentEdges: NetworkEdge[]) => {
      if (currentNodeId === targetId) {
        // Found a path to crown jewel
        const edgeIds = currentEdges.map(e => e.id);
        const cumProb = currentEdges.reduce((acc, e) => acc * e.exploitLikelihood, 1.0);
        const avgCvss = currentEdges.reduce((acc, e) => acc + e.cvssBaseScore, 0) / (currentEdges.length || 1);
        
        // Risk formula: Product of transition likelihoods * CVSS weight * Crown Jewel value
        const rawRisk = cumProb * (avgCvss / 10) * targetValue * 1.25;
        const normalizedRisk = Math.min(100, Math.round(rawRisk));

        const techniques = Array.from(new Set(currentEdges.map(e => `${e.mitreId} (${e.technique})`)));

        paths.push({
          id: `path_${paths.length + 1}`,
          name: `Path ${paths.length + 1}: ${currentNodes.map(id => this.nodeMap.get(id)?.label || id).join(' → ')}`,
          nodes: [...currentNodes],
          edges: edgeIds,
          cumulativeProbability: Number(cumProb.toFixed(3)),
          riskScore: normalizedRisk,
          targetAssetValue: targetValue,
          mitreTechniques: techniques,
          severed: false,
          severedByControls: [],
        });
        return;
      }

      visitedNodes.add(currentNodeId);

      const outgoingEdges = this.adjacencyList.get(currentNodeId) || [];
      for (const edge of outgoingEdges) {
        if (!visitedNodes.has(edge.target)) {
          dfs(edge.target, [...currentNodes, edge.target], [...currentEdges, edge]);
        }
      }

      visitedNodes.delete(currentNodeId);
    };

    dfs(entryId, [entryId], []);
    // Sort paths by descending risk score
    return paths.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Evaluates path severance for a given set of active control IDs.
   */
  public evaluatePathMitigation(
    paths: AttackPath[],
    activeControlIds: string[],
    controls: DefensiveControl[]
  ): {
    evaluatedPaths: AttackPath[];
    severedCount: number;
    totalRisk: number;
    residualRisk: number;
    mitigatedRiskPercent: number;
  } {
    const activeControls = controls.filter(c => activeControlIds.includes(c.id));
    
    // Map of edge ID to active control names that mitigate it
    const edgeToMitigatingControls = new Map<string, string[]>();
    for (const ctrl of activeControls) {
      for (const edgeId of ctrl.mitigatesEdges) {
        const existing = edgeToMitigatingControls.get(edgeId) || [];
        existing.push(ctrl.shortCode);
        edgeToMitigatingControls.set(edgeId, existing);
      }
    }

    let severedCount = 0;
    let totalRisk = 0;
    let residualRisk = 0;

    const evaluatedPaths = paths.map(path => {
      totalRisk += path.riskScore;
      
      const severingControls: string[] = [];
      for (const edgeId of path.edges) {
        const mitigating = edgeToMitigatingControls.get(edgeId);
        if (mitigating && mitigating.length > 0) {
          severingControls.push(...mitigating);
        }
      }

      const uniqueSevering = Array.from(new Set(severingControls));
      const isSevered = uniqueSevering.length > 0;

      if (isSevered) {
        severedCount++;
      } else {
        residualRisk += path.riskScore;
      }

      return {
        ...path,
        severed: isSevered,
        severedByControls: uniqueSevering,
      };
    });

    const mitigatedRiskPercent = totalRisk > 0 
      ? Math.round(((totalRisk - residualRisk) / totalRisk) * 100) 
      : 100;

    return {
      evaluatedPaths,
      severedCount,
      totalRisk,
      residualRisk,
      mitigatedRiskPercent,
    };
  }
}

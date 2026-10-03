/**
 * QuantumShield — Attack Path Discovery Engine
 * Finds all simple directed attack paths from multiple entry points to multiple critical targets.
 * Handles cyclic graphs gracefully with branch pruning and configurable maximum path lengths.
 */

import {
  AttackGraph,
  AttackGraphEdge,
  AttackGraphNode,
  AttackPathResult,
  AttackPathStep,
  PathFinderOptions,
} from './types';

export class PathFinder {
  /**
   * Discovers all simple attack paths from entry points to critical targets.
   */
  public static findAllPaths(
    graph: AttackGraph,
    options: PathFinderOptions = {}
  ): AttackPathResult[] {
    const entryPointIds = options.entryPointIds && options.entryPointIds.length > 0
      ? options.entryPointIds
      : graph.entryPointIds;

    const crownJewelIds = options.crownJewelIds && options.crownJewelIds.length > 0
      ? options.crownJewelIds
      : graph.crownJewelIds;

    const maxPathLength = options.maxPathLength || 8;
    const maxPaths = options.maxPaths || 100;

    const targetSet = new Set(crownJewelIds);
    const nodeMap = new Map<string, AttackGraphNode>(graph.nodes.map(n => [n.id, n]));

    // Build forward adjacency list
    const adjacency = new Map<string, AttackGraphEdge[]>();
    for (const node of graph.nodes) {
      adjacency.set(node.id, []);
    }
    for (const edge of graph.edges) {
      const edges = adjacency.get(edge.source) || [];
      edges.push(edge);
      adjacency.set(edge.source, edges);
    }

    const discoveredPaths: AttackPathResult[] = [];
    const visitedInBranch = new Set<string>();

    /**
     * Depth-First Search with branch-level cycle prevention.
     */
    const dfs = (
      currentNodeId: string,
      currentNodes: string[],
      currentEdges: AttackGraphEdge[],
      initialEntryId: string
    ) => {
      // Reached maximum allowed paths cap
      if (discoveredPaths.length >= maxPaths) return;

      // Reached a target crown jewel (and path has at least 1 edge)
      if (targetSet.has(currentNodeId) && currentEdges.length > 0) {
        const pathResult = this.constructPathResult(
          discoveredPaths.length + 1,
          initialEntryId,
          currentNodeId,
          currentNodes,
          currentEdges,
          nodeMap
        );
        discoveredPaths.push(pathResult);
        // Continue search if there are outgoing edges to other targets, but avoid self-revisiting
      }

      // Check max depth constraint
      if (currentEdges.length >= maxPathLength) {
        return;
      }

      visitedInBranch.add(currentNodeId);

      const outgoing = adjacency.get(currentNodeId) || [];
      for (const edge of outgoing) {
        // Cycle avoidance: only traverse to unvisited node in current branch
        if (!visitedInBranch.has(edge.target)) {
          dfs(
            edge.target,
            [...currentNodes, edge.target],
            [...currentEdges, edge],
            initialEntryId
          );
        }
      }

      // Backtrack
      visitedInBranch.delete(currentNodeId);
    };

    // Iterate over all configured entry points
    for (const entryId of entryPointIds) {
      if (nodeMap.has(entryId)) {
        visitedInBranch.clear();
        dfs(entryId, [entryId], [], entryId);
      }
    }

    // Identify choke points (edges that appear across multiple paths)
    const edgeFrequency = new Map<string, number>();
    for (const p of discoveredPaths) {
      for (const edgeId of p.edgeSequence) {
        edgeFrequency.set(edgeId, (edgeFrequency.get(edgeId) || 0) + 1);
      }
    }

    // Annotate choke points (edges appearing in >= 2 paths)
    for (const p of discoveredPaths) {
      p.chokePoints = p.edgeSequence.filter(eId => (edgeFrequency.get(eId) || 0) >= 2);
    }

    // Sort paths by descending composite risk score
    return discoveredPaths.sort((a, b) => b.compositeRiskScore - a.compositeRiskScore);
  }

  private static constructPathResult(
    index: number,
    entryId: string,
    targetId: string,
    nodeIds: string[],
    edges: AttackGraphEdge[],
    nodeMap: Map<string, AttackGraphNode>
  ): AttackPathResult {
    const targetNode = nodeMap.get(targetId);
    const targetValue = targetNode ? targetNode.assetValue : 100;

    let cumulativeProb = 1.0;
    let maxCvss = 0.0;
    let sumCvss = 0.0;
    const allMitigatingControls = new Set<string>();

    const steps: AttackPathStep[] = [];

    edges.forEach((edge, stepIdx) => {
      cumulativeProb *= edge.exploitLikelihood;

      const cvss = edge.vulnerability ? edge.vulnerability.cvssBaseScore : 6.0;
      if (cvss > maxCvss) maxCvss = cvss;
      sumCvss += cvss;

      for (const ctrlId of edge.controlOpportunities) {
        allMitigatingControls.add(ctrlId);
      }

      const srcNode = nodeMap.get(edge.source);
      const tgtNode = nodeMap.get(edge.target);

      steps.push({
        stepNumber: stepIdx + 1,
        sourceNodeId: edge.source,
        sourceNodeName: srcNode ? srcNode.name : edge.source,
        targetNodeId: edge.target,
        targetNodeName: tgtNode ? tgtNode.name : edge.target,
        edgeId: edge.id,
        service: edge.service,
        protocol: edge.protocol,
        cveId: edge.vulnerability?.cveId,
        cvssScore: edge.vulnerability?.cvssBaseScore,
        exploitLikelihood: edge.exploitLikelihood,
        controlOpportunities: [...edge.controlOpportunities],
      });
    });

    const avgCvss = edges.length > 0 ? sumCvss / edges.length : 0.0;

    // Composite Risk Formula: Product of exploit probabilities * normalized CVSS * Target Value * 1.25
    const rawRisk = cumulativeProb * (avgCvss / 10.0) * targetValue * 1.25;
    const compositeRiskScore = Math.min(100, Math.max(1, Math.round(rawRisk)));

    const entryNode = nodeMap.get(entryId);
    const name = `Path ${index}: ${entryNode?.label || entryId} → ${targetNode?.label || targetId} (${edges.length} hops)`;

    return {
      pathId: `path_${index}`,
      name,
      entryPointId: entryId,
      crownJewelId: targetId,
      nodeSequence: [...nodeIds],
      edgeSequence: edges.map(e => e.id),
      length: edges.length,
      cumulativeProbability: Number(cumulativeProb.toFixed(3)),
      maxCvssScore: Number(maxCvss.toFixed(1)),
      avgCvssScore: Number(avgCvss.toFixed(1)),
      compositeRiskScore,
      mitigatingControls: Array.from(allMitigatingControls),
      chokePoints: [],
      steps,
    };
  }
}

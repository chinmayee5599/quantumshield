/**
 * QuantumShield — Graph Validator
 * Verifies connectivity, reachable targets, orphaned nodes, and cycle metrics.
 */

import { AttackGraph, GraphValidationResult } from './types';

export class GraphValidator {
  public static validate(graph: AttackGraph): GraphValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const nodeIds = new Set(graph.nodes.map(n => n.id));
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const id of nodeIds) {
      inDegree.set(id, 0);
      outDegree.set(id, 0);
      adjacency.set(id, []);
    }

    // 1. Validate Edges
    for (const edge of graph.edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge ${edge.id} references non-existent source: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge ${edge.id} references non-existent target: ${edge.target}`);
      }

      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
        adjacency.get(edge.source)?.push(edge.target);
      }
    }

    // 2. Identify Orphaned Nodes
    const orphanedNodes: string[] = [];
    for (const id of nodeIds) {
      if ((inDegree.get(id) || 0) === 0 && (outDegree.get(id) || 0) === 0) {
        orphanedNodes.push(id);
      }
    }
    if (orphanedNodes.length > 0) {
      warnings.push(`Detected ${orphanedNodes.length} orphaned nodes with no incoming/outgoing edges: ${orphanedNodes.join(', ')}`);
    }

    // 3. Reachability from Entry Points to Targets
    const reachableFromEntry = new Set<string>();
    const queue = [...graph.entryPointIds];
    queue.forEach(id => reachableFromEntry.add(id));

    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];
      const neighbors = adjacency.get(current) || [];
      for (const nbr of neighbors) {
        if (!reachableFromEntry.has(nbr)) {
          reachableFromEntry.add(nbr);
          queue.push(nbr);
        }
      }
    }

    const reachableTargets: string[] = [];
    const unreachableTargets: string[] = [];

    for (const targetId of graph.crownJewelIds) {
      if (reachableFromEntry.has(targetId)) {
        reachableTargets.push(targetId);
      } else {
        unreachableTargets.push(targetId);
        warnings.push(`Target Crown Jewel ${targetId} is not reachable from any designated entry point.`);
      }
    }

    // 4. Cycle Detection using DFS 3-color coloring (0: White, 1: Gray, 2: Black)
    const color = new Map<string, number>();
    for (const id of nodeIds) {
      color.set(id, 0);
    }

    let cycleCount = 0;
    const detectedCycleSamples: string[][] = [];
    const currentPath: string[] = [];

    const dfsCycle = (u: string) => {
      color.set(u, 1); // Gray: currently visiting
      currentPath.push(u);

      const neighbors = adjacency.get(u) || [];
      for (const v of neighbors) {
        if (color.get(v) === 1) {
          // Back-edge detected!
          cycleCount++;
          if (detectedCycleSamples.length < 5) {
            const cycleStartIndex = currentPath.indexOf(v);
            detectedCycleSamples.push([...currentPath.slice(cycleStartIndex), v]);
          }
        } else if (color.get(v) === 0) {
          dfsCycle(v);
        }
      }

      currentPath.pop();
      color.set(u, 2); // Black: finished visiting
    };

    for (const id of nodeIds) {
      if (color.get(id) === 0) {
        dfsCycle(id);
      }
    }

    // Graph density: |E| / (|V|*(|V|-1))
    const vCount = graph.nodes.length;
    const eCount = graph.edges.length;
    const density = vCount > 1 ? eCount / (vCount * (vCount - 1)) : 0;

    return {
      isValid: errors.length === 0 && reachableTargets.length > 0,
      hasCycles: cycleCount > 0,
      cycleCount,
      detectedCycleSamples,
      reachableTargets,
      unreachableTargets,
      orphanedNodes,
      errors,
      warnings,
      metrics: {
        nodeCount: vCount,
        edgeCount: eCount,
        entryPointCount: graph.entryPointIds.length,
        targetCount: graph.crownJewelIds.length,
        density: Number(density.toFixed(4)),
      },
    };
  }
}

/**
 * QuantumShield — Graph Visualization Adapter
 * Prepares attack graph topologies and discovered paths for frontend SVG / Canvas rendering.
 */

import { AttackGraph, AttackPathResult, GraphVisualizationData } from './types';

export class VisualizationAdapter {
  /**
   * Adapts graph and paths for SVG / Canvas rendering with zone column alignment.
   */
  public static toVisualizationFormat(
    graph: AttackGraph,
    paths: AttackPathResult[] = [],
    activeControlIds: string[] = []
  ): GraphVisualizationData {
    const severedEdgeSet = new Set<string>();

    // Mark edges severed if any active control covers them
    for (const edge of graph.edges) {
      if (edge.controlOpportunities.some(cId => activeControlIds.includes(cId))) {
        severedEdgeSet.add(edge.id);
      }
    }

    // Color palettes for node types and tiers
    const getNodeTheme = (node: AttackGraph['nodes'][0]) => {
      if (node.isCrownJewel || node.nodeType === 'critical_asset') {
        return {
          fill: '#451a03',
          stroke: '#f59e0b',
          badgeText: '#fde68a',
          badgeBg: '#78350f',
          glow: 'rgba(245, 158, 11, 0.4)',
        };
      }
      if (node.isEntryPoint) {
        return {
          fill: '#450a0a',
          stroke: '#ef4444',
          badgeText: '#fecaca',
          badgeBg: '#7f1d1d',
          glow: 'rgba(239, 68, 68, 0.4)',
        };
      }
      if (node.nodeType === 'identity') {
        return {
          fill: '#2e1065',
          stroke: '#a855f7',
          badgeText: '#e9d5ff',
          badgeBg: '#581c87',
          glow: 'rgba(168, 85, 247, 0.3)',
        };
      }
      if (node.nodeType === 'endpoint') {
        return {
          fill: '#0f172a',
          stroke: '#38bdf8',
          badgeText: '#bae6fd',
          badgeBg: '#0369a1',
          glow: 'rgba(56, 189, 248, 0.3)',
        };
      }
      return {
        fill: '#0f172a',
        stroke: '#06b6d4',
        badgeText: '#cffafe',
        badgeBg: '#0891b2',
        glow: 'rgba(6, 182, 212, 0.3)',
      };
    };

    const visualNodes = graph.nodes.map(n => {
      const theme = getNodeTheme(n);
      return {
        ...n,
        x: n.x || 100,
        y: n.y || 100,
        colorTheme: JSON.stringify(theme),
      };
    });

    const visualEdges = graph.edges.map(e => ({
      ...e,
      isSevered: severedEdgeSet.has(e.id),
      isHighlighted: false,
    }));

    return {
      nodes: visualNodes,
      edges: visualEdges,
      paths,
      viewport: {
        width: 880,
        height: 420,
      },
    };
  }
}

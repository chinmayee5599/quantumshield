/**
 * QuantumShield — Defensive Control Model
 * Implements deterministic mapping: Control → Affected Attack Edges → Affected Attack Paths.
 * Simulates defensive interventions, evaluates graph path severance, and computes residual risk.
 */

import { AttackGraph, AttackPathResult } from '../attackGraph/types';
import { PathFinder } from '../attackGraph/pathFinder';
import { DEFAULT_RISK_WEIGHTS, DetailedPathRiskReport, RiskWeightConfig } from '../risk/types';
import { RiskEngine } from '../risk/riskEngine';
import { ControlInterventionImpact, ControlToPathMapping, DefensiveControl } from './types';

export class DefensiveControlModel {
  /**
   * Builds an explicit mapping from each defensive control to the attack edges and paths it disrupts.
   */
  public static buildControlPathMappings(
    controls: DefensiveControl[],
    paths: AttackPathResult[]
  ): Map<string, ControlToPathMapping> {
    const mapping = new Map<string, ControlToPathMapping>();

    for (const ctrl of controls) {
      const affectedEdgeSet = new Set(ctrl.affectedEdgeIds);
      const blockedPathsSummary: ControlToPathMapping['blockedPathsSummary'] = [];
      const blockedPathIdSet = new Set<string>();

      for (const p of paths) {
        // Check if any edge in the path is severed by this control
        p.edgeSequence.forEach((eId, stepIdx) => {
          if (affectedEdgeSet.has(eId)) {
            blockedPathIdSet.add(p.pathId);
            blockedPathsSummary.push({
              pathId: p.pathId,
              pathName: p.name,
              entryPoint: p.entryPointId,
              targetAsset: p.crownJewelId,
              initialRisk: p.compositeRiskScore,
              severedAtStep: stepIdx + 1,
              severedEdgeId: eId,
            });
          }
        });
      }

      mapping.set(ctrl.controlId, {
        controlId: ctrl.controlId,
        controlName: ctrl.name,
        category: ctrl.category,
        cost: ctrl.deploymentCost,
        severedEdgeIds: [...ctrl.affectedEdgeIds],
        blockedPathIds: Array.from(blockedPathIdSet),
        partiallyMitigatedPathIds: [],
        blockedPathsSummary,
      });
    }

    return mapping;
  }

  /**
   * Answers the security question:
   * "If this control is selected, which dangerous paths become blocked or reduced?"
   */
  public static simulateSingleControl(
    controlId: string,
    controls: DefensiveControl[],
    graph: AttackGraph,
    paths: AttackPathResult[],
    weights: RiskWeightConfig = DEFAULT_RISK_WEIGHTS
  ): ControlToPathMapping & {
    impactSummary: string;
    totalRiskBefore: number;
    totalRiskAfter: number;
    riskReductionPct: number;
  } {
    const ctrl = controls.find(c => c.controlId === controlId);
    if (!ctrl) {
      throw new Error(`Defensive control not found with ID: ${controlId}`);
    }

    const mapping = this.buildControlPathMappings([ctrl], paths).get(controlId)!;
    const impact = this.evaluateControlIntervention([controlId], controls, graph, paths, weights);

    return {
      ...mapping,
      impactSummary: `Applying '${ctrl.name}' (${ctrl.category}, Cost: ${ctrl.deploymentCost}) severs ${mapping.severedEdgeIds.length} edge(s) and eliminates ${mapping.blockedPathIds.length} attack path(s), reducing total threat exposure by ${impact.riskReductionPercentage.toFixed(1)}%.`,
      totalRiskBefore: impact.initialTotalRisk,
      totalRiskAfter: impact.residualTotalRisk,
      riskReductionPct: impact.riskReductionPercentage,
    };
  }

  /**
   * Evaluates the comprehensive impact of activating an arbitrary subset of defensive controls.
   */
  public static evaluateControlIntervention(
    selectedControlIds: string[],
    controls: DefensiveControl[],
    graph: AttackGraph,
    initialPaths: AttackPathResult[],
    weights: RiskWeightConfig = DEFAULT_RISK_WEIGHTS
  ): ControlInterventionImpact {
    const activeControls = controls.filter(c => selectedControlIds.includes(c.controlId));

    // Calculate aggregated deployment cost and operational friction
    const totalDeploymentCost = activeControls.reduce((sum, c) => sum + c.deploymentCost, 0);
    const totalOperationalFriction = activeControls.reduce((sum, c) => sum + c.operationalFriction, 0);

    // Collect all severed edge IDs
    const severedEdgeSet = new Set<string>();
    for (const ctrl of activeControls) {
      for (const eId of ctrl.affectedEdgeIds) {
        severedEdgeSet.add(eId);
      }
    }

    // Determine blocked paths (paths where at least one edge is severed)
    const blockedPaths: AttackPathResult[] = [];
    const residualPaths: AttackPathResult[] = [];

    for (const p of initialPaths) {
      const isBlocked = p.edgeSequence.some(eId => severedEdgeSet.has(eId));
      if (isBlocked) {
        blockedPaths.push(p);
      } else {
        residualPaths.push(p);
      }
    }

    // Graph Retraversal Verification:
    // Create pruned graph G' = (V, E \ E_severed) and discover remaining paths to verify mathematically
    const prunedGraph: AttackGraph = {
      ...graph,
      edges: graph.edges.filter(e => !severedEdgeSet.has(e.id)),
    };

    const verifiedResidualPaths = PathFinder.findAllPaths(prunedGraph, {
      entryPointIds: graph.entryPointIds,
      crownJewelIds: graph.crownJewelIds,
      maxPathLength: 8,
    });

    // Score initial paths vs residual paths using RiskEngine
    const initialRiskReports = RiskEngine.evaluateAllPaths(graph, initialPaths, weights);
    const residualRiskReports = RiskEngine.evaluateAllPaths(prunedGraph, verifiedResidualPaths, weights);

    const initialTotalRisk = Number(
      initialRiskReports.reduce((sum, r) => sum + r.totalRiskScore, 0).toFixed(1)
    );
    const residualTotalRisk = Number(
      residualRiskReports.reduce((sum, r) => sum + r.totalRiskScore, 0).toFixed(1)
    );

    const absoluteRiskReduction = Number(Math.max(0, initialTotalRisk - residualTotalRisk).toFixed(1));
    const riskReductionPercentage =
      initialTotalRisk > 0
        ? Number(((absoluteRiskReduction / initialTotalRisk) * 100.0).toFixed(1))
        : 100.0;

    const costEfficiencyRatio =
      totalDeploymentCost > 0
        ? Number((absoluteRiskReduction / totalDeploymentCost).toFixed(2))
        : 0.0;

    // Crown Jewel Protection Assertion:
    // Protected if 0 paths reach any designated Crown Jewel
    const isCrownJewelProtected = verifiedResidualPaths.length === 0;

    // Security Analyst Executive Briefing
    const analystSummary: string[] = [
      `Active Interventions: ${activeControls.length} control(s) selected (Total Cost: ${totalDeploymentCost}, Friction: ${totalOperationalFriction})`,
      `Graph Severance: ${severedEdgeSet.size} transition edge(s) severed out of ${graph.edges.length} total edges`,
      `Path Elimination: ${blockedPaths.length} of ${initialPaths.length} attack path(s) neutralized (${riskReductionPercentage.toFixed(1)}% total risk reduction)`,
      `Crown Jewel Defense State: ${isCrownJewelProtected ? 'FORTIFIED (100% of attack paths reaching critical targets severed)' : `EXPOSED (${verifiedResidualPaths.length} active residual path(s) remain)`}`,
      `Cost-Efficiency: ${costEfficiencyRatio.toFixed(2)} risk points eliminated per unit deployment cost`,
    ];

    if (!isCrownJewelProtected && verifiedResidualPaths.length > 0) {
      analystSummary.push(
        `Critical Alert: Residual attack vector remains open: '${verifiedResidualPaths[0].name}' (Risk: ${residualRiskReports[0]?.totalRiskScore || 0}/100)`
      );
    }

    return {
      selectedControlIds: [...selectedControlIds],
      totalDeploymentCost,
      totalOperationalFriction,
      severedEdgeIds: Array.from(severedEdgeSet),
      blockedPathIds: blockedPaths.map(p => p.pathId),
      unmitigatedPathIds: verifiedResidualPaths.map(p => p.pathId),
      initialPathCount: initialPaths.length,
      residualPathCount: verifiedResidualPaths.length,
      initialTotalRisk,
      residualTotalRisk,
      absoluteRiskReduction,
      riskReductionPercentage,
      costEfficiencyRatio,
      isCrownJewelProtected,
      blockedPaths,
      residualPaths: verifiedResidualPaths,
      residualRiskReports,
      analystSummary,
    };
  }
}

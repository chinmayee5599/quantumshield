/**
 * QuantumShield — Transparent Attack Path Risk Engine
 * Mathematical, explainable risk scoring system decomposing cyber risk into
 * vulnerability severity, exploitability likelihood, target criticality,
 * privilege escalation, trust boundary transitions, and path length.
 */

import { AttackGraph, AttackPathResult } from '../attackGraph/types';
import {
  DEFAULT_RISK_WEIGHTS,
  DetailedPathRiskReport,
  EdgeRiskContribution,
  FactorBreakdown,
  RiskSeverityCategory,
  RiskWeightConfig,
} from './types';

export class RiskEngine {
  /**
   * Calculates detailed, explainable risk reports for a set of attack paths.
   */
  public static evaluateAllPaths(
    graph: AttackGraph,
    paths: AttackPathResult[],
    weights: RiskWeightConfig = DEFAULT_RISK_WEIGHTS
  ): DetailedPathRiskReport[] {
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    const edgeMap = new Map(graph.edges.map(e => [e.id, e]));

    return paths
      .map(path => this.evaluateSinglePath(path, nodeMap, edgeMap, weights))
      .sort((a, b) => b.totalRiskScore - a.totalRiskScore);
  }

  /**
   * Evaluates a single attack path with explicit factor breakdown and analyst explanations.
   */
  public static evaluateSinglePath(
    path: AttackPathResult,
    nodeMap: Map<string, AttackGraph['nodes'][0]>,
    edgeMap: Map<string, AttackGraph['edges'][0]>,
    weights: RiskWeightConfig = DEFAULT_RISK_WEIGHTS
  ): DetailedPathRiskReport {
    const targetNode = nodeMap.get(path.crownJewelId);
    const sourceNode = nodeMap.get(path.entryPointId);

    const targetCriticality = targetNode?.criticality || 'HIGH';
    const targetAssetValue = targetNode?.assetValue || 80;

    // -------------------------------------------------------------
    // Factor 1: Target Asset Criticality (0.0 to 1.0)
    // -------------------------------------------------------------
    let targetFactor = targetAssetValue / 100.0;
    if (targetCriticality === 'CRITICAL') targetFactor = Math.max(targetFactor, 1.0);
    else if (targetCriticality === 'HIGH') targetFactor = Math.max(targetFactor, 0.80);
    else if (targetCriticality === 'MEDIUM') targetFactor = Math.max(targetFactor, 0.55);
    else targetFactor = Math.max(targetFactor, 0.30);
    targetFactor = Math.min(1.0, Math.max(0.1, targetFactor));

    // -------------------------------------------------------------
    // Factor 2: Vulnerability Severity (0.0 to 1.0)
    // S_vuln = 0.6 * max(CVSS) + 0.4 * avg(CVSS)
    // -------------------------------------------------------------
    const cvssScores: number[] = [];
    path.edgeSequence.forEach(eId => {
      const edge = edgeMap.get(eId);
      if (edge?.vulnerability) {
        cvssScores.push(edge.vulnerability.cvssBaseScore);
      } else {
        cvssScores.push(edge?.relationshipType === 'credential_relay' ? 7.5 : 5.0);
      }
    });

    const maxCvss = cvssScores.length > 0 ? Math.max(...cvssScores) : 5.0;
    const avgCvss = cvssScores.length > 0 ? cvssScores.reduce((a, b) => a + b, 0) / cvssScores.length : 5.0;
    const vulnFactor = Math.min(1.0, (0.6 * maxCvss + 0.4 * avgCvss) / 10.0);

    // -------------------------------------------------------------
    // Factor 3: Exploitability Likelihood (0.0 to 1.0)
    // Combines cumulative probability and geometric mean across hops
    // -------------------------------------------------------------
    let cumulativeLikelihood = 1.0;
    const hopCount = path.edgeSequence.length;

    path.edgeSequence.forEach(eId => {
      const edge = edgeMap.get(eId);
      cumulativeLikelihood *= edge ? edge.exploitLikelihood : 0.70;
    });

    const geometricMeanLikelihood = hopCount > 0 ? Math.pow(cumulativeLikelihood, 1.0 / hopCount) : 0.70;
    // Weighted blend: 50% cumulative chain certainty + 50% average per-hop ease
    const exploitFactor = Math.min(1.0, Math.max(0.05, 0.5 * cumulativeLikelihood + 0.5 * geometricMeanLikelihood));

    // -------------------------------------------------------------
    // Factor 4: Privilege Escalation Magnitude (0.0 to 1.0)
    // -------------------------------------------------------------
    let escalationStepsCount = 0;
    let highestPrivilege = 'User';

    path.edgeSequence.forEach(eId => {
      const edge = edgeMap.get(eId);
      if (
        edge?.relationshipType === 'credential_relay' ||
        edge?.privilegeRequirement === 'HIGH' ||
        edge?.trustTransition === 'privilege_boundary'
      ) {
        escalationStepsCount++;
        highestPrivilege = 'Administrative';
      }
    });

    if (targetCriticality === 'CRITICAL') highestPrivilege = 'System_Root / Crown_Jewel';

    let privFactor = 0.40 + 0.20 * escalationStepsCount;
    if (targetCriticality === 'CRITICAL') privFactor += 0.20;
    privFactor = Math.min(1.0, Math.max(0.1, privFactor));

    // -------------------------------------------------------------
    // Factor 5: Security Boundaries Crossed (0.0 to 1.0)
    // -------------------------------------------------------------
    const zonesTraversed: string[] = [];
    path.nodeSequence.forEach(nId => {
      const node = nodeMap.get(nId);
      if (node && (zonesTraversed.length === 0 || zonesTraversed[zonesTraversed.length - 1] !== node.networkZone)) {
        zonesTraversed.push(node.networkZone);
      }
    });

    const boundariesCrossedCount = Math.max(0, zonesTraversed.length - 1);
    const boundaryFactor = Math.min(1.0, Math.max(0.1, 0.30 + 0.20 * boundariesCrossedCount));

    // -------------------------------------------------------------
    // Factor 6: Path Length & Friction Multiplier (0.70 to 1.0)
    // Shorter paths offer fewer detection opportunities
    // -------------------------------------------------------------
    const lengthMultiplier = Math.max(0.70, Number((1.0 - 0.05 * Math.max(0, hopCount - 1)).toFixed(2)));

    // -------------------------------------------------------------
    // Synthesize Total Risk Score (0.0 to 100.0)
    // R = 100 * [ sum(w_i * f_i) ] * lengthMultiplier
    // -------------------------------------------------------------
    const baseWeightedSum =
      weights.weightTargetCriticality * targetFactor +
      weights.weightVulnerability * vulnFactor +
      weights.weightExploitability * exploitFactor +
      weights.weightPrivilege * privFactor +
      weights.weightBoundaries * boundaryFactor;

    const rawTotal = 100.0 * baseWeightedSum * lengthMultiplier;
    const totalRiskScore = Number(Math.min(100.0, Math.max(1.0, rawTotal)).toFixed(1));

    // Severity Category
    let severityCategory: RiskSeverityCategory = 'LOW';
    if (totalRiskScore >= 85.0) severityCategory = 'CRITICAL';
    else if (totalRiskScore >= 70.0) severityCategory = 'HIGH';
    else if (totalRiskScore >= 45.0) severityCategory = 'MEDIUM';

    // Individual Edge Risks
    const individualEdgeRisks: EdgeRiskContribution[] = path.edgeSequence.map((eId, idx) => {
      const edge = edgeMap.get(eId)!;
      const cvss = edge.vulnerability ? edge.vulnerability.cvssBaseScore : 6.0;
      const edgeScore = Number(Math.min(100, Math.round(cvss * edge.exploitLikelihood * 10)).toFixed(1));

      return {
        stepNumber: idx + 1,
        edgeId: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        cveId: edge.vulnerability ? edge.vulnerability.cveId : null,
        cvssBaseScore: cvss,
        exploitLikelihood: edge.exploitLikelihood,
        privilegeRequirement: edge.privilegeRequirement,
        trustTransition: edge.trustTransition || 'same_zone',
        edgeRiskScore: edgeScore,
        mitigatingControls: [...edge.controlOpportunities],
        justification: edge.vulnerability
          ? `CVE ${edge.vulnerability.cveId} (CVSS ${cvss}) with ${(edge.exploitLikelihood * 100).toFixed(0)}% likelihood`
          : `${edge.relationshipType} transition via ${edge.service} (Port ${edge.port})`,
      };
    });

    // Analyst Explanations
    const analystExplanation: string[] = [
      `Target Criticality: ${targetNode?.name || path.crownJewelId} (${targetCriticality} Criticality, Asset Value ${targetAssetValue}/100)`,
      `Vulnerability Severity: Peak CVSS ${maxCvss.toFixed(1)}, Path Average CVSS ${avgCvss.toFixed(1)} across ${hopCount} transitions`,
      `Exploitability: ${(cumulativeLikelihood * 100).toFixed(1)}% cumulative chain probability (${(geometricMeanLikelihood * 100).toFixed(1)}% per-hop geometric mean)`,
      `Privilege Escalation: ${escalationStepsCount} high-privilege escalation transitions reaching ${highestPrivilege}`,
      `Security Boundaries: ${boundariesCrossedCount} network boundaries crossed (${zonesTraversed.join(' → ')})`,
      `Path Friction: ${hopCount} hops with length multiplier ${lengthMultiplier.toFixed(2)}x (shorter paths reduce SOC detection opportunity)`,
    ];

    const factorBreakdown: FactorBreakdown = {
      targetCriticality: {
        rawLevel: targetCriticality,
        assetValue: targetAssetValue,
        factor: Number(targetFactor.toFixed(3)),
        weightedContribution: Number((weights.weightTargetCriticality * targetFactor * 100).toFixed(1)),
        explanation: `${targetCriticality} asset importance (${targetAssetValue}/100)`,
      },
      vulnerabilitySeverity: {
        maxCvss,
        avgCvss: Number(avgCvss.toFixed(1)),
        factor: Number(vulnFactor.toFixed(3)),
        weightedContribution: Number((weights.weightVulnerability * vulnFactor * 100).toFixed(1)),
        explanation: `Peak CVSS ${maxCvss.toFixed(1)}, Avg CVSS ${avgCvss.toFixed(1)}`,
      },
      exploitability: {
        cumulativeLikelihood: Number(cumulativeLikelihood.toFixed(3)),
        geometricMeanLikelihood: Number(geometricMeanLikelihood.toFixed(3)),
        factor: Number(exploitFactor.toFixed(3)),
        weightedContribution: Number((weights.weightExploitability * exploitFactor * 100).toFixed(1)),
        explanation: `${(cumulativeLikelihood * 100).toFixed(1)}% chain exploit probability`,
      },
      privilegeEscalation: {
        escalationStepsCount,
        highestPrivilegeAttained: highestPrivilege,
        factor: Number(privFactor.toFixed(3)),
        weightedContribution: Number((weights.weightPrivilege * privFactor * 100).toFixed(1)),
        explanation: `${escalationStepsCount} escalation step(s) achieving ${highestPrivilege}`,
      },
      boundaryCrossings: {
        boundariesCrossedCount,
        zonesTraversed,
        factor: Number(boundaryFactor.toFixed(3)),
        weightedContribution: Number((weights.weightBoundaries * boundaryFactor * 100).toFixed(1)),
        explanation: `${boundariesCrossedCount} boundary traversal(s) across zones`,
      },
      pathLength: {
        hopCount,
        multiplier: lengthMultiplier,
        explanation: `${hopCount} hops (multiplier ${lengthMultiplier.toFixed(2)})`,
      },
    };

    return {
      pathId: path.pathId,
      pathName: path.name,
      sourceNodeId: path.entryPointId,
      targetNodeId: path.crownJewelId,
      totalRiskScore,
      severityCategory,
      factorBreakdown,
      individualEdgeRisks,
      analystExplanation,
      chokePoints: [...path.chokePoints],
      weightsUsed: { ...weights },
    };
  }
}

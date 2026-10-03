/**
 * QuantumShield — Cybersecurity Explainability & Path Disruption Analyzer
 * Synthesizes defensive reasoning: why specific controls were chosen by the QUBO/QAOA
 * optimization, which attack bottlenecks were severed, and how Crown Jewels are protected.
 */

import { AttackPath, CyberScenario, DefensiveControl } from '../types/cyber';
import { SolverResult } from '../types/quantum';

export interface ExplanationReport {
  summary: string;
  crownJewelSecured: boolean;
  totalRiskMitigatedPercent: number;
  totalCost: number;
  operationalFriction: number;
  chokePointsDisrupted: {
    controlName: string;
    category: string;
    impactDescription: string;
    pathsSevered: string[];
    riskScoreSaved: number;
  }[];
  unmitigatedVulnerabilities: {
    pathName: string;
    residualRisk: number;
    unmitigatedEdge: string;
    recommendedRemediation: string;
  }[];
  defenseInDepthVerdict: string;
  costEfficiencyRatio: number; // Risk mitigated per unit cost
}

export class Explainer {
  public static generateExplanation(
    scenario: CyberScenario,
    paths: AttackPath[],
    controls: DefensiveControl[],
    solverResult: SolverResult
  ): ExplanationReport {
    const selectedControls = controls.filter(c => solverResult.selectedControlIds.includes(c.id));
    const activeControlIds = selectedControls.map(c => c.id);

    // Map each edge to controls that sever it
    const edgeToControlMap = new Map<string, DefensiveControl[]>();
    for (const ctrl of selectedControls) {
      for (const edgeId of ctrl.mitigatesEdges) {
        const list = edgeToControlMap.get(edgeId) || [];
        list.push(ctrl);
        edgeToControlMap.set(edgeId, list);
      }
    }

    // Examine each selected control's specific contribution
    const chokePointsDisrupted = selectedControls.map(ctrl => {
      const severedPathsForControl: AttackPath[] = [];
      let riskSaved = 0;

      for (const path of paths) {
        const touches = path.edges.some(e => ctrl.mitigatesEdges.includes(e));
        if (touches) {
          severedPathsForControl.push(path);
          riskSaved += path.riskScore;
        }
      }

      let impactDescription = '';
      if (ctrl.category === 'Identity') {
        impactDescription = `Neutralized identity escalation vectors by invalidating credential reuse across tiers.`;
      } else if (ctrl.category === 'Network') {
        impactDescription = `Severed lateral movement corridor, preventing unsegmented packet traversal.`;
      } else if (ctrl.category === 'Patch') {
        impactDescription = `Eliminated entrypoint exploit primitive at the ingress boundary.`;
      } else if (ctrl.category === 'ZeroTrust') {
        impactDescription = `Established strict micro-perimeter choke point immediately before core assets.`;
      } else {
        impactDescription = `Hardened host execution boundary against malicious process spawning.`;
      }

      return {
        controlName: ctrl.name,
        category: ctrl.category,
        impactDescription,
        pathsSevered: severedPathsForControl.map(p => p.name),
        riskScoreSaved: riskSaved,
      };
    });

    // Examine unmitigated paths
    const unmitigatedVulnerabilities: ExplanationReport['unmitigatedVulnerabilities'] = [];
    let crownJewelSecured = true;

    for (const path of paths) {
      const isSevered = path.edges.some(edgeId => edgeToControlMap.has(edgeId));
      if (!isSevered) {
        crownJewelSecured = false;
        const lastEdgeId = path.edges[path.edges.length - 1];
        const edgeObj = scenario.edges.find(e => e.id === lastEdgeId);

        unmitigatedVulnerabilities.push({
          pathName: path.name,
          residualRisk: path.riskScore,
          unmitigatedEdge: edgeObj ? `${edgeObj.source} → ${edgeObj.target} (${edgeObj.technique})` : lastEdgeId,
          recommendedRemediation: `Deploy secondary defense or review budget constraints to cover transition ${lastEdgeId}.`,
        });
      }
    }

    // Cost efficiency ratio
    const totalCost = solverResult.totalCost || 1;
    const efficiency = Number((solverResult.riskMitigatedPercent / totalCost).toFixed(2));

    // Defense in depth assessment
    let defenseInDepthVerdict = '';
    if (crownJewelSecured && solverResult.riskMitigatedPercent >= 95) {
      defenseInDepthVerdict = `Optimal Fortress: 100% of attack paths reaching the Crown Jewel (${scenario.crownJewelNodeId}) have been intercepted. Redundant lateral paths are severed at both initial access and internal pivot stages.`;
    } else if (crownJewelSecured) {
      defenseInDepthVerdict = `Target Protected: Primary critical attack vectors are severed, though minor auxiliary reconnaissance or lateral edges remain unmitigated due to cost-penalty trade-offs.`;
    } else {
      defenseInDepthVerdict = `Elevated Exposure: ${unmitigatedVulnerabilities.length} attack path(s) remain open to the Crown Jewel. Increasing the QUBO risk penalty coefficient beta will enforce tighter coverage.`;
    }

    const summary = crownJewelSecured
      ? `The optimization converged on ${selectedControls.length} complementary controls totaling ${solverResult.totalCost} cost units, successfully neutralizing ${solverResult.pathsSeveredCount} of ${solverResult.totalPathsCount} identified attack chains (${solverResult.riskMitigatedPercent}% total risk reduction).`
      : `Partial mitigation achieved: ${solverResult.pathsSeveredCount} of ${solverResult.totalPathsCount} attack paths disrupted, leaving ${unmitigatedVulnerabilities.length} potential vector open under current cost constraints.`;

    return {
      summary,
      crownJewelSecured,
      totalRiskMitigatedPercent: solverResult.riskMitigatedPercent,
      totalCost: solverResult.totalCost,
      operationalFriction: solverResult.operationalFriction,
      chokePointsDisrupted,
      unmitigatedVulnerabilities,
      defenseInDepthVerdict,
      costEfficiencyRatio: efficiency,
    };
  }
}

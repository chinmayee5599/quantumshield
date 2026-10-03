/**
 * QuantumShield — Attack Graph Engine API
 * Unified exports for attack graph construction, validation, pathfinding, and visualization.
 */

export * from './types';
export * from './attackGraphBuilder';
export * from './pathFinder';
export * from './graphValidator';
export * from './visualizationAdapter';

import { ScenarioDefinition } from '../../data/dataTypes';
import { AttackGraphBuilder } from './attackGraphBuilder';
import { PathFinder } from './pathFinder';
import { GraphValidator } from './graphValidator';
import { VisualizationAdapter } from './visualizationAdapter';
import { AttackGraph, AttackPathResult, GraphValidationResult, GraphVisualizationData, PathFinderOptions } from './types';

/**
 * High-level unified API function to build, validate, and discover paths from a scenario.
 */
export function analyzeScenarioGraph(
  scenario: ScenarioDefinition,
  options?: PathFinderOptions
): {
  graph: AttackGraph;
  validation: GraphValidationResult;
  paths: AttackPathResult[];
  visualization: GraphVisualizationData;
} {
  const graph = AttackGraphBuilder.buildFromScenario(scenario);
  const validation = GraphValidator.validate(graph);
  const paths = PathFinder.findAllPaths(graph, options);
  const visualization = VisualizationAdapter.toVisualizationFormat(graph, paths);

  return {
    graph,
    validation,
    paths,
    visualization,
  };
}

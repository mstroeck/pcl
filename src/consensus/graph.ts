/**
 * Dependency graph resolution and topological sorting
 */

import { ConsensusStep } from './types.js';

export interface DependencyGraphResult {
  order: string[];
  cycles: string[][];
  missingDeps: Array<{ stepId: string; missingDep: string }>;
}

// Detect cycles in dependency graph using DFS
export function detectCycles(steps: ConsensusStep[]): string[][] {
  const graph = buildGraph(steps);
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
      }
    }

    recursionStack.delete(nodeId);
  }

  for (const step of steps) {
    if (!visited.has(step.id)) {
      dfs(step.id, []);
    }
  }

  return cycles;
}

// Build adjacency list from steps
function buildGraph(steps: ConsensusStep[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const step of steps) {
    if (!graph.has(step.id)) {
      graph.set(step.id, []);
    }

    for (const dep of step.dependencies) {
      if (!graph.has(dep)) {
        graph.set(dep, []);
      }
      graph.get(step.id)!.push(dep);
    }
  }

  return graph;
}

// Find missing dependencies
export function findMissingDependencies(steps: ConsensusStep[]): Array<{ stepId: string; missingDep: string }> {
  const stepIds = new Set(steps.map((s) => s.id));
  const missing: Array<{ stepId: string; missingDep: string }> = [];

  for (const step of steps) {
    for (const dep of step.dependencies) {
      if (!stepIds.has(dep)) {
        missing.push({ stepId: step.id, missingDep: dep });
      }
    }
  }

  return missing;
}

// Topological sort using Kahn's algorithm
export function topologicalSort(steps: ConsensusStep[]): DependencyGraphResult {
  const cycles = detectCycles(steps);
  const missingDeps = findMissingDependencies(steps);

  if (cycles.length > 0) {
    // Cannot perform topological sort if there are cycles
    return {
      order: steps.map((s) => s.id),
      cycles,
      missingDeps,
    };
  }

  // Build in-degree map
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  for (const step of steps) {
    inDegree.set(step.id, 0);
    graph.set(step.id, []);
  }

  for (const step of steps) {
    for (const dep of step.dependencies) {
      if (inDegree.has(dep)) {
        inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
        if (!graph.has(dep)) {
          graph.set(dep, []);
        }
        graph.get(dep)!.push(step.id);
      }
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  const result: string[] = [];

  // Start with nodes that have no dependencies
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return {
    order: result,
    cycles,
    missingDeps,
  };
}

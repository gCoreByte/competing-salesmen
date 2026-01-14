import { describe, it, expect } from 'vitest'
import koptAlgorithm from '../kopt'
import type { Graph } from '../../types/tsp'

describe('k-opt Algorithm', () => {
  describe('Basic properties', () => {
    it('should have the correct name', () => {
      expect(koptAlgorithm.name).toBe('k-opt')
    })

    it('should have configOptions defined', () => {
      expect(koptAlgorithm.configOptions).toBeDefined()
      expect(koptAlgorithm.configOptions).toHaveLength(1)
    })

    it('should have k config option with correct properties', () => {
      const kOption = koptAlgorithm.configOptions?.[0]
      expect(kOption).toBeDefined()
      expect(kOption?.key).toBe('k')
      expect(kOption?.label).toBe('k value')
      expect(kOption?.type).toBe('number')
      expect(kOption?.default).toBe(2)
      expect(kOption?.min).toBe(2)
      expect(kOption?.max).toBe(5)
    })

    it('should return a result with path and performance', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
        ],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      expect(result).toHaveProperty('path')
      expect(result).toHaveProperty('performance')
      expect(result.performance).toHaveProperty('distance')
      expect(result.performance).toHaveProperty('runtime')
      expect(result.performance).toHaveProperty('reads')
      expect(result.performance).toHaveProperty('writes')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty graph', () => {
      const graph: Graph = {
        nodes: [],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      expect(result.path).toHaveLength(0)
      expect(result.performance.distance).toBe(0)
      expect(result.performance.reads).toBeGreaterThanOrEqual(0)
      expect(result.performance.writes).toBeGreaterThanOrEqual(0)
    })

    it('should handle single node', () => {
      const graph: Graph = {
        nodes: [{ id: 1, x: 10, y: 20 }],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      expect(result.path).toHaveLength(1)
      expect(result.path[0]?.id).toBe(1)
      expect(result.performance.distance).toBe(0)
    })

    it('should handle two nodes', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 3, y: 4 },
        ],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      // Path should include return to start: [A, B, A]
      expect(result.path).toHaveLength(3)
      // Round trip distance: 5 + 5 = 10
      expect(result.performance.distance).toBeCloseTo(10, 5)
    })

    it('should handle three nodes forming a triangle', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 0.5, y: Math.sqrt(3) / 2 },
        ],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      expect(result.path).toHaveLength(4)
      // Equilateral triangle with side 1, perimeter = 3
      expect(result.performance.distance).toBeCloseTo(3, 5)
    })
  })

  describe('Distance calculation', () => {
    it('should calculate correct distance for square', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
          { id: 4, x: 0, y: 1 },
        ],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      // Optimal tour is the perimeter = 4
      expect(result.performance.distance).toBeCloseTo(4, 5)
    })

    it('should find optimal or near-optimal solution for simple cases', () => {
      // Line of points - optimal tour should traverse them in order
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 2, y: 0 },
          { id: 4, x: 3, y: 0 },
        ],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      // Optimal: 0->1->2->3->0 = 3 + 3 = 6
      expect(result.performance.distance).toBeCloseTo(6, 5)
    })
  })

  describe('k value configurations', () => {
    const graph: Graph = {
      nodes: [
        { id: 1, x: 0, y: 0 },
        { id: 2, x: 10, y: 0 },
        { id: 3, x: 10, y: 10 },
        { id: 4, x: 0, y: 10 },
        { id: 5, x: 5, y: 5 },
      ],
      edges: [],
    }

    it('should work with k=2 (default)', () => {
      const result = koptAlgorithm.solve(graph, { k: 2 })

      expect(result.path.length).toBeGreaterThan(0)
      expect(result.performance.distance).toBeGreaterThan(0)
    })

    it('should work with k=3', () => {
      const result = koptAlgorithm.solve(graph, { k: 3 })

      expect(result.path.length).toBeGreaterThan(0)
      expect(result.performance.distance).toBeGreaterThan(0)
    })

    it('should work with k=4', () => {
      const result = koptAlgorithm.solve(graph, { k: 4 })

      expect(result.path.length).toBeGreaterThan(0)
      expect(result.performance.distance).toBeGreaterThan(0)
    })

    it('should work with k=5', () => {
      const result = koptAlgorithm.solve(graph, { k: 5 })

      expect(result.path.length).toBeGreaterThan(0)
      expect(result.performance.distance).toBeGreaterThan(0)
    })

    it('should use k=2 as default when config not provided', () => {
      const result1 = koptAlgorithm.solve(graph)
      const result2 = koptAlgorithm.solve(graph, { k: 2 })

      // Results should be the same (deterministic algorithm)
      expect(result1.performance.distance).toBeCloseTo(result2.performance.distance, 5)
    })

    it('higher k values should produce results at least as good as lower k values', () => {
      const largerGraph: Graph = {
        nodes: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          x: Math.cos((2 * Math.PI * i) / 10) * 50 + 50,
          y: Math.sin((2 * Math.PI * i) / 10) * 50 + 50,
        })),
        edges: [],
      }

      const result2 = koptAlgorithm.solve(largerGraph, { k: 2 })
      const result3 = koptAlgorithm.solve(largerGraph, { k: 3 })

      // k=3 should be at least as good as k=2 (with some tolerance for floating point)
      expect(result3.performance.distance).toBeLessThanOrEqual(
        result2.performance.distance + 0.001,
      )
    })
  })

  describe('Performance tracking', () => {
    it('should track runtime', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      expect(result.performance.runtime).toBeGreaterThan(0)
      expect(typeof result.performance.runtime).toBe('number')
    })

    it('should track reads and writes', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      expect(result.performance.reads).toBeGreaterThanOrEqual(0)
      expect(result.performance.writes).toBeGreaterThanOrEqual(0)
      expect(typeof result.performance.reads).toBe('number')
      expect(typeof result.performance.writes).toBe('number')
    })
  })

  describe('Path structure', () => {
    it('should return path ending at start node (closed tour)', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
          { id: 4, x: 0, y: 1 },
        ],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      // Path should be n+1 elements (tour + return to start)
      expect(result.path).toHaveLength(5)
      expect(result.path[0]?.id).toBe(result.path[result.path.length - 1]?.id)
    })

    it('should visit all nodes exactly once (except for return)', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 2, y: 1 },
          { id: 4, x: 1, y: 2 },
          { id: 5, x: 0, y: 1 },
        ],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      // Excluding the last node (return to start)
      const tourWithoutReturn = result.path.slice(0, -1)
      const visitedIds = new Set(tourWithoutReturn.map((n) => n.id))

      expect(visitedIds.size).toBe(5)
      expect(tourWithoutReturn).toHaveLength(5)
    })

    it('should preserve node properties', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0, name: 'Node A' },
          { id: 2, x: 1, y: 0, name: 'Node B' },
          { id: 3, x: 1, y: 1, name: 'Node C' },
        ],
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      const pathWithNames = result.path.filter((n) => 'name' in n)
      expect(pathWithNames.length).toBe(result.path.length)
    })
  })

  describe('Tour improvement', () => {
    it('should improve upon a deliberately bad initial configuration', () => {
      // Create nodes in a circle but in scrambled order
      // The nearest neighbor heuristic + k-opt should find a good tour
      const n = 8
      const nodes = []
      for (let i = 0; i < n; i++) {
        nodes.push({
          id: i + 1,
          x: Math.cos((2 * Math.PI * i) / n) * 100,
          y: Math.sin((2 * Math.PI * i) / n) * 100,
        })
      }

      // Shuffle nodes to ensure they're not in optimal order
      const shuffled = [...nodes].sort(() => Math.random() - 0.5)

      const graph: Graph = {
        nodes: shuffled,
        edges: [],
      }

      const result = koptAlgorithm.solve(graph)

      const optimalDistance = 2 * n * Math.sin(Math.PI / n) * 100

      expect(result.performance.distance).toBeLessThan(optimalDistance * 1.1)
    })
  })

  describe('Determinism', () => {
    it('should produce consistent results for the same input', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 10, y: 0 },
          { id: 3, x: 10, y: 10 },
          { id: 4, x: 0, y: 10 },
          { id: 5, x: 5, y: 5 },
        ],
        edges: [],
      }

      const result1 = koptAlgorithm.solve(graph, { k: 2 })
      const result2 = koptAlgorithm.solve(graph, { k: 2 })

      expect(result1.performance.distance).toBeCloseTo(result2.performance.distance, 10)
      expect(result1.path.length).toBe(result2.path.length)
    })
  })
})

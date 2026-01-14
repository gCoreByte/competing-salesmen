import { describe, it, expect } from 'vitest'
import nearestNeighbourAlgorithm from '../nearest-neighbour'
import type { Graph } from '../../types/tsp'

describe('Nearest Neighbour Algorithm', () => {
  describe('Basic properties', () => {
    it('should have the correct name', () => {
      expect(nearestNeighbourAlgorithm.name).toBe('Nearest Neighbour')
    })

    it('should not have configOptions', () => {
      expect(nearestNeighbourAlgorithm.configOptions).toBeUndefined()
    })

    it('should return a result with path and performance', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
        ],
        edges: [],
      }

      const result = nearestNeighbourAlgorithm.solve(graph)

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

      const result = nearestNeighbourAlgorithm.solve(graph)

      expect(result.path).toHaveLength(0)
      expect(result.performance.distance).toBe(0)
    })

    it('should handle single node', () => {
      const graph: Graph = {
        nodes: [{ id: 1, x: 10, y: 20 }],
        edges: [],
      }

      const result = nearestNeighbourAlgorithm.solve(graph)

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

      const result = nearestNeighbourAlgorithm.solve(graph)

      expect(result.path).toHaveLength(3)
      expect(result.performance.distance).toBeCloseTo(10, 5)
    })
  })

  describe('Nearest neighbour behavior', () => {
    it('should visit nearest unvisited node', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 10, y: 0 },
          { id: 3, x: 1, y: 0 },
        ],
        edges: [],
      }

      const result = nearestNeighbourAlgorithm.solve(graph)

      // Starting from node 1, nearest is node 3, then node 2
      expect(result.path[0]?.id).toBe(1)
      expect(result.path[1]?.id).toBe(3)
      expect(result.path[2]?.id).toBe(2)
    })

    it('should produce a valid tour visiting all nodes', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 2, y: 0 },
          { id: 4, x: 3, y: 0 },
        ],
        edges: [],
      }

      const result = nearestNeighbourAlgorithm.solve(graph)

      // Path should be n+1 (tour + return)
      expect(result.path).toHaveLength(5)

      // All nodes visited once (excluding return)
      const visitedIds = new Set(result.path.slice(0, -1).map((n) => n.id))
      expect(visitedIds.size).toBe(4)
    })

    it('should return to start node', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = nearestNeighbourAlgorithm.solve(graph)

      expect(result.path[0]?.id).toBe(result.path[result.path.length - 1]?.id)
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

      const result = nearestNeighbourAlgorithm.solve(graph)

      expect(result.performance.runtime).toBeGreaterThanOrEqual(0)
      expect(typeof result.performance.runtime).toBe('number')
    })

    it('should track reads', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = nearestNeighbourAlgorithm.solve(graph)

      expect(result.performance.reads).toBeGreaterThan(0)
      expect(typeof result.performance.reads).toBe('number')
    })

    it('should track writes', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = nearestNeighbourAlgorithm.solve(graph)

      expect(result.performance.writes).toBeGreaterThanOrEqual(0)
      expect(typeof result.performance.writes).toBe('number')
    })
  })

  describe('Distance calculation', () => {
    it('should calculate correct distance for a line', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 2, y: 0 },
        ],
        edges: [],
      }

      const result = nearestNeighbourAlgorithm.solve(graph)

      // Tour: 1 -> 2 -> 3 -> 1 = 1 + 1 + 2 = 4
      expect(result.performance.distance).toBeCloseTo(4, 5)
    })

    it('should calculate correct distance for a square', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
          { id: 4, x: 0, y: 1 },
        ],
        edges: [],
      }

      const result = nearestNeighbourAlgorithm.solve(graph)

      // Nearest neighbour should find the perimeter: 4
      expect(result.performance.distance).toBeCloseTo(4, 5)
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

      const result1 = nearestNeighbourAlgorithm.solve(graph)
      const result2 = nearestNeighbourAlgorithm.solve(graph)

      expect(result1.performance.distance).toBeCloseTo(result2.performance.distance, 10)
      expect(result1.path.length).toBe(result2.path.length)
    })
  })
})

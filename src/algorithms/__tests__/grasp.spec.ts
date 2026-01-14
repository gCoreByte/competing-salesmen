import { describe, it, expect } from 'vitest'
import grasp from '../grasp'
import type { Graph } from '../../types/tsp'

describe('GRASP Algorithm', () => {
  describe('Basic properties', () => {
    it('should have the correct name', () => {
      expect(grasp.name).toBe('GRASP')
    })

    it('should have configOptions', () => {
      expect(grasp.configOptions).toBeDefined()
      expect(grasp.configOptions).toHaveLength(3)
    })

    it('should have alpha config option', () => {
      const alphaOption = grasp.configOptions?.find((opt) => opt.key === 'alpha')
      expect(alphaOption).toBeDefined()
      expect(alphaOption?.type).toBe('number')
      expect(alphaOption?.default).toBe(0.3)
      expect(alphaOption?.min).toBe(0)
      expect(alphaOption?.max).toBe(1)
    })

    it('should have iterations config option', () => {
      const iterationsOption = grasp.configOptions?.find((opt) => opt.key === 'iterations')
      expect(iterationsOption).toBeDefined()
      expect(iterationsOption?.type).toBe('number')
      expect(iterationsOption?.default).toBe(100)
      expect(iterationsOption?.min).toBe(10)
      expect(iterationsOption?.max).toBe(1000)
    })

    it('should have localSearchMaxIterations config option', () => {
      const lsOption = grasp.configOptions?.find((opt) => opt.key === 'localSearchMaxIterations')
      expect(lsOption).toBeDefined()
      expect(lsOption?.type).toBe('number')
      expect(lsOption?.default).toBe(1000)
      expect(lsOption?.min).toBe(100)
      expect(lsOption?.max).toBe(10000)
    })

    it('should return a result with path and performance', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
        ],
        edges: [],
      }

      const result = grasp.solve(graph)

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

      const result = grasp.solve(graph)

      expect(result.path).toHaveLength(0)
      expect(result.performance.distance).toBe(0)
    })

    it('should handle single node', () => {
      const graph: Graph = {
        nodes: [{ id: 1, x: 10, y: 20 }],
        edges: [],
      }

      const result = grasp.solve(graph)

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

      const result = grasp.solve(graph)

      expect(result.path).toHaveLength(3)
      expect(result.performance.distance).toBeCloseTo(10, 5)
    })
  })

  describe('Tour validity', () => {
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

      const result = grasp.solve(graph, { iterations: 10 })

      expect(result.path).toHaveLength(5)
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

      const result = grasp.solve(graph, { iterations: 10 })

      expect(result.path[0]?.id).toBe(result.path[result.path.length - 1]?.id)
    })

    it('should visit each node exactly once (excluding return)', () => {
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

      const result = grasp.solve(graph, { iterations: 10 })

      const pathWithoutReturn = result.path.slice(0, -1)
      const uniqueIds = new Set(pathWithoutReturn.map((n) => n.id))
      expect(uniqueIds.size).toBe(5)
      expect(pathWithoutReturn.length).toBe(5)
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

      const result = grasp.solve(graph, { iterations: 10 })

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

      const result = grasp.solve(graph, { iterations: 10 })

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

      const result = grasp.solve(graph, { iterations: 10 })

      expect(result.performance.writes).toBeGreaterThanOrEqual(0)
      expect(typeof result.performance.writes).toBe('number')
    })
  })

  describe('Solution quality', () => {
    it('should find optimal tour for a square', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
          { id: 4, x: 0, y: 1 },
        ],
        edges: [],
      }

      const result = grasp.solve(graph, { iterations: 50, alpha: 0.3 })

      expect(result.performance.distance).toBeCloseTo(4, 5)
    })

    it('should find near-optimal tour for a line', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 2, y: 0 },
        ],
        edges: [],
      }

      const result = grasp.solve(graph, { iterations: 50 })

      expect(result.performance.distance).toBeCloseTo(4, 5)
    })
  })

  describe('Configuration effects', () => {
    it('should accept custom alpha value', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 2, y: 0 },
          { id: 4, x: 3, y: 0 },
        ],
        edges: [],
      }

      expect(() => grasp.solve(graph, { alpha: 0, iterations: 10 })).not.toThrow()
      expect(() => grasp.solve(graph, { alpha: 0.5, iterations: 10 })).not.toThrow()
      expect(() => grasp.solve(graph, { alpha: 1, iterations: 10 })).not.toThrow()
    })

    it('should accept custom iterations value', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 2, y: 0 },
        ],
        edges: [],
      }

      expect(() => grasp.solve(graph, { iterations: 10 })).not.toThrow()
      expect(() => grasp.solve(graph, { iterations: 50 })).not.toThrow()
    })

    it('should accept custom localSearchMaxIterations value', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 2, y: 0 },
        ],
        edges: [],
      }

      expect(() =>
        grasp.solve(graph, { iterations: 10, localSearchMaxIterations: 100 }),
      ).not.toThrow()
    })

    it('alpha=0 should produce more consistent (greedy) results', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 2, y: 0 },
          { id: 4, x: 3, y: 0 },
        ],
        edges: [],
      }

      const results = Array.from({ length: 5 }, () =>
        grasp.solve(graph, { alpha: 0, iterations: 1 }),
      )

      const distances = results.map((r) => r.performance.distance)
      const maxDiff = Math.max(...distances) - Math.min(...distances)
      expect(maxDiff).toBeLessThan(1)
    })

    it('more iterations should generally not produce worse results', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 5, y: 0 },
          { id: 3, x: 10, y: 5 },
          { id: 4, x: 5, y: 10 },
          { id: 5, x: 0, y: 5 },
        ],
        edges: [],
      }

      const fewIterResults = Array.from({ length: 3 }, () =>
        grasp.solve(graph, { iterations: 10, alpha: 0.3 }),
      )
      const manyIterResults = Array.from({ length: 3 }, () =>
        grasp.solve(graph, { iterations: 100, alpha: 0.3 }),
      )

      const avgFew =
        fewIterResults.reduce((sum, r) => sum + r.performance.distance, 0) /
        fewIterResults.length
      const avgMany =
        manyIterResults.reduce((sum, r) => sum + r.performance.distance, 0) /
        manyIterResults.length

      expect(avgMany).toBeLessThanOrEqual(avgFew + 0.1) // Small tolerance for randomness
    })
  })

  describe('GRASP-specific behavior', () => {
    it('should improve initial construction with local search', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 10, y: 0 },
          { id: 3, x: 10, y: 10 },
          { id: 4, x: 0, y: 10 },
        ],
        edges: [],
      }

      const result = grasp.solve(graph, {
        alpha: 1, // fully random construction
        iterations: 50,
        localSearchMaxIterations: 100,
      })

      expect(result.performance.distance).toBeCloseTo(40, 1)
    })

    it('should handle larger graphs', () => {
      const nodes = []
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          nodes.push({ id: i * 4 + j + 1, x: i * 10, y: j * 10 })
        }
      }

      const graph: Graph = { nodes, edges: [] }

      const result = grasp.solve(graph, { iterations: 20, alpha: 0.3 })

      expect(result.path).toHaveLength(17)
      expect(result.performance.distance).toBeGreaterThan(0)
    })
  })
})

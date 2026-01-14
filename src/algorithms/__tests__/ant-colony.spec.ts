import { describe, it, expect } from 'vitest'
import antColonyAlgorithm from '../ant-colony'
import type { Graph } from '../../types/tsp'

describe('Ant Colony Algorithm', () => {
  describe('Basic properties', () => {
    it('should have the correct name', () => {
      expect(antColonyAlgorithm.name).toBe('Ant Colony')
    })

    it('should have configOptions', () => {
      expect(antColonyAlgorithm.configOptions).toBeDefined()
      expect(antColonyAlgorithm.configOptions!.length).toBe(6)
    })

    it('should have antCount config option', () => {
      const option = antColonyAlgorithm.configOptions!.find((o) => o.key === 'antCount')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(20)
      expect(option!.min).toBe(5)
      expect(option!.max).toBe(100)
    })

    it('should have iterations config option', () => {
      const option = antColonyAlgorithm.configOptions!.find((o) => o.key === 'iterations')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(100)
      expect(option!.min).toBe(10)
      expect(option!.max).toBe(500)
    })

    it('should have alpha config option', () => {
      const option = antColonyAlgorithm.configOptions!.find((o) => o.key === 'alpha')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(1.0)
    })

    it('should have beta config option', () => {
      const option = antColonyAlgorithm.configOptions!.find((o) => o.key === 'beta')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(2.0)
    })

    it('should have evaporationRate config option', () => {
      const option = antColonyAlgorithm.configOptions!.find((o) => o.key === 'evaporationRate')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(0.5)
    })

    it('should have Q config option', () => {
      const option = antColonyAlgorithm.configOptions!.find((o) => o.key === 'Q')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(100)
    })

    it('should return a result with path and performance', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph)

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

      const result = antColonyAlgorithm.solve(graph)

      expect(result.path).toHaveLength(0)
      expect(result.performance.distance).toBe(0)
    })

    it('should handle single node', () => {
      const graph: Graph = {
        nodes: [{ id: 1, x: 10, y: 20 }],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph)

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

      const result = antColonyAlgorithm.solve(graph)

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

      const result = antColonyAlgorithm.solve(graph, { antCount: 10, iterations: 10 })

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

      const result = antColonyAlgorithm.solve(graph, { antCount: 10, iterations: 10 })

      expect(result.path[0]?.id).toBe(result.path[result.path.length - 1]?.id)
    })

    it('should visit each node exactly once (excluding return)', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 5, y: 0 },
          { id: 3, x: 5, y: 5 },
          { id: 4, x: 0, y: 5 },
          { id: 5, x: 2.5, y: 2.5 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph, { antCount: 10, iterations: 10 })

      // Path length = n + 1 (includes return to start)
      expect(result.path).toHaveLength(6)

      // Verify all nodes are unique in the tour (excluding return)
      const tourWithoutReturn = result.path.slice(0, -1)
      const ids = tourWithoutReturn.map((n) => n.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(5)
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

      const result = antColonyAlgorithm.solve(graph, { antCount: 5, iterations: 5 })

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

      const result = antColonyAlgorithm.solve(graph, { antCount: 5, iterations: 5 })

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

      const result = antColonyAlgorithm.solve(graph, { antCount: 5, iterations: 5 })

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

      const result = antColonyAlgorithm.solve(graph, { antCount: 20, iterations: 50 })

      // Optimal tour: 1 -> 2 -> 3 -> 1 = 1 + 1 + 2 = 4
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

      const result = antColonyAlgorithm.solve(graph, { antCount: 20, iterations: 50 })

      // Optimal tour is the perimeter: 4
      expect(result.performance.distance).toBeCloseTo(4, 5)
    })
  })

  describe('Configuration', () => {
    it('should work with custom ant count', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph, { antCount: 50 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom iterations', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph, { iterations: 200 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom alpha', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph, { alpha: 2.0 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom beta', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph, { beta: 5.0 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom evaporation rate', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph, { evaporationRate: 0.3 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom Q value', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph, { Q: 500 })

      expect(result.path).toHaveLength(4)
    })
  })

  describe('Operations scaling', () => {
    it('should have reads/writes scale with iterations', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
          { id: 4, x: 0, y: 1 },
        ],
        edges: [],
      }

      const result10 = antColonyAlgorithm.solve(graph, { antCount: 10, iterations: 10 })
      const result50 = antColonyAlgorithm.solve(graph, { antCount: 10, iterations: 50 })

      // More iterations should mean more reads and writes
      expect(result50.performance.reads).toBeGreaterThan(result10.performance.reads)
      expect(result50.performance.writes).toBeGreaterThan(result10.performance.writes)
    })

    it('should have reads/writes scale with ant count', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
          { id: 4, x: 0, y: 1 },
        ],
        edges: [],
      }

      const resultSmall = antColonyAlgorithm.solve(graph, { antCount: 5, iterations: 10 })
      const resultLarge = antColonyAlgorithm.solve(graph, { antCount: 30, iterations: 10 })

      // More ants should mean more reads and writes
      expect(resultLarge.performance.reads).toBeGreaterThan(resultSmall.performance.reads)
      expect(resultLarge.performance.writes).toBeGreaterThan(resultSmall.performance.writes)
    })
  })

  describe('Quality', () => {
    it('should find a reasonably good solution for larger graphs', () => {
      // Create a 3x3 grid of nodes
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 2, y: 0 },
          { id: 4, x: 0, y: 1 },
          { id: 5, x: 1, y: 1 },
          { id: 6, x: 2, y: 1 },
          { id: 7, x: 0, y: 2 },
          { id: 8, x: 1, y: 2 },
          { id: 9, x: 2, y: 2 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph, {
        antCount: 30,
        iterations: 100,
        alpha: 1.0,
        beta: 2.0,
        evaporationRate: 0.5,
        Q: 100,
      })

      // The optimal tour for a 3x3 grid is 8 (perimeter path)
      // We should at least find something within 20% of optimal
      expect(result.performance.distance).toBeLessThan(10)
    })

    it('should improve with more iterations', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 3, y: 0 },
          { id: 3, x: 6, y: 0 },
          { id: 4, x: 6, y: 3 },
          { id: 5, x: 3, y: 3 },
          { id: 6, x: 0, y: 3 },
        ],
        edges: [],
      }

      // Run multiple times and get average for low iterations
      let lowIterSum = 0
      let highIterSum = 0
      const runs = 5

      for (let i = 0; i < runs; i++) {
        const resultLow = antColonyAlgorithm.solve(graph, { antCount: 10, iterations: 5 })
        const resultHigh = antColonyAlgorithm.solve(graph, { antCount: 10, iterations: 100 })
        lowIterSum += resultLow.performance.distance
        highIterSum += resultHigh.performance.distance
      }

      // On average, more iterations should find equal or better solutions
      expect(highIterSum / runs).toBeLessThanOrEqual(lowIterSum / runs + 1) // Allow small margin
    })
  })

  describe('Pheromone behavior', () => {
    it('should produce consistent valid tours across multiple runs', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 0.5, y: 1 },
        ],
        edges: [],
      }

      // Run 5 times, all should produce valid tours
      for (let i = 0; i < 5; i++) {
        const result = antColonyAlgorithm.solve(graph, { antCount: 10, iterations: 20 })

        expect(result.path).toHaveLength(4)
        const visitedIds = new Set(result.path.slice(0, -1).map((n) => n.id))
        expect(visitedIds.size).toBe(3)
        expect(result.path[0]?.id).toBe(result.path[result.path.length - 1]?.id)
      }
    })

    it('should handle high alpha (pheromone-dominated)', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
          { id: 4, x: 0, y: 1 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph, { alpha: 5.0, beta: 0.5, iterations: 50 })

      expect(result.path).toHaveLength(5)
    })

    it('should handle high beta (distance-dominated)', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
          { id: 4, x: 0, y: 1 },
        ],
        edges: [],
      }

      const result = antColonyAlgorithm.solve(graph, { alpha: 0.5, beta: 5.0, iterations: 50 })

      expect(result.path).toHaveLength(5)
      // With high beta, should find optimal perimeter tour
      expect(result.performance.distance).toBeCloseTo(4, 1)
    })
  })
})

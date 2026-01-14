import { describe, it, expect } from 'vitest'
import simulatedAnnealing from '../simulated-annealing'
import type { Graph } from '../../types/tsp'

describe('Simulated Annealing', () => {
  describe('Basic properties', () => {
    it('should have the correct name', () => {
      expect(simulatedAnnealing.name).toBe('Simulated Annealing')
    })

    it('should have configOptions', () => {
      expect(simulatedAnnealing.configOptions).toBeDefined()
      expect(simulatedAnnealing.configOptions!.length).toBe(4)
    })

    it('should have initialTemperature config option', () => {
      const option = simulatedAnnealing.configOptions!.find((o) => o.key === 'initialTemperature')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(10000)
      expect(option!.min).toBe(100)
      expect(option!.max).toBe(100000)
    })

    it('should have coolingRate config option', () => {
      const option = simulatedAnnealing.configOptions!.find((o) => o.key === 'coolingRate')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(0.995)
      expect(option!.min).toBe(0.9)
      expect(option!.max).toBe(0.9999)
    })

    it('should have minTemperature config option', () => {
      const option = simulatedAnnealing.configOptions!.find((o) => o.key === 'minTemperature')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(0.1)
      expect(option!.min).toBe(0.001)
      expect(option!.max).toBe(10)
    })

    it('should have maxIterations config option', () => {
      const option = simulatedAnnealing.configOptions!.find((o) => o.key === 'maxIterations')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(100000)
      expect(option!.min).toBe(1000)
      expect(option!.max).toBe(1000000)
    })

    it('should return a result with path and performance', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
        ],
        edges: [],
      }

      const result = simulatedAnnealing.solve(graph)

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

      const result = simulatedAnnealing.solve(graph)

      expect(result.path).toHaveLength(0)
      expect(result.performance.distance).toBe(0)
    })

    it('should handle single node', () => {
      const graph: Graph = {
        nodes: [{ id: 1, x: 10, y: 20 }],
        edges: [],
      }

      const result = simulatedAnnealing.solve(graph)

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

      const result = simulatedAnnealing.solve(graph)

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

      const result = simulatedAnnealing.solve(graph, { maxIterations: 1000 })

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

      const result = simulatedAnnealing.solve(graph, { maxIterations: 1000 })

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

      const result = simulatedAnnealing.solve(graph, { maxIterations: 1000 })

      expect(result.path).toHaveLength(6)

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

      const result = simulatedAnnealing.solve(graph, { maxIterations: 1000 })

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

      const result = simulatedAnnealing.solve(graph, { maxIterations: 1000 })

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

      const result = simulatedAnnealing.solve(graph, { maxIterations: 1000 })

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

      const result = simulatedAnnealing.solve(graph, {
        initialTemperature: 10000,
        coolingRate: 0.99,
        maxIterations: 10000,
      })

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

      const result = simulatedAnnealing.solve(graph, {
        initialTemperature: 10000,
        coolingRate: 0.99,
        maxIterations: 10000,
      })

      expect(result.performance.distance).toBeCloseTo(4, 5)
    })
  })

  describe('Configuration', () => {
    it('should work with custom initial temperature', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = simulatedAnnealing.solve(graph, { initialTemperature: 50000 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom cooling rate', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = simulatedAnnealing.solve(graph, { coolingRate: 0.99 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom min temperature', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = simulatedAnnealing.solve(graph, { minTemperature: 1 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom max iterations', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = simulatedAnnealing.solve(graph, { maxIterations: 5000 })

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

      const resultSmall = simulatedAnnealing.solve(graph, {
        initialTemperature: 1000,
        coolingRate: 0.9,
        maxIterations: 100,
      })
      const resultLarge = simulatedAnnealing.solve(graph, {
        initialTemperature: 1000,
        coolingRate: 0.9,
        maxIterations: 1000,
      })

      expect(resultLarge.performance.reads).toBeGreaterThan(resultSmall.performance.reads)
    })
  })

  describe('Quality', () => {
    it('should find a reasonably good solution for larger graphs', () => {
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

      const result = simulatedAnnealing.solve(graph, {
        initialTemperature: 10000,
        coolingRate: 0.995,
        minTemperature: 0.01,
        maxIterations: 50000,
      })

      expect(result.performance.distance).toBeLessThan(10)
    })

    it('should improve solution quality with more iterations', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 3, y: 1 },
          { id: 3, x: 6, y: 0 },
          { id: 4, x: 7, y: 3 },
          { id: 5, x: 6, y: 6 },
          { id: 6, x: 3, y: 5 },
          { id: 7, x: 0, y: 6 },
          { id: 8, x: -1, y: 3 },
        ],
        edges: [],
      }

      let bestSmall = Infinity
      let bestLarge = Infinity

      for (let i = 0; i < 5; i++) {
        const resultSmall = simulatedAnnealing.solve(graph, {
          initialTemperature: 100,
          coolingRate: 0.9,
          maxIterations: 100,
        })
        const resultLarge = simulatedAnnealing.solve(graph, {
          initialTemperature: 10000,
          coolingRate: 0.995,
          maxIterations: 50000,
        })

        bestSmall = Math.min(bestSmall, resultSmall.performance.distance)
        bestLarge = Math.min(bestLarge, resultLarge.performance.distance)
      }

      expect(bestLarge).toBeLessThanOrEqual(bestSmall * 1.1) // Allow 10% tolerance
    })
  })
})

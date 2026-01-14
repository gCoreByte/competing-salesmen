import { describe, it, expect } from 'vitest'
import geneticAlgorithm from '../genetic'
import type { Graph } from '../../types/tsp'

describe('Genetic Algorithm', () => {
  describe('Basic properties', () => {
    it('should have the correct name', () => {
      expect(geneticAlgorithm.name).toBe('Genetic Algorithm')
    })

    it('should have configOptions', () => {
      expect(geneticAlgorithm.configOptions).toBeDefined()
      expect(geneticAlgorithm.configOptions!.length).toBe(5)
    })

    it('should have populationSize config option', () => {
      const option = geneticAlgorithm.configOptions!.find((o) => o.key === 'populationSize')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(50)
      expect(option!.min).toBe(10)
      expect(option!.max).toBe(200)
    })

    it('should have generations config option', () => {
      const option = geneticAlgorithm.configOptions!.find((o) => o.key === 'generations')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(100)
      expect(option!.min).toBe(10)
      expect(option!.max).toBe(1000)
    })

    it('should have mutationRate config option', () => {
      const option = geneticAlgorithm.configOptions!.find((o) => o.key === 'mutationRate')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(0.1)
    })

    it('should have crossoverRate config option', () => {
      const option = geneticAlgorithm.configOptions!.find((o) => o.key === 'crossoverRate')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(0.8)
    })

    it('should have eliteCount config option', () => {
      const option = geneticAlgorithm.configOptions!.find((o) => o.key === 'eliteCount')
      expect(option).toBeDefined()
      expect(option!.type).toBe('number')
      expect(option!.default).toBe(2)
    })

    it('should return a result with path and performance', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
        ],
        edges: [],
      }

      const result = geneticAlgorithm.solve(graph)

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

      const result = geneticAlgorithm.solve(graph)

      expect(result.path).toHaveLength(0)
      expect(result.performance.distance).toBe(0)
    })

    it('should handle single node', () => {
      const graph: Graph = {
        nodes: [{ id: 1, x: 10, y: 20 }],
        edges: [],
      }

      const result = geneticAlgorithm.solve(graph)

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

      const result = geneticAlgorithm.solve(graph)

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

      const result = geneticAlgorithm.solve(graph, { populationSize: 20, generations: 10 })

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

      const result = geneticAlgorithm.solve(graph, { populationSize: 20, generations: 10 })

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

      const result = geneticAlgorithm.solve(graph, { populationSize: 20, generations: 10 })

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

      const result = geneticAlgorithm.solve(graph, { populationSize: 10, generations: 5 })

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

      const result = geneticAlgorithm.solve(graph, { populationSize: 10, generations: 5 })

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

      const result = geneticAlgorithm.solve(graph, { populationSize: 10, generations: 5 })

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

      const result = geneticAlgorithm.solve(graph, { populationSize: 50, generations: 50 })

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

      const result = geneticAlgorithm.solve(graph, { populationSize: 50, generations: 50 })

      // Optimal tour is the perimeter: 4
      expect(result.performance.distance).toBeCloseTo(4, 5)
    })
  })

  describe('Configuration', () => {
    it('should work with custom population size', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = geneticAlgorithm.solve(graph, { populationSize: 100 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom generations', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = geneticAlgorithm.solve(graph, { generations: 200 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom mutation rate', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = geneticAlgorithm.solve(graph, { mutationRate: 0.3 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom crossover rate', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = geneticAlgorithm.solve(graph, { crossoverRate: 0.6 })

      expect(result.path).toHaveLength(4)
    })

    it('should work with custom elite count', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      const result = geneticAlgorithm.solve(graph, { eliteCount: 5 })

      expect(result.path).toHaveLength(4)
    })

    it('should handle elite count larger than population', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
        ],
        edges: [],
      }

      // elite count = 100, population = 20
      const result = geneticAlgorithm.solve(graph, { populationSize: 20, eliteCount: 100 })

      expect(result.path).toHaveLength(4)
    })
  })

  describe('Operations scaling', () => {
    it('should have reads/writes scale with generations', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
          { id: 4, x: 0, y: 1 },
        ],
        edges: [],
      }

      const result10 = geneticAlgorithm.solve(graph, { populationSize: 20, generations: 10 })
      const result50 = geneticAlgorithm.solve(graph, { populationSize: 20, generations: 50 })

      // More generations should mean more reads and writes
      expect(result50.performance.reads).toBeGreaterThan(result10.performance.reads)
      expect(result50.performance.writes).toBeGreaterThan(result10.performance.writes)
    })

    it('should have reads/writes scale with population size', () => {
      const graph: Graph = {
        nodes: [
          { id: 1, x: 0, y: 0 },
          { id: 2, x: 1, y: 0 },
          { id: 3, x: 1, y: 1 },
          { id: 4, x: 0, y: 1 },
        ],
        edges: [],
      }

      const resultSmall = geneticAlgorithm.solve(graph, { populationSize: 10, generations: 10 })
      const resultLarge = geneticAlgorithm.solve(graph, { populationSize: 50, generations: 10 })

      // Larger population should mean more reads and writes
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

      const result = geneticAlgorithm.solve(graph, {
        populationSize: 50,
        generations: 100,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        eliteCount: 2,
      })

      // The optimal tour for a 3x3 grid is 8 (perimeter path)
      // We should at least find something within 20% of optimal
      expect(result.performance.distance).toBeLessThan(10)
    })
  })
})

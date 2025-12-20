import { describe, it, expect } from 'vitest'
import naiveAlgorithm from '../naive'
import type { Graph } from '../../types/tsp'

// FIXME: placeholder tests
describe('Naive Algorithm', () => {
  it('should have the correct name', () => {
    expect(naiveAlgorithm.name).toBe('Naive')
  })

  it('should return a result with path and performance', () => {
    const graph: Graph = {
      nodes: [
        { id: 1, x: 0, y: 0 },
        { id: 2, x: 1, y: 0 },
      ],
      edges: [],
    }

    const result = naiveAlgorithm.solve(graph)

    expect(result).toHaveProperty('path')
    expect(result).toHaveProperty('performance')
    expect(result.performance).toHaveProperty('distance')
    expect(result.performance).toHaveProperty('runtime')
    expect(result.performance).toHaveProperty('reads')
    expect(result.performance).toHaveProperty('writes')
  })

  it('should return nodes in original order', () => {
    const graph: Graph = {
      nodes: [
        { id: 1, x: 0, y: 0 },
        { id: 2, x: 1, y: 0 },
        { id: 3, x: 1, y: 1 },
      ],
      edges: [],
    }

    const result = naiveAlgorithm.solve(graph)

    expect(result.path).toHaveLength(3)
    expect(result.path[0]?.id).toBe(1)
    expect(result.path[1]?.id).toBe(2)
    expect(result.path[2]?.id).toBe(3)
  })

  it('should calculate total distance correctly', () => {
    const graph: Graph = {
      nodes: [
        { id: 1, x: 0, y: 0 },
        { id: 2, x: 1, y: 0 },
        { id: 3, x: 1, y: 1 },
        { id: 4, x: 0, y: 1 },
      ],
      edges: [],
    }

    const result = naiveAlgorithm.solve(graph)

    expect(result.performance.distance).toBeCloseTo(4, 5)
  })

  it('should handle empty graph', () => {
    const graph: Graph = {
      nodes: [],
      edges: [],
    }

    const result = naiveAlgorithm.solve(graph)

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

    const result = naiveAlgorithm.solve(graph)

    expect(result.path).toHaveLength(1)
    expect(result.path[0]?.id).toBe(1)
    expect(result.performance.distance).toBe(0)
  })

  it('should calculate distance for two nodes', () => {
    const graph: Graph = {
      nodes: [
        { id: 1, x: 0, y: 0 },
        { id: 2, x: 3, y: 4 },
      ],
      edges: [],
    }

    const result = naiveAlgorithm.solve(graph)

    expect(result.performance.distance).toBeCloseTo(10, 5)
  })

  it('should track runtime', () => {
    const graph: Graph = {
      nodes: [
        { id: 1, x: 0, y: 0 },
        { id: 2, x: 1, y: 0 },
      ],
      edges: [],
    }

    const result = naiveAlgorithm.solve(graph)

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

    const result = naiveAlgorithm.solve(graph)

    expect(result.performance.reads).toBeGreaterThan(0)
    expect(result.performance.writes).toBeGreaterThan(0)
    expect(typeof result.performance.reads).toBe('number')
    expect(typeof result.performance.writes).toBe('number')
  })

  it('should handle nodes with different coordinates', () => {
    const graph: Graph = {
      nodes: [
        { id: 1, x: 10, y: 20 },
        { id: 2, x: 30, y: 40 },
        { id: 3, x: 50, y: 60 },
      ],
      edges: [],
    }

    const result = naiveAlgorithm.solve(graph)

    expect(result.path).toHaveLength(3)
    expect(result.performance.distance).toBeGreaterThan(0)
  })

  it('should preserve node properties', () => {
    const graph: Graph = {
      nodes: [
        { id: 1, x: 0, y: 0, name: 'Node 1' },
        { id: 2, x: 1, y: 0, name: 'Node 2' },
      ],
      edges: [],
    }

    const result = naiveAlgorithm.solve(graph)

    expect(result.path[0]).toHaveProperty('name', 'Node 1')
    expect(result.path[1]).toHaveProperty('name', 'Node 2')
  })

  it('should handle large graphs', () => {
    const nodes = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      x: i * 10,
      y: i * 10,
    }))

    const graph: Graph = {
      nodes,
      edges: [],
    }

    const result = naiveAlgorithm.solve(graph)

    expect(result.path).toHaveLength(100)
    expect(result.performance.distance).toBeGreaterThan(0)
    expect(result.performance.runtime).toBeGreaterThan(0)
  })

  it('should calculate correct distance for a triangle', () => {
    // Equilateral triangle with side length 1
    const graph: Graph = {
      nodes: [
        { id: 1, x: 0, y: 0 },
        { id: 2, x: 1, y: 0 },
        { id: 3, x: 0.5, y: Math.sqrt(3) / 2 },
      ],
      edges: [],
    }

    const result = naiveAlgorithm.solve(graph)

    // Should be approximately 3 (three sides of length 1)
    expect(result.performance.distance).toBeCloseTo(3, 5)
  })
})

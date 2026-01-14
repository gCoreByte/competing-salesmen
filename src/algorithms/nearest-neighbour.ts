import type { Algorithm, Graph, Performance, Result } from '../types/tsp'
import { type OperationCounter, nearestNeighborTour, tourDistance } from './utils'

const nearestNeighbourAlgorithm: Algorithm = {
  name: 'Nearest Neighbour',
  solve: (graph: Graph): Result => {
    const startTime = performance.now()

    const nodes = graph.nodes
    const n = nodes.length
    const counter: OperationCounter = { reads: 0, writes: 0 }

    if (n === 0) {
      return {
        path: [],
        performance: {
          distance: 0,
          runtime: 0,
          reads: 0,
          writes: 0,
        },
      }
    }

    if (n === 1) {
      counter.reads += 1
      return {
        path: [nodes[0]!],
        performance: {
          distance: 0,
          runtime: performance.now() - startTime,
          reads: counter.reads,
          writes: counter.writes,
        },
      }
    }

    const tour = nearestNeighborTour(nodes, counter)
    const finalDistance = tourDistance(tour, counter)
    const endTime = performance.now()
    const runtime = endTime - startTime

    counter.reads += tour.length
    counter.writes += tour.length + 1
    const displayPath = [...tour, tour[0]!]

    const performanceMetrics: Performance = {
      distance: finalDistance,
      runtime,
      reads: counter.reads,
      writes: counter.writes,
    }

    return {
      path: displayPath,
      performance: performanceMetrics,
    }
  },
}

export default nearestNeighbourAlgorithm

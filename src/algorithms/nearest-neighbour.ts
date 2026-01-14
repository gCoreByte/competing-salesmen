import type { Algorithm, Graph, Performance, Result } from '../types/tsp'
import { TrackedArray } from '../utils/tracked'
import { nearestNeighborTour, tourDistance } from './utils'

const nearestNeighbourAlgorithm: Algorithm = {
  name: 'Nearest Neighbour',
  solve: (graph: Graph): Result => {
    const startTime = performance.now()

    const trackedNodes = new TrackedArray(graph.nodes)
    const nodes = trackedNodes.array
    const n = nodes.length

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
      return {
        path: [nodes[0]!],
        performance: {
          distance: 0,
          runtime: performance.now() - startTime,
          reads: trackedNodes.reads,
          writes: trackedNodes.writes,
        },
      }
    }

    const tour = nearestNeighborTour(nodes)
    const finalDistance = tourDistance(tour)
    const endTime = performance.now()
    const runtime = endTime - startTime

    const displayPath = [...tour, tour[0]!]

    const performanceMetrics: Performance = {
      distance: finalDistance,
      runtime,
      reads: trackedNodes.reads,
      writes: trackedNodes.writes,
    }

    return {
      path: displayPath,
      performance: performanceMetrics,
    }
  },
}

export default nearestNeighbourAlgorithm

import type { Algorithm, Graph, Result, Performance } from '../types/tsp'
import { TrackedArray } from '../utils/tracked'

// placeholder
const naiveAlgorithm: Algorithm = {
  name: 'Naive',
  solve: (graph: Graph): Result => {
    const startTime = performance.now()

    const trackedNodes = new TrackedArray(graph.nodes)
    const nodes = trackedNodes.array

    let totalDistance = 0
    if (nodes.length > 0) {
      for (let i = 0; i < nodes.length; i++) {
        const current = nodes[i]
        const next = nodes[(i + 1) % nodes.length]

        if (current && next) {
          // Calculate Euclidean distance
          const dx = next.x - current.x
          const dy = next.y - current.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          totalDistance += distance
        }
      }
    }

    const endTime = performance.now()
    const runtime = endTime - startTime

    const { reads, writes } = trackedNodes.getCounts()

    const performanceMetrics: Performance = {
      distance: totalDistance,
      runtime,
      reads,
      writes,
    }

    return {
      path: trackedNodes.toArray(),
      performance: performanceMetrics,
    }
  },
}

export default naiveAlgorithm

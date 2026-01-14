import type { Algorithm, Graph, Result, Performance } from '../types/tsp'
import { TrackedArray } from '../utils/tracked'

function permute<T>(arr: T[]): T[][] {
  if (arr.length === 0) return [[]]
  const result: T[][] = []

  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1))
    const permutations = permute(rest)
    for (const perm of permutations) {
      result.push([arr[i]! as T, ...perm])
    }
  }

  return result
}

const naiveAlgorithm: Algorithm = {
  name: 'Naive',
  solve: (graph: Graph, _config?): Result => {
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

    let minDistance = Infinity
    let bestPath: typeof nodes = []

    const permutations = permute(nodes)

    for (const perm of permutations) {
      let totalDistance = 0
      for (let i = 0; i < n; i++) {
        const current = perm[i]
        const next = perm[(i + 1) % n]
        if (current && next) {
          const dx = next.x - current.x
          const dy = next.y - current.y
          totalDistance += Math.sqrt(dx * dx + dy * dy)
        }
      }
      if (totalDistance < minDistance) {
        minDistance = totalDistance
        bestPath = perm
      }
    }

    const endTime = performance.now()
    const runtime = endTime - startTime
    const { reads, writes } = trackedNodes.getCounts()

    const performanceMetrics: Performance = {
      distance: minDistance,
      runtime,
      reads,
      writes,
    }

    if (bestPath.length > 1) {
      bestPath = [...bestPath, bestPath[0]!]
    }

    return {
      path: bestPath,
      performance: performanceMetrics,
    }
  },
}

export default naiveAlgorithm

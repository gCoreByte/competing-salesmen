import type { Algorithm, Graph, Result, Performance, Node } from '../types/tsp'
import { type OperationCounter, distance } from './utils'

function permute(arr: Node[], counter: OperationCounter): Node[][] {
  if (arr.length === 0) return [[]]
  const result: Node[][] = []

  for (let i = 0; i < arr.length; i++) {
    counter.reads += 1
    const rest = arr.slice(0, i).concat(arr.slice(i + 1))
    counter.reads += arr.length - 1
    const permutations = permute(rest, counter)
    for (const perm of permutations) {
      counter.writes += perm.length + 1
      result.push([arr[i]!, ...perm])
    }
  }

  return result
}

const naiveAlgorithm: Algorithm = {
  name: 'Naive',
  solve: (graph: Graph, _config?): Result => {
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

    let minDistance = Infinity
    let bestPath: Node[] = []

    const permutations = permute([...nodes], counter)
    counter.reads += n // Initial copy

    for (const perm of permutations) {
      let totalDistance = 0
      for (let i = 0; i < n; i++) {
        const current = perm[i]
        const next = perm[(i + 1) % n]
        if (current && next) {
          totalDistance += distance(current, next, counter)
        }
      }
      if (totalDistance < minDistance) {
        minDistance = totalDistance
        counter.reads += perm.length
        counter.writes += perm.length
        bestPath = [...perm]
      }
    }

    const endTime = performance.now()
    const runtime = endTime - startTime

    const performanceMetrics: Performance = {
      distance: minDistance,
      runtime,
      reads: counter.reads,
      writes: counter.writes,
    }

    if (bestPath.length > 1) {
      counter.reads += bestPath.length
      counter.writes += bestPath.length + 1
      bestPath = [...bestPath, bestPath[0]!]
    }

    return {
      path: bestPath,
      performance: performanceMetrics,
    }
  },
}

export default naiveAlgorithm

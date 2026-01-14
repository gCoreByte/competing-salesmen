import type { Algorithm, AlgorithmConfig, Graph, Node, Performance, Result } from '../types/tsp'
import { TrackedArray } from '../utils/tracked'

/**
 * Calculate Euclidean distance between two nodes
 */
function distance(a: Node, b: Node): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate total tour distance
 */
function tourDistance(tour: Node[]): number {
  if (tour.length < 2) return 0
  let total = 0
  for (let i = 0; i < tour.length - 1; i++) {
    total += distance(tour[i]!, tour[i + 1]!)
  }
  // Add distance back to start for closed tour
  total += distance(tour[tour.length - 1]!, tour[0]!)
  return total
}

/**
 * Build initial tour using nearest neighbor heuristic
 */
function nearestNeighborTour(nodes: Node[]): Node[] {
  if (nodes.length === 0) return []
  if (nodes.length === 1) return [nodes[0]!]

  const unvisited = new Set(nodes.map((_, i) => i))
  const tour: Node[] = []

  let currentIdx = 0
  tour.push(nodes[currentIdx]!)
  unvisited.delete(currentIdx)

  while (unvisited.size > 0) {
    let nearestIdx = -1
    let nearestDist = Infinity

    for (const idx of unvisited) {
      const dist = distance(nodes[currentIdx]!, nodes[idx]!)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = idx
      }
    }

    if (nearestIdx !== -1) {
      tour.push(nodes[nearestIdx]!)
      unvisited.delete(nearestIdx)
      currentIdx = nearestIdx
    }
  }

  return tour
}

/**
 * 2-opt improvement: reverse segment between positions i and j
 */
function twoOptSwap(tour: Node[], i: number, j: number): Node[] {
  const newTour = tour.slice(0, i)
  for (let k = j; k >= i; k--) {
    newTour.push(tour[k]!)
  }
  for (let k = j + 1; k < tour.length; k++) {
    newTour.push(tour[k]!)
  }
  return newTour
}

function optimize2Opt(tour: Node[]): Node[] {
  if (tour.length < 4) return tour

  let improved = true
  let currentTour = [...tour]
  let bestDistance = tourDistance(currentTour)

  while (improved) {
    improved = false

    for (let i = 0; i < currentTour.length - 1; i++) {
      for (let j = i + 2; j < currentTour.length; j++) {
        if (j === i + 1) continue

        const newTour = twoOptSwap(currentTour, i + 1, j)
        const newDistance = tourDistance(newTour)

        if (newDistance < bestDistance - 1e-10) {
          currentTour = newTour
          bestDistance = newDistance
          improved = true
        }
      }
    }
  }

  return currentTour
}

/**
 * Apply 3-opt optimization until no improvement found
 * 3-opt removes 3 edges and reconnects in all possible ways
 */
function optimize3Opt(tour: Node[]): Node[] {
  if (tour.length < 6) return optimize2Opt(tour)

  let improved = true
  let currentTour = [...tour]
  let bestDistance = tourDistance(currentTour)

  while (improved) {
    improved = false

    for (let i = 0; i < currentTour.length - 4; i++) {
      for (let j = i + 2; j < currentTour.length - 2; j++) {
        for (let k = j + 2; k < currentTour.length; k++) {
          const candidates = generate3OptCandidates(currentTour, i, j, k)

          for (const candidate of candidates) {
            const newDistance = tourDistance(candidate)
            if (newDistance < bestDistance - 1e-10) {
              currentTour = candidate
              bestDistance = newDistance
              improved = true
            }
          }
        }
      }
    }
  }

  return currentTour
}

/**
 * Generate all valid 3-opt reconnections for given break points
 */
function generate3OptCandidates(tour: Node[], i: number, j: number, k: number): Node[][] {
  const candidates: Node[][] = []
  const n = tour.length

  // Segments: A = [0..i], B = [i+1..j], C = [j+1..k], D = [k+1..n-1]
  const A = tour.slice(0, i + 1)
  const B = tour.slice(i + 1, j + 1)
  const C = tour.slice(j + 1, k + 1)
  const D = tour.slice(k + 1, n)

  // 3-opt has 8 possible reconnections, but we skip the original
  candidates.push([...A, ...B.slice().reverse(), ...C, ...D])
  candidates.push([...A, ...B, ...C.slice().reverse(), ...D])
  candidates.push([...A, ...B.slice().reverse(), ...C.slice().reverse(), ...D])
  candidates.push([...A, ...C, ...B, ...D])
  candidates.push([...A, ...C, ...B.slice().reverse(), ...D])
  candidates.push([...A, ...C.slice().reverse(), ...B, ...D])
  candidates.push([...A, ...C.slice().reverse(), ...B.slice().reverse(), ...D])

  return candidates
}

/**
 * Apply general k-opt optimization (for k > 3)
 * Uses iterative improvement with random segment selection
 */
function optimizeKOpt(tour: Node[], k: number): Node[] {
  if (tour.length < 2 * k) {
    // Fall back to 3-opt if tour too small for k-opt
    return optimize3Opt(tour)
  }

  let currentTour = optimize3Opt(tour)
  let bestDistance = tourDistance(currentTour)

  const positions = generateKOptPositions(currentTour.length, k)
  let improved = true

  while (improved) {
    improved = false

    for (const pos of positions) {
      const candidates = generateKOptCandidates(currentTour, pos)

      for (const candidate of candidates) {
        const newDistance = tourDistance(candidate)
        if (newDistance < bestDistance - 1e-10) {
          currentTour = candidate
          bestDistance = newDistance
          improved = true
          break
        }
      }

      if (improved) break
    }
  }

  return currentTour
}

/**
 * Generate valid position combinations for k-opt
 */
function generateKOptPositions(n: number, k: number): number[][] {
  const positions: number[][] = []
  const minGap = 2

  function generate(current: number[], start: number): void {
    if (current.length === k) {
      positions.push([...current])
      return
    }

    const remaining = k - current.length
    const maxStart = n - remaining * minGap

    for (let i = start; i <= maxStart; i++) {
      current.push(i)
      generate(current, i + minGap)
      current.pop()
    }
  }

  generate([], 0)

  if (positions.length > 1000) {
    const sampled: number[][] = []
    const step = Math.floor(positions.length / 1000)
    for (let i = 0; i < positions.length; i += step) {
      sampled.push(positions[i]!)
    }
    return sampled
  }

  return positions
}

/**
 * Generate k-opt candidates for given positions
 */
function generateKOptCandidates(tour: Node[], positions: number[]): Node[][] {
  const candidates: Node[][] = []
  const k = positions.length

  const segments: Node[][] = []
  let prevPos = 0

  for (const pos of positions) {
    segments.push(tour.slice(prevPos, pos + 1))
    prevPos = pos + 1
  }
  if (prevPos < tour.length) {
    segments.push(tour.slice(prevPos))
  }

  const middleSegments = segments.slice(1, -1)
  const permutations = generateSegmentPermutations(middleSegments)

  for (const perm of permutations) {
    const newTour = [
      ...segments[0]!,
      ...perm.flat(),
      ...(segments[segments.length - 1] || []),
    ]
    if (newTour.length === tour.length) {
      candidates.push(newTour)
    }
  }

  return candidates
}

/**
 * Generate permutations of segments with optional reversal
 */
function generateSegmentPermutations(segments: Node[][]): Node[][][] {
  if (segments.length === 0) return [[]]
  if (segments.length === 1) {
    return [[segments[0]!], [[...segments[0]!].reverse()]]
  }

  const results: Node[][][] = []
  const indices = segments.map((_, i) => i)

  function permute(arr: number[], start: number): void {
    if (start === arr.length) {
      // For each permutation, try all reversal combinations
      const numReversals = 1 << arr.length // 2^n combinations

      for (let mask = 0; mask < numReversals; mask++) {
        const result: Node[][] = []
        for (let i = 0; i < arr.length; i++) {
          const segment = segments[arr[i]!]!
          if (mask & (1 << i)) {
            result.push([...segment].reverse())
          } else {
            result.push(segment)
          }
        }
        results.push(result)
      }
      return
    }

    for (let i = start; i < arr.length; i++) {
      ;[arr[start], arr[i]] = [arr[i]!, arr[start]!]
      permute(arr, start + 1)
      ;[arr[start], arr[i]] = [arr[i]!, arr[start]!]
    }
  }

  permute(indices, 0)

  // Limit results for performance
  if (results.length > 100) {
    return results.slice(0, 100)
  }

  return results
}

const koptAlgorithm: Algorithm = {
  name: 'k-opt',
  configOptions: [
    {
      key: 'k',
      label: 'k value',
      type: 'number',
      default: 2,
      min: 2,
      max: 5,
    },
  ],
  solve: (graph: Graph, config?: AlgorithmConfig): Result => {
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

    const k = (config?.k as number) ?? 2

    let tour = nearestNeighborTour(nodes)

    if (k === 2) {
      tour = optimize2Opt(tour)
    } else if (k === 3) {
      tour = optimize3Opt(tour)
    } else {
      tour = optimizeKOpt(tour, k)
    }

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

export default koptAlgorithm

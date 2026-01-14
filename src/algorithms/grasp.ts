import type { Algorithm, AlgorithmConfig, Graph, Node, Performance, Result } from '../types/tsp'
import { type OperationCounter, distance, tourDistance } from './utils'

/**
 * Build a tour using the randomized greedy construction phase of GRASP
 * Uses a Restricted Candidate List (RCL) to select next nodes
 */
function graspConstruction(
  nodes: Node[],
  alpha: number,
  counter: OperationCounter,
): Node[] {
  const n = nodes.length
  if (n === 0) return []
  if (n === 1) {
    counter.reads += 1
    counter.writes += 1
    return [nodes[0]!]
  }

  const unvisited = new Set(nodes.map((_, i) => i))
  const tour: Node[] = []

  const startIdx = Math.floor(Math.random() * n)
  counter.reads += 1
  counter.writes += 1
  tour.push(nodes[startIdx]!)
  unvisited.delete(startIdx)

  let currentIdx = startIdx

  while (unvisited.size > 0) {
    const candidates: { idx: number; dist: number }[] = []
    let minDist = Infinity
    let maxDist = -Infinity

    for (const idx of unvisited) {
      const dist = distance(nodes[currentIdx]!, nodes[idx]!, counter)
      candidates.push({ idx, dist })
      if (dist < minDist) minDist = dist
      if (dist > maxDist) maxDist = dist
    }

    const threshold = minDist + alpha * (maxDist - minDist)
    const rcl = candidates.filter((c) => c.dist <= threshold)

    const selected = rcl[Math.floor(Math.random() * rcl.length)]!
    counter.reads += 1
    counter.writes += 1
    tour.push(nodes[selected.idx]!)
    unvisited.delete(selected.idx)
    currentIdx = selected.idx
  }

  return tour
}

/**
 * Perform a 2-opt swap: reverse the segment between indices i and j
 */
function twoOptSwap(tour: Node[], i: number, j: number, counter: OperationCounter): Node[] {
  const newTour = [...tour]
  counter.reads += tour.length
  counter.writes += tour.length

  let left = i
  let right = j
  while (left < right) {
    counter.reads += 2
    counter.writes += 2
    ;[newTour[left], newTour[right]] = [newTour[right]!, newTour[left]!]
    left++
    right--
  }

  return newTour
}

/**
 * Calculate the change in tour distance from a 2-opt swap
 * This is more efficient than recalculating the entire tour distance
 */
function calculateDelta(
  tour: Node[],
  i: number,
  j: number,
  counter: OperationCounter,
): number {
  const n = tour.length

  const a = i > 0 ? tour[i - 1]! : tour[n - 1]!
  const b = tour[i]!
  const c = tour[j]!
  const d = tour[(j + 1) % n]!

  counter.reads += 16 // 4 nodes × 4 coordinates for distance calculations

  // Old edges: (a,b) and (c,d)
  const dxAB = b.x - a.x
  const dyAB = b.y - a.y
  const oldAB = Math.sqrt(dxAB * dxAB + dyAB * dyAB)

  const dxCD = d.x - c.x
  const dyCD = d.y - c.y
  const oldCD = Math.sqrt(dxCD * dxCD + dyCD * dyCD)

  // New edges: (a,c) and (b,d)
  const dxAC = c.x - a.x
  const dyAC = c.y - a.y
  const newAC = Math.sqrt(dxAC * dxAC + dyAC * dyAC)

  const dxBD = d.x - b.x
  const dyBD = d.y - b.y
  const newBD = Math.sqrt(dxBD * dxBD + dyBD * dyBD)

  return newAC + newBD - (oldAB + oldCD)
}

/**
 * Apply 2-opt local search to improve the tour
 */
function localSearch(
  tour: Node[],
  maxIterations: number,
  counter: OperationCounter,
): { tour: Node[]; distance: number } {
  const n = tour.length
  if (n < 4) {
    return { tour, distance: tourDistance(tour, counter) }
  }

  let currentTour = tour
  let currentDistance = tourDistance(currentTour, counter)
  let improved = true
  let iterations = 0

  while (improved && iterations < maxIterations) {
    improved = false
    iterations++

    for (let i = 1; i < n - 1 && !improved; i++) {
      for (let j = i + 1; j < n && !improved; j++) {
        const delta = calculateDelta(currentTour, i, j, counter)

        if (delta < -1e-10) {
          currentTour = twoOptSwap(currentTour, i, j, counter)
          currentDistance += delta
          improved = true
        }
      }
    }
  }

  return { tour: currentTour, distance: currentDistance }
}

const grasp: Algorithm = {
  name: 'GRASP',
  configOptions: [
    {
      key: 'alpha',
      label: 'Alpha (RCL threshold)',
      type: 'number',
      default: 0.3,
      min: 0,
      max: 1,
    },
    {
      key: 'iterations',
      label: 'Iterations',
      type: 'number',
      default: 100,
      min: 10,
      max: 1000,
    },
    {
      key: 'localSearchMaxIterations',
      label: 'Local Search Max Iterations',
      type: 'number',
      default: 1000,
      min: 100,
      max: 10000,
    },
  ],
  solve: (graph: Graph, config?: AlgorithmConfig): Result => {
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

    if (n === 2) {
      counter.reads += 2
      counter.writes += 3
      const tour = [nodes[0]!, nodes[1]!, nodes[0]!]
      return {
        path: tour,
        performance: {
          distance: tourDistance([nodes[0]!, nodes[1]!], counter),
          runtime: performance.now() - startTime,
          reads: counter.reads,
          writes: counter.writes,
        },
      }
    }

    const alpha = (config?.alpha as number) ?? 0.3
    const iterations = (config?.iterations as number) ?? 100
    const localSearchMaxIterations = (config?.localSearchMaxIterations as number) ?? 1000

    let bestTour: Node[] = []
    let bestDistance = Infinity

    for (let iter = 0; iter < iterations; iter++) {
      // Construction phase: build a randomized greedy solution
      const constructedTour = graspConstruction(nodes, alpha, counter)

      // Local search phase: improve the solution with 2-opt
      const { tour: improvedTour, distance: improvedDistance } = localSearch(
        constructedTour,
        localSearchMaxIterations,
        counter,
      )

      // Update best solution
      if (improvedDistance < bestDistance) {
        bestDistance = improvedDistance
        counter.reads += improvedTour.length
        counter.writes += improvedTour.length
        bestTour = [...improvedTour]
      }
    }

    const endTime = performance.now()
    const runtime = endTime - startTime

    const displayPath = [...bestTour, bestTour[0]!]

    const performanceMetrics: Performance = {
      distance: bestDistance,
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

export default grasp

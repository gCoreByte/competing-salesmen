import type { Algorithm, AlgorithmConfig, Graph, Node, Performance, Result } from '../types/tsp'
import { type OperationCounter, nearestNeighborTour, tourDistance } from './utils'

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

  // Get the nodes involved in the swap
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

  return (newAC + newBD) - (oldAB + oldCD)
}

const simulatedAnnealing: Algorithm = {
  name: 'Simulated Annealing',
  configOptions: [
    {
      key: 'initialTemperature',
      label: 'Initial Temperature',
      type: 'number',
      default: 10000,
      min: 100,
      max: 100000,
    },
    {
      key: 'coolingRate',
      label: 'Cooling Rate',
      type: 'number',
      default: 0.995,
      min: 0.9,
      max: 0.9999,
    },
    {
      key: 'minTemperature',
      label: 'Min Temperature',
      type: 'number',
      default: 0.1,
      min: 0.001,
      max: 10,
    },
    {
      key: 'maxIterations',
      label: 'Max Iterations',
      type: 'number',
      default: 100000,
      min: 1000,
      max: 1000000,
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

    const initialTemperature = (config?.initialTemperature as number) ?? 10000
    const coolingRate = (config?.coolingRate as number) ?? 0.995
    const minTemperature = (config?.minTemperature as number) ?? 0.1
    const maxIterations = (config?.maxIterations as number) ?? 100000

    let currentTour = nearestNeighborTour(nodes, counter)
    let currentDistance = tourDistance(currentTour, counter)

    let bestTour = [...currentTour]
    let bestDistance = currentDistance
    counter.reads += currentTour.length
    counter.writes += currentTour.length

    let temperature = initialTemperature
    let iteration = 0

    while (temperature > minTemperature && iteration < maxIterations) {
      // Generate a random 2-opt neighbor
      let i = Math.floor(Math.random() * (n - 1)) + 1
      let j = Math.floor(Math.random() * (n - 1)) + 1

      if (i > j) {
        ;[i, j] = [j, i]
      }

      if (i === j || i + 1 === j) {
        iteration++
        continue
      }

      const delta = calculateDelta(currentTour, i, j, counter)

      if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
        currentTour = twoOptSwap(currentTour, i, j, counter)
        currentDistance += delta

        if (currentDistance < bestDistance) {
          bestDistance = currentDistance
          counter.reads += currentTour.length
          counter.writes += currentTour.length
          bestTour = [...currentTour]
        }
      }

      temperature *= coolingRate
      iteration++
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

export default simulatedAnnealing

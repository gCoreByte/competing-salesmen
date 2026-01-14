import type { Algorithm, AlgorithmConfig, Graph, Node, Performance, Result } from '../types/tsp'
import { type OperationCounter, distance, tourDistance } from './utils'

/**
 * Initialize pheromone matrix with small positive values
 */
function initializePheromones(n: number, initialValue: number, counter: OperationCounter): number[][] {
  const pheromones: number[][] = []
  for (let i = 0; i < n; i++) {
    const row: number[] = []
    for (let j = 0; j < n; j++) {
      row[j] = initialValue
      counter.writes += 1
    }
    pheromones[i] = row
  }
  return pheromones
}

/**
 * Precompute distance matrix for efficiency
 */
function computeDistanceMatrix(nodes: Node[], counter: OperationCounter): number[][] {
  const n = nodes.length
  const distances: number[][] = []
  for (let i = 0; i < n; i++) {
    const row: number[] = []
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row[j] = 0
      } else {
        row[j] = distance(nodes[i]!, nodes[j]!, counter)
      }
      counter.writes += 1
    }
    distances[i] = row
  }
  return distances
}

/**
 * Select next city probabilistically based on pheromone and distance heuristic
 */
function selectNextCity(
  currentIdx: number,
  unvisited: Set<number>,
  pheromones: number[][],
  distances: number[][],
  alpha: number,
  beta: number,
  counter: OperationCounter,
): number {
  const probabilities: { idx: number; prob: number }[] = []
  let total = 0

  for (const nextIdx of unvisited) {
    counter.reads += 2 // read pheromone and distance
    const tau = pheromones[currentIdx]![nextIdx]!
    const dist = distances[currentIdx]![nextIdx]!
    const eta = dist > 0 ? 1 / dist : 1000 // heuristic: inverse of distance

    const probability = Math.pow(tau, alpha) * Math.pow(eta, beta)
    probabilities.push({ idx: nextIdx, prob: probability })
    total += probability
  }

  const random = Math.random() * total
  let cumulative = 0

  for (const { idx, prob } of probabilities) {
    cumulative += prob
    if (cumulative >= random) {
      return idx
    }
  }

  return probabilities[probabilities.length - 1]?.idx ?? currentIdx
}

/**
 * Construct a tour for a single ant
 */
function constructTour(
  nodes: Node[],
  pheromones: number[][],
  distances: number[][],
  alpha: number,
  beta: number,
  counter: OperationCounter,
): number[] {
  const n = nodes.length
  const tour: number[] = []
  const unvisited = new Set<number>()

  for (let i = 0; i < n; i++) {
    unvisited.add(i)
  }

  // Start from a random city
  const startIdx = Math.floor(Math.random() * n)
  tour.push(startIdx)
  unvisited.delete(startIdx)
  counter.writes += 1

  while (unvisited.size > 0) {
    const currentIdx = tour[tour.length - 1]!
    const nextIdx = selectNextCity(currentIdx, unvisited, pheromones, distances, alpha, beta, counter)
    tour.push(nextIdx)
    unvisited.delete(nextIdx)
    counter.writes += 1
  }

  return tour
}

/**
 * Calculate tour length using precomputed distances
 */
function calculateTourLength(tour: number[], distances: number[][], counter: OperationCounter): number {
  let length = 0
  for (let i = 0; i < tour.length - 1; i++) {
    counter.reads += 1
    length += distances[tour[i]!]![tour[i + 1]!]!
  }
  // Add return to start
  counter.reads += 1
  length += distances[tour[tour.length - 1]!]![tour[0]!]!
  return length
}

/**
 * Update pheromone trails: evaporate and deposit
 */
function updatePheromones(
  pheromones: number[][],
  allTours: number[][],
  allLengths: number[],
  evaporationRate: number,
  Q: number,
  counter: OperationCounter,
): void {
  const n = pheromones.length

  // Evaporation
  for (let i = 0; i < n; i++) {
    const row = pheromones[i]!
    for (let j = 0; j < n; j++) {
      counter.reads += 1
      counter.writes += 1
      row[j] = row[j]! * (1 - evaporationRate)
    }
  }

  // Deposit pheromones based on tour quality
  for (let k = 0; k < allTours.length; k++) {
    const tour = allTours[k]!
    const length = allLengths[k]!
    const deposit = Q / length

    for (let i = 0; i < tour.length - 1; i++) {
      const from = tour[i]!
      const to = tour[i + 1]!
      counter.reads += 2
      counter.writes += 2
      const fromRow = pheromones[from]!
      const toRow = pheromones[to]!
      fromRow[to] = fromRow[to]! + deposit
      toRow[from] = toRow[from]! + deposit // symmetric
    }
    // Return edge
    const last = tour[tour.length - 1]!
    const first = tour[0]!
    counter.reads += 2
    counter.writes += 2
    const lastRow = pheromones[last]!
    const firstRow = pheromones[first]!
    lastRow[first] = lastRow[first]! + deposit
    firstRow[last] = firstRow[last]! + deposit
  }
}

/**
 * Convert index-based tour to Node-based tour
 */
function indicesToNodes(tour: number[], nodes: Node[], counter: OperationCounter): Node[] {
  const result: Node[] = []
  for (const idx of tour) {
    counter.reads += 1
    counter.writes += 1
    result.push(nodes[idx]!)
  }
  return result
}

const antColonyAlgorithm: Algorithm = {
  name: 'Ant Colony',
  configOptions: [
    {
      key: 'antCount',
      label: 'Number of Ants',
      type: 'number',
      default: 20,
      min: 5,
      max: 100,
    },
    {
      key: 'iterations',
      label: 'Iterations',
      type: 'number',
      default: 100,
      min: 10,
      max: 500,
    },
    {
      key: 'alpha',
      label: 'Pheromone Weight (o)',
      type: 'number',
      default: 1.0,
      min: 0.1,
      max: 5.0,
    },
    {
      key: 'beta',
      label: 'Heuristic Weight (β)',
      type: 'number',
      default: 2.0,
      min: 0.1,
      max: 5.0,
    },
    {
      key: 'evaporationRate',
      label: 'Evaporation Rate',
      type: 'number',
      default: 0.5,
      min: 0.1,
      max: 0.9,
    },
    {
      key: 'Q',
      label: 'Pheromone Constant (Q)',
      type: 'number',
      default: 100,
      min: 1,
      max: 1000,
    },
  ],
  solve: (graph: Graph, config?: AlgorithmConfig): Result => {
    const startTime = performance.now()

    const nodes = graph.nodes
    const n = nodes.length
    const counter: OperationCounter = { reads: 0, writes: 0 }

    // Handle edge cases
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

    const antCount = (config?.antCount as number) ?? 20
    const iterations = (config?.iterations as number) ?? 100
    const alpha = (config?.alpha as number) ?? 1.0
    const beta = (config?.beta as number) ?? 2.0
    const evaporationRate = (config?.evaporationRate as number) ?? 0.5
    const Q = (config?.Q as number) ?? 100

    const initialPheromone = 1.0 / n
    const pheromones = initializePheromones(n, initialPheromone, counter)
    const distances = computeDistanceMatrix(nodes, counter)

    let bestTour: number[] = []
    let bestLength = Infinity

    // Main ACO loop
    for (let iter = 0; iter < iterations; iter++) {
      const iterationTours: number[][] = []
      const iterationLengths: number[] = []

      // Each ant constructs a tour
      for (let ant = 0; ant < antCount; ant++) {
        const tour = constructTour(nodes, pheromones, distances, alpha, beta, counter)
        const length = calculateTourLength(tour, distances, counter)

        iterationTours.push(tour)
        iterationLengths.push(length)

        // Track best solution
        if (length < bestLength) {
          bestLength = length
          bestTour = [...tour]
          counter.writes += tour.length
        }
      }

      // Update pheromones
      updatePheromones(pheromones, iterationTours, iterationLengths, evaporationRate, Q, counter)
    }

    const endTime = performance.now()
    const runtime = endTime - startTime

    // Convert best tour to nodes and add return to start
    const nodePath = indicesToNodes(bestTour, nodes, counter)
    const displayPath = [...nodePath, nodePath[0]!]

    const performanceMetrics: Performance = {
      distance: bestLength,
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

export default antColonyAlgorithm

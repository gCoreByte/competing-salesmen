import type { Algorithm, AlgorithmConfig, Graph, Node, Performance, Result } from '../types/tsp'
import { type OperationCounter, nearestNeighborTour, tourDistance } from './utils'

/**
 * Fisher-Yates shuffle for creating random permutations
 */
function shuffleArray(array: Node[], counter: OperationCounter): Node[] {
  const result = [...array]
  counter.writes += array.length
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    counter.reads += 2
    counter.writes += 2
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

/**
 * Initialize population with a mix of heuristic and random tours
 */
function initializePopulation(
  nodes: Node[],
  populationSize: number,
  counter: OperationCounter,
): Node[][] {
  const population: Node[][] = []

  // First individual: nearest neighbor heuristic
  const nnTour = nearestNeighborTour(nodes, counter)
  population.push(nnTour)

  // Rest: random permutations
  for (let i = 1; i < populationSize; i++) {
    population.push(shuffleArray(nodes, counter))
  }

  return population
}

/**
 * Tournament selection: pick the best individual from a random subset
 */
function tournamentSelection(
  population: Node[][],
  fitness: number[],
  counter: OperationCounter,
  tournamentSize: number = 3,
): Node[] {
  let bestIdx = Math.floor(Math.random() * population.length)
  let bestFitness = fitness[bestIdx]!
  counter.reads += 1

  for (let i = 1; i < tournamentSize; i++) {
    const idx = Math.floor(Math.random() * population.length)
    counter.reads += 1
    if (fitness[idx]! > bestFitness) {
      bestIdx = idx
      bestFitness = fitness[idx]!
    }
  }

  const selected = population[bestIdx]!
  counter.reads += selected.length
  counter.writes += selected.length
  return [...selected]
}

/**
 * Order Crossover (OX): preserves relative ordering of cities
 * 1. Select a substring from parent1
 * 2. Fill remaining positions with cities from parent2 in order
 */
function orderCrossover(parent1: Node[], parent2: Node[], counter: OperationCounter): Node[] {
  const n = parent1.length
  if (n < 3) {
    counter.reads += n
    counter.writes += n
    return [...parent1]
  }

  let start = Math.floor(Math.random() * n)
  let end = Math.floor(Math.random() * n)
  if (start > end) [start, end] = [end, start]

  const child: (Node | null)[] = new Array(n).fill(null)
  const usedIds = new Set<number>()

  for (let i = start; i <= end; i++) {
    counter.reads += 1
    counter.writes += 1
    child[i] = parent1[i]!
    usedIds.add(parent1[i]!.id)
  }

  let childIdx = (end + 1) % n
  for (let i = 0; i < n; i++) {
    const parent2Idx = (end + 1 + i) % n
    counter.reads += 1
    const city = parent2[parent2Idx]!

    if (!usedIds.has(city.id)) {
      counter.writes += 1
      child[childIdx] = city
      usedIds.add(city.id)
      childIdx = (childIdx + 1) % n
    }
  }

  return child as Node[]
}

/**
 * Swap mutation: exchange two random positions in the tour
 */
function swapMutation(tour: Node[], counter: OperationCounter): Node[] {
  if (tour.length < 2) return tour

  counter.reads += tour.length
  counter.writes += tour.length
  const result = [...tour]
  const i = Math.floor(Math.random() * result.length)
  let j = Math.floor(Math.random() * result.length)

  while (j === i && result.length > 1) {
    j = Math.floor(Math.random() * result.length)
  }

  counter.reads += 2
  counter.writes += 2
  ;[result[i], result[j]] = [result[j]!, result[i]!]
  return result
}

/**
 * Calculate fitness for each individual (inverse of distance - lower distance = higher fitness)
 */
function calculateFitness(population: Node[][], counter: OperationCounter): number[] {
  return population.map((tour) => {
    const dist = tourDistance(tour, counter)
    return dist > 0 ? 1 / dist : Infinity
  })
}

/**
 * Get indices of top N individuals by fitness
 */
function getEliteIndices(fitness: number[], count: number): number[] {
  const indexed = fitness.map((f, i) => ({ fitness: f, index: i }))
  indexed.sort((a, b) => b.fitness - a.fitness)
  return indexed.slice(0, count).map((item) => item.index)
}

const geneticAlgorithm: Algorithm = {
  name: 'Genetic Algorithm',
  configOptions: [
    {
      key: 'populationSize',
      label: 'Population Size',
      type: 'number',
      default: 50,
      min: 10,
      max: 200,
    },
    {
      key: 'generations',
      label: 'Generations',
      type: 'number',
      default: 100,
      min: 10,
      max: 1000,
    },
    {
      key: 'mutationRate',
      label: 'Mutation Rate',
      type: 'number',
      default: 0.1,
      min: 0.01,
      max: 0.5,
    },
    {
      key: 'crossoverRate',
      label: 'Crossover Rate',
      type: 'number',
      default: 0.8,
      min: 0.5,
      max: 1.0,
    },
    {
      key: 'eliteCount',
      label: 'Elite Count',
      type: 'number',
      default: 2,
      min: 1,
      max: 10,
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

    const populationSize = (config?.populationSize as number) ?? 50
    const generations = (config?.generations as number) ?? 100
    const mutationRate = (config?.mutationRate as number) ?? 0.1
    const crossoverRate = (config?.crossoverRate as number) ?? 0.8
    const eliteCount = Math.min((config?.eliteCount as number) ?? 2, populationSize)

    let population = initializePopulation(nodes, populationSize, counter)
    let fitness = calculateFitness(population, counter)

    let bestTour = population[0]!
    let bestDistance = tourDistance(bestTour, counter)

    for (let gen = 0; gen < generations; gen++) {
      const newPopulation: Node[][] = []

      const eliteIndices = getEliteIndices(fitness, eliteCount)
      for (const idx of eliteIndices) {
        counter.reads += population[idx]!.length
        counter.writes += population[idx]!.length
        newPopulation.push([...population[idx]!])
      }

      while (newPopulation.length < populationSize) {
        const parent1 = tournamentSelection(population, fitness, counter)
        const parent2 = tournamentSelection(population, fitness, counter)

        let offspring: Node[]
        if (Math.random() < crossoverRate) {
          offspring = orderCrossover(parent1, parent2, counter)
        } else {
          counter.reads += parent1.length
          counter.writes += parent1.length
          offspring = [...parent1]
        }

        if (Math.random() < mutationRate) {
          offspring = swapMutation(offspring, counter)
        }

        newPopulation.push(offspring)
      }

      population = newPopulation
      fitness = calculateFitness(population, counter)

      for (let i = 0; i < population.length; i++) {
        const dist = tourDistance(population[i]!, counter)
        if (dist < bestDistance) {
          bestDistance = dist
          counter.reads += population[i]!.length
          counter.writes += population[i]!.length
          bestTour = [...population[i]!]
        }
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

export default geneticAlgorithm

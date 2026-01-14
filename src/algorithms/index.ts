import naive from './naive'
import kopt from './kopt'
import nearestNeighbour from './nearest-neighbour'
import genetic from './genetic'
import antColony from './ant-colony'
import simulatedAnnealing from './simulated-annealing'
import type { Algorithm } from '../types/tsp'

// algorithm registry
const algorithms: Record<string, Algorithm> = {
  naive,
  kopt,
  nearestNeighbour,
  genetic,
  antColony,
  simulatedAnnealing,
}

export const getAlgorithmNames = (): string[] => {
  return Object.keys(algorithms)
}

export const getAlgorithm = (name: string): Algorithm | undefined => {
  return algorithms[name]
}

export default algorithms

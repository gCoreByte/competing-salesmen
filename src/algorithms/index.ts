import naive from './naive'
import type { Algorithm } from '../types/tsp'

// algorithm registry
const algorithms: Record<string, Algorithm> = {
  naive,
}

export const getAlgorithmNames = (): string[] => {
  return Object.keys(algorithms)
}

export const getAlgorithm = (name: string): Algorithm | undefined => {
  return algorithms[name]
}

export default algorithms

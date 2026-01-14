import type { AlgorithmConfig, Graph, Result } from '../types/tsp'

export interface WorkerRequest {
  type: 'run'
  algorithmName: string
  graph: Graph
  config?: AlgorithmConfig
}

export interface WorkerSuccessResponse {
  type: 'success'
  result: Result
}

export interface WorkerErrorResponse {
  type: 'error'
  error: string
}

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse

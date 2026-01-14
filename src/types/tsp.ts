export interface Node {
  id: number
  x: number
  y: number
  [key: string]: unknown
}

export interface Edge {
  id: number
  from: Node
  to: Node
  weight?: number
  [key: string]: unknown
}

export interface Graph {
  nodes: Node[]
  edges: Edge[]
}

export interface Performance {
  distance: number
  runtime: number
  reads: number
  writes: number
}

export interface Result {
  path: Node[]
  performance: Performance
}

export interface AlgorithmConfig {
  [key: string]: unknown
}

export interface ConfigOption {
  key: string
  label: string
  type: 'number' | 'select'
  default: number | string
  min?: number
  max?: number
  options?: { value: string | number; label: string }[]
}

export interface Algorithm {
  name: string
  configOptions?: ConfigOption[]
  solve: (graph: Graph, config?: AlgorithmConfig) => Result
}

export interface RunOptions {
  timeout?: number // timeout in milliseconds, 0 or undefined means no timeout
}

export interface RunnerState {
  isRunning: boolean
  canCancel: boolean
  error: string | null
}

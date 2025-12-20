export interface Node {
  id: string | number
  x: number
  y: number
  [key: string]: unknown
}

export interface Edge {
  from: string | number
  to: string | number
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

export interface Algorithm {
  name: string
  solve: (graph: Graph) => Result
}

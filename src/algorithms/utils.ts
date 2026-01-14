import type { Node } from '../types/tsp'

/**
 * Calculate Euclidean distance between two nodes
 */
export function distance(a: Node, b: Node): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate total tour distance (closed tour)
 */
export function tourDistance(tour: Node[]): number {
  if (tour.length < 2) return 0
  let total = 0
  for (let i = 0; i < tour.length - 1; i++) {
    total += distance(tour[i]!, tour[i + 1]!)
  }
  total += distance(tour[tour.length - 1]!, tour[0]!)
  return total
}

/**
 * Build tour using nearest neighbor heuristic
 */
export function nearestNeighborTour(nodes: Node[]): Node[] {
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

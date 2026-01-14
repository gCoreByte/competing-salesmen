import type { Node } from '../types/tsp'

export interface OperationCounter {
  reads: number
  writes: number
}

/**
 * Calculate Euclidean distance between two nodes
 * Each call reads 4 values (x, y for each node)
 */
export function distance(a: Node, b: Node, counter?: OperationCounter): number {
  if (counter) counter.reads += 4
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate total tour distance (closed tour)
 * Reads 4 values per edge (2 nodes × 2 coordinates)
 */
export function tourDistance(tour: Node[], counter?: OperationCounter): number {
  if (tour.length < 2) return 0
  let total = 0
  for (let i = 0; i < tour.length - 1; i++) {
    total += distance(tour[i]!, tour[i + 1]!, counter)
  }
  total += distance(tour[tour.length - 1]!, tour[0]!, counter)
  return total
}

/**
 * Build tour using nearest neighbor heuristic
 * For n nodes: reads O(n^2) for distance comparisons, writes n for tour
 */
export function nearestNeighborTour(nodes: Node[], counter?: OperationCounter): Node[] {
  if (nodes.length === 0) return []
  if (nodes.length === 1) {
    if (counter) {
      counter.reads += 1
      counter.writes += 1
    }
    return [nodes[0]!]
  }

  const unvisited = new Set(nodes.map((_, i) => i))
  const tour: Node[] = []

  let currentIdx = 0
  if (counter) {
    counter.reads += 1
    counter.writes += 1
  }
  tour.push(nodes[currentIdx]!)
  unvisited.delete(currentIdx)

  while (unvisited.size > 0) {
    let nearestIdx = -1
    let nearestDist = Infinity

    for (const idx of unvisited) {
      const dist = distance(nodes[currentIdx]!, nodes[idx]!, counter)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = idx
      }
    }

    if (nearestIdx !== -1) {
      if (counter) {
        counter.reads += 1
        counter.writes += 1
      }
      tour.push(nodes[nearestIdx]!)
      unvisited.delete(nearestIdx)
      currentIdx = nearestIdx
    }
  }

  return tour
}

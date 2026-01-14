import { getAlgorithm } from '../algorithms'
import type {
  WorkerRequest,
  WorkerSuccessResponse,
  WorkerErrorResponse,
} from './types'

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, algorithmName, graph, config } = event.data

  if (type !== 'run') {
    console.log('[Worker] Unknown message type:', type)
    const response: WorkerErrorResponse = {
      type: 'error',
      error: `Unknown message type: ${type}`,
    }
    self.postMessage(response)
    return
  }

  try {
    const algorithm = getAlgorithm(algorithmName)

    if (!algorithm) {
      console.log('[Worker] Algorithm not found:', algorithmName)
      const response: WorkerErrorResponse = {
        type: 'error',
        error: `Algorithm not found: ${algorithmName}`,
      }
      self.postMessage(response)
      return
    }

    const result = algorithm.solve(graph, config)

    const response: WorkerSuccessResponse = {
      type: 'success',
      result,
    }
    self.postMessage(response)
  } catch (err) {
    console.error('[Worker] Error:', err)
    const response: WorkerErrorResponse = {
      type: 'error',
      error: err instanceof Error ? err.message : String(err),
    }
    self.postMessage(response)
  }
}

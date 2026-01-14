import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAlgorithmRunner, AlgorithmRunnerError } from '../algorithmRunner'
import type { WorkerFactory } from '../algorithmRunner'
import type { Graph, Result } from '../../types/tsp'
import type { WorkerRequest, WorkerResponse } from '../../workers/types'

class MockWorker {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null

  private messageHandler: ((request: WorkerRequest) => void) | null = null

  constructor() { }

  postMessage(request: WorkerRequest) {
    if (this.messageHandler) {
      this.messageHandler(request)
    }
  }

  terminate() {}

  simulateSuccess(result: Result) {
    this.messageHandler = () => {
      if (this.onmessage) {
        const response: WorkerResponse = { type: 'success', result }
        this.onmessage(new MessageEvent('message', { data: response }))
      }
    }
  }

  simulateError(error: string) {
    this.messageHandler = () => {
      if (this.onmessage) {
        const response: WorkerResponse = { type: 'error', error }
        this.onmessage(new MessageEvent('message', { data: response }))
      }
    }
  }

  simulateWorkerError(message: string) {
    this.messageHandler = () => {
      if (this.onerror) {
        const errorEvent = new ErrorEvent('error', { message })
        this.onerror(errorEvent)
      }
    }
  }

  simulateDelay(delayMs: number, result: Result) {
    this.messageHandler = () => {
      setTimeout(() => {
        if (this.onmessage) {
          const response: WorkerResponse = { type: 'success', result }
          this.onmessage(new MessageEvent('message', { data: response }))
        }
      }, delayMs)
    }
  }

  setManualMode() {
    this.messageHandler = () => {}
  }

  triggerSuccess(result: Result) {
    if (this.onmessage) {
      const response: WorkerResponse = { type: 'success', result }
      this.onmessage(new MessageEvent('message', { data: response }))
    }
  }

  triggerError(error: string) {
    if (this.onmessage) {
      const response: WorkerResponse = { type: 'error', error }
      this.onmessage(new MessageEvent('message', { data: response }))
    }
  }
}

const createTestGraph = (): Graph => ({
  nodes: [
    { id: 1, x: 0, y: 0 },
    { id: 2, x: 100, y: 0 },
    { id: 3, x: 50, y: 100 },
  ],
  edges: [],
})

const createTestResult = (): Result => ({
  path: [
    { id: 1, x: 0, y: 0 },
    { id: 2, x: 100, y: 0 },
    { id: 3, x: 50, y: 100 },
    { id: 1, x: 0, y: 0 },
  ],
  performance: {
    distance: 300,
    runtime: 10,
    reads: 100,
    writes: 50,
  },
})

describe('AlgorithmRunner', () => {
  let mockWorker: MockWorker
  let mockWorkerFactory: WorkerFactory

  beforeEach(() => {
    vi.useFakeTimers()
    mockWorker = new MockWorker()
    mockWorkerFactory = () => mockWorker as unknown as Worker
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('successful execution', () => {
    it('should return result from worker on successful execution', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()
      const expectedResult = createTestResult()

      mockWorker.simulateSuccess(expectedResult)

      const result = await runner.run('nearestNeighbour', graph)

      expect(result).toEqual(expectedResult)
    })

    it('should pass algorithm name, graph, and config to worker', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()
      const config = { k: 3 }
      const expectedResult = createTestResult()

      let receivedRequest: WorkerRequest | null = null
      mockWorker.postMessage = (request: WorkerRequest) => {
        receivedRequest = request
        if (mockWorker.onmessage) {
          const response: WorkerResponse = { type: 'success', result: expectedResult }
          mockWorker.onmessage(new MessageEvent('message', { data: response }))
        }
      }

      await runner.run('kopt', graph, config)

      expect(receivedRequest).toEqual({
        type: 'run',
        algorithmName: 'kopt',
        graph,
        config,
      })
    })

    it('should update isRunning state correctly during execution', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()
      const expectedResult = createTestResult()

      mockWorker.setManualMode()

      expect(runner.state.value.isRunning).toBe(false)

      const promise = runner.run('nearestNeighbour', graph)

      expect(runner.state.value.isRunning).toBe(true)
      expect(runner.state.value.canCancel).toBe(true)

      mockWorker.triggerSuccess(expectedResult)
      await promise

      expect(runner.state.value.isRunning).toBe(false)
      expect(runner.state.value.canCancel).toBe(false)
    })
  })

  describe('timeout handling', () => {
    it('should reject with timeout error after configured duration', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()

      mockWorker.setManualMode()

      const promise = runner.run('nearestNeighbour', graph, undefined, { timeout: 5000 })

      vi.advanceTimersByTime(5000)

      await expect(promise).rejects.toThrow(AlgorithmRunnerError)
      await expect(promise).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: expect.stringContaining('timed out after 5000ms'),
      })
    })

    it('should not timeout when timeout is 0', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()
      const expectedResult = createTestResult()

      mockWorker.setManualMode()

      const promise = runner.run('nearestNeighbour', graph, undefined, { timeout: 0 })

      vi.advanceTimersByTime(60000)

      expect(runner.state.value.isRunning).toBe(true)

      mockWorker.triggerSuccess(expectedResult)
      const result = await promise

      expect(result).toEqual(expectedResult)
    })

    it('should not timeout when timeout is undefined', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()
      const expectedResult = createTestResult()

      mockWorker.setManualMode()

      const promise = runner.run('nearestNeighbour', graph)

      vi.advanceTimersByTime(60000)

      expect(runner.state.value.isRunning).toBe(true)

      mockWorker.triggerSuccess(expectedResult)
      const result = await promise

      expect(result).toEqual(expectedResult)
    })

    it('should update error state on timeout', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()

      mockWorker.setManualMode()

      const promise = runner.run('nearestNeighbour', graph, undefined, { timeout: 1000 })

      vi.advanceTimersByTime(1000)

      try {
        await promise
      } catch { /* expected */ }

      expect(runner.state.value.error).toContain('timed out')
      expect(runner.state.value.isRunning).toBe(false)
    })
  })

  describe('cancellation', () => {
    it('should reject with cancelled error when cancel is called', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()

      mockWorker.setManualMode()

      const promise = runner.run('nearestNeighbour', graph)

      expect(runner.state.value.isRunning).toBe(true)

      runner.cancel()

      await expect(promise).rejects.toThrow(AlgorithmRunnerError)
      await expect(promise).rejects.toMatchObject({
        code: 'CANCELLED',
      })
    })

    it('should not set error state on cancellation', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()

      mockWorker.setManualMode()

      const promise = runner.run('nearestNeighbour', graph)

      runner.cancel()

      try {
        await promise
      } catch { /* expected */ }

      expect(runner.state.value.error).toBeNull()
      expect(runner.state.value.isRunning).toBe(false)
    })

    it('should do nothing when cancel is called with no running algorithm', () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)

      expect(() => runner.cancel()).not.toThrow()
      expect(runner.state.value.isRunning).toBe(false)
    })

    it('should terminate the worker on cancel', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()
      const terminateSpy = vi.spyOn(mockWorker, 'terminate')

      mockWorker.setManualMode()

      const promise = runner.run('nearestNeighbour', graph)

      runner.cancel()

      try {
        await promise
      } catch {
        /* expected */
      }

      expect(terminateSpy).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should reject with worker error when worker reports error', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()

      mockWorker.simulateError('Algorithm not found: unknown')

      await expect(runner.run('unknown', graph)).rejects.toThrow(AlgorithmRunnerError)
      await expect(runner.run('unknown', graph)).rejects.toMatchObject({
        code: 'WORKER_ERROR',
        message: 'Algorithm not found: unknown',
      })
    })

    it('should reject with worker error when worker throws', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()

      mockWorker.simulateWorkerError('Worker crashed')

      await expect(runner.run('nearestNeighbour', graph)).rejects.toThrow(AlgorithmRunnerError)
      await expect(runner.run('nearestNeighbour', graph)).rejects.toMatchObject({
        code: 'WORKER_ERROR',
      })
    })

    it('should update error state on worker error', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()

      mockWorker.simulateError('Something went wrong')

      try {
        await runner.run('nearestNeighbour', graph)
      } catch {
        /* expected */
      }

      expect(runner.state.value.error).toBe('Something went wrong')
      expect(runner.state.value.isRunning).toBe(false)
    })

    it('should handle worker factory failure', async () => {
      const failingFactory: WorkerFactory = () => {
        throw new Error('Failed to create worker')
      }

      const runner = createAlgorithmRunner(failingFactory)
      const graph = createTestGraph()

      await expect(runner.run('nearestNeighbour', graph)).rejects.toThrow(AlgorithmRunnerError)
      await expect(runner.run('nearestNeighbour', graph)).rejects.toMatchObject({
        code: 'WORKER_ERROR',
        message: expect.stringContaining('Failed to create worker'),
      })
    })
  })

  describe('state management', () => {
    it('should clear error with clearError', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()

      mockWorker.simulateError('Some error')

      try {
        await runner.run('nearestNeighbour', graph)
      } catch {
        /* expected */
      }

      expect(runner.state.value.error).toBe('Some error')

      runner.clearError()

      expect(runner.state.value.error).toBeNull()
    })

    it('should cancel previous run when starting new run', async () => {
      const runner = createAlgorithmRunner(mockWorkerFactory)
      const graph = createTestGraph()
      const expectedResult = createTestResult()

      mockWorker.setManualMode()

      const promise1 = runner.run('nearestNeighbour', graph)

      mockWorker.simulateSuccess(expectedResult)
      const promise2 = runner.run('kopt', graph)

      await expect(promise1).rejects.toMatchObject({ code: 'CANCELLED' })

      const result = await promise2
      expect(result).toEqual(expectedResult)
    })
  })
})

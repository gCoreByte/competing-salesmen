import { ref, readonly, toRaw } from 'vue'
import type { AlgorithmConfig, Graph, Result, RunOptions, RunnerState } from '../types/tsp'
import type { WorkerRequest, WorkerResponse } from '../workers/types'

export class AlgorithmRunnerError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'CANCELLED' | 'WORKER_ERROR',
  ) {
    super(message)
    this.name = 'AlgorithmRunnerError'
  }
}

export type WorkerFactory = () => Worker

const defaultWorkerFactory: WorkerFactory = () => {
  return new Worker(new URL('../workers/algorithm.worker.ts', import.meta.url), {
    type: 'module',
  })
}

export function createAlgorithmRunner(workerFactory: WorkerFactory = defaultWorkerFactory) {
  const state = ref<RunnerState>({
    isRunning: false,
    canCancel: false,
    error: null,
  })

  let currentWorker: Worker | null = null
  let currentReject: ((error: AlgorithmRunnerError) => void) | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function cleanup() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (currentWorker) {
      currentWorker.terminate()
      currentWorker = null
    }
    currentReject = null
    state.value = {
      isRunning: false,
      canCancel: false,
      error: state.value.error,
    }
  }

  function run(
    algorithmName: string,
    graph: Graph,
    config?: AlgorithmConfig,
    options?: RunOptions,
  ): Promise<Result> {

    if (state.value.isRunning) {
      cancel()
    }

    state.value = {
      isRunning: true,
      canCancel: true,
      error: null,
    }

    return new Promise<Result>((resolve, reject) => {
      currentReject = reject

      try {
        currentWorker = workerFactory()
      } catch (err) {
        const error = new AlgorithmRunnerError(
          `Failed to create worker: ${err instanceof Error ? err.message : String(err)}`,
          'WORKER_ERROR',
        )
        state.value = {
          isRunning: false,
          canCancel: false,
          error: error.message,
        }
        reject(error)
        return
      }

      currentWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data

        if (response.type === 'success') {
          state.value = {
            isRunning: false,
            canCancel: false,
            error: null,
          }
          cleanup()
          resolve(response.result)
        } else {
          console.log('[Runner] Algorithm failed:', response.error)
          const error = new AlgorithmRunnerError(response.error, 'WORKER_ERROR')
          state.value = {
            isRunning: false,
            canCancel: false,
            error: response.error,
          }
          cleanup()
          reject(error)
        }
      }

      currentWorker.onerror = (event: ErrorEvent) => {
        console.error('[Runner] Worker error:', event)
        const error = new AlgorithmRunnerError(
          event.message || 'Unknown worker error',
          'WORKER_ERROR',
        )
        state.value = {
          isRunning: false,
          canCancel: false,
          error: error.message,
        }
        cleanup()
        reject(error)
      }

      if (options?.timeout && options.timeout > 0) {
        timeoutId = setTimeout(() => {
          const error = new AlgorithmRunnerError(
            `Algorithm timed out after ${options.timeout}ms`,
            'TIMEOUT',
          )
          state.value = {
            isRunning: false,
            canCancel: false,
            error: error.message,
          }
          cleanup()
          reject(error)
        }, options.timeout)
      }

      // Send the run request to the worker
      // Convert Vue reactive proxies to plain objects for structured cloning
      const plainGraph = JSON.parse(JSON.stringify(toRaw(graph)))
      const plainConfig = config ? JSON.parse(JSON.stringify(toRaw(config))) : undefined

      const request: WorkerRequest = {
        type: 'run',
        algorithmName,
        graph: plainGraph,
        config: plainConfig,
      }
      currentWorker.postMessage(request)
    })
  }

  function cancel(): void {
    if (!state.value.isRunning || !currentReject) {
      return
    }

    const error = new AlgorithmRunnerError('Algorithm cancelled by user', 'CANCELLED')
    state.value = {
      isRunning: false,
      canCancel: false,
      error: null, // Cancellation is not an error state
    }
    const rejectFn = currentReject
    cleanup()
    rejectFn(error)
  }

  function clearError(): void {
    state.value = {
      ...state.value,
      error: null,
    }
  }

  return {
    state: readonly(state),
    run,
    cancel,
    clearError,
  }
}

// Default singleton instance for convenience
export const algorithmRunner = createAlgorithmRunner()

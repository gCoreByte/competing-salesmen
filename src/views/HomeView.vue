<script setup lang="ts">
import NodeCanvas from '../components/NodeCanvas.vue'
import PerformanceStats from '../components/PerformanceStats.vue'
import Leaderboard from '../components/Leaderboard.vue'
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { AlgorithmConfig, Edge, Graph, Node, LeaderboardEntry } from '../types/tsp'
import { algorithmRunner, AlgorithmRunnerError, createAlgorithmRunner } from '../services/algorithmRunner'
import { getAlgorithmNames } from '../algorithms'

const selectedAlgorithmName = ref<string>('')
const algorithmConfig = ref<AlgorithmConfig>({})
const timeout = ref<number>(30000)
const bestDistance = ref<number | undefined>(undefined)
const runtime = ref<number | undefined>(undefined)
const reads = ref<number | undefined>(undefined)
const writes = ref<number | undefined>(undefined)

const leaderboardEntries = ref<LeaderboardEntry[]>([])
let leaderboardIdCounter = 0
const selectedEntryId = ref<number | null>(null)

// Parallel run state
type AlgorithmRunner = {
  cancel: () => void
}
const parallelRunners = ref<Map<string, AlgorithmRunner>>(new Map())
const runningAlgorithms = ref<Set<string>>(new Set())

const isRunning = computed(() => algorithmRunner.state.value.isRunning)
const isAnyRunning = computed(() => isRunning.value || runningAlgorithms.value.size > 0)
const runnerError = computed(() => algorithmRunner.state.value.error)

const graph = ref<Graph>({
  nodes: [],
  edges: [],
})

const nodeCount = ref<number>(10)
const nodeCanvasRef = ref<InstanceType<typeof NodeCanvas> | null>(null)
const canvasWidth = ref<number>(600)
const canvasHeight = ref<number>(600)

const updateCanvasDimensions = () => {
  if (nodeCanvasRef.value) {
    const dimensions = nodeCanvasRef.value.getCanvasDimensions()
    if (dimensions) {
      canvasWidth.value = dimensions.width
      canvasHeight.value = dimensions.height
    }
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  updateCanvasDimensions()

  // svg size updates
  if (nodeCanvasRef.value?.svgRef) {
    const svgElement = nodeCanvasRef.value.svgRef
    if (svgElement) {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasDimensions()
      })
      resizeObserver.observe(svgElement)
    }
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  // Cancel any running algorithms when component unmounts
  cancelAllAlgorithms()
})

const resetPerformanceStats = () => {
  bestDistance.value = undefined
  runtime.value = undefined
  reads.value = undefined
  writes.value = undefined
  algorithmRunner.clearError()
}

const clearLeaderboard = () => {
  leaderboardEntries.value = []
  leaderboardIdCounter = 0
}

const generateRandomGraph = () => {
  const nodes: Node[] = []
  const padding = 50

  for (let i = 1; i <= nodeCount.value; i++) {
    nodes.push({
      id: i,
      x: padding + Math.random() * (canvasWidth.value - 2 * padding),
      y: padding + Math.random() * (canvasHeight.value - 2 * padding),
    })
  }

  graph.value.nodes = nodes
  graph.value.edges = []
  resetPerformanceStats()
  clearLeaderboard()
}

const clearGraph = () => {
  graph.value.nodes = []
  graph.value.edges = []
  resetPerformanceStats()
  clearLeaderboard()
}

const onAlgorithmSelected = (key: string, _algorithm: { name: string }) => {
  selectedAlgorithmName.value = key
}

const onConfigChanged = (config: AlgorithmConfig) => {
  algorithmConfig.value = config
}

const onTimeoutChanged = (timeoutMs: number) => {
  timeout.value = timeoutMs
}

const handleAddNode = (node: Node) => {
  graph.value.nodes.push(node)
}

const handleUpdateNode = (updatedNode: Node) => {
  const index = graph.value.nodes.findIndex((n) => n.id === updatedNode.id)
  if (index !== -1) {
    graph.value.nodes[index] = updatedNode
    graph.value.edges = graph.value.edges.map((edge) => {
      if (edge.from.id === updatedNode.id) {
        return { ...edge, from: updatedNode }
      }
      if (edge.to.id === updatedNode.id) {
        return { ...edge, to: updatedNode }
      }
      return edge
    })
  }
}

const handleDeleteNode = (nodeId: number) => {
  graph.value.nodes = graph.value.nodes.filter((n) => n.id !== nodeId)
  graph.value.edges = graph.value.edges.filter(
    (edge) => edge.from.id !== nodeId && edge.to.id !== nodeId,
  )
}

const runAlgorithm = async () => {
  if (!selectedAlgorithmName.value) {
    return
  }

  algorithmRunner.clearError()

  try {
    const result = await algorithmRunner.run(
      selectedAlgorithmName.value,
      graph.value,
      algorithmConfig.value,
      { timeout: timeout.value > 0 ? timeout.value : undefined },
    )

    bestDistance.value = result.performance.distance
    runtime.value = result.performance.runtime
    reads.value = result.performance.reads
    writes.value = result.performance.writes

    const entryId = ++leaderboardIdCounter
    leaderboardEntries.value.push({
      id: entryId,
      algorithmName: selectedAlgorithmName.value,
      performance: { ...result.performance },
      path: [...result.path],
      timestamp: new Date(),
    })
    selectedEntryId.value = entryId

    const edges: Edge[] = []
    for (let i = 0; i < result.path.length; i++) {
      const current = result.path[i]
      const next = result.path[i + 1]
      if (current && next) {
        edges.push({ id: i, from: current, to: next })
      }
    }
    graph.value.edges = edges
  } catch (err) {
    if (err instanceof AlgorithmRunnerError) {
      if (err.code === 'CANCELLED') {
        // User cancelled, no need to show error
        return
      }
      // Error is already set in the runner state
    }
    // Reset stats on error
    bestDistance.value = undefined
    runtime.value = undefined
    reads.value = undefined
    writes.value = undefined
  }
}

const cancelAlgorithm = () => {
  algorithmRunner.cancel()
}

const runAllAlgorithms = async () => {
  if (graph.value.nodes.length === 0) return

  const algorithmNames = getAlgorithmNames()
  const timeoutMs = timeout.value > 0 ? timeout.value : undefined

  cancelAllAlgorithms()

  for (const algorithmName of algorithmNames) {
    const runner = createAlgorithmRunner()
    parallelRunners.value.set(algorithmName, runner)
    runningAlgorithms.value.add(algorithmName)

    runner
      .run(algorithmName, graph.value, {}, { timeout: timeoutMs })
      .then((result) => {
        const entryId = ++leaderboardIdCounter
        leaderboardEntries.value.push({
          id: entryId,
          algorithmName,
          performance: { ...result.performance },
          path: [...result.path],
          timestamp: new Date(),
        })

        if (selectedEntryId.value === null) {
          handleEntrySelected(leaderboardEntries.value[leaderboardEntries.value.length - 1]!)
        }
      })
      .catch((err) => {
        if (err instanceof AlgorithmRunnerError && err.code === 'CANCELLED') {
          // User cancelled, ignore
          return
        }
        console.error(`Algorithm ${algorithmName} failed:`, err)
      })
      .finally(() => {
        runningAlgorithms.value.delete(algorithmName)
        parallelRunners.value.delete(algorithmName)
      })
  }
}

const cancelAllAlgorithms = () => {
  // Cancel the main runner
  algorithmRunner.cancel()

  // Cancel all parallel runners
  for (const [, runner] of parallelRunners.value) {
    runner.cancel()
  }
  parallelRunners.value.clear()
  runningAlgorithms.value.clear()
}

const handleEntrySelected = (entry: LeaderboardEntry) => {
  selectedEntryId.value = entry.id

  bestDistance.value = entry.performance.distance
  runtime.value = entry.performance.runtime
  reads.value = entry.performance.reads
  writes.value = entry.performance.writes

  const edges: Edge[] = []
  for (let i = 0; i < entry.path.length; i++) {
    const current = entry.path[i]
    const next = entry.path[i + 1]
    if (current && next) {
      edges.push({ id: i, from: current, to: next })
    }
  }
  graph.value.edges = edges
}
</script>

<template>
  <main>
    <div class="mb-4 flex gap-2 items-end flex-wrap">
      <label class="input">
        <span class="label">Number of nodes</span>
        <input
          v-model.number="nodeCount"
          type="number"
          min="1"
          max="5000"
          :disabled="isAnyRunning"
        />
      </label>
      <button class="btn btn-primary" :disabled="isAnyRunning" @click="generateRandomGraph">
        Generate random graph with N nodes
      </button>
      <button class="btn btn-error" :disabled="isAnyRunning" @click="clearGraph">
        Clear graph
      </button>
      <button
        class="btn btn-secondary"
        :disabled="isAnyRunning || graph.nodes.length === 0"
        @click="runAllAlgorithms"
      >
        Run All Algorithms
      </button>
      <button
        v-if="isAnyRunning"
        class="btn btn-error"
        @click="cancelAllAlgorithms"
      >
        Cancel All ({{ runningAlgorithms.size + (isRunning ? 1 : 0) }} running)
      </button>
    </div>
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-8">
        <NodeCanvas
          ref="nodeCanvasRef"
          :graph="graph"
          @add-node="handleAddNode"
          @update-node="handleUpdateNode"
          @delete-node="handleDeleteNode"
        />
      </div>
      <div class="col-span-4">
        <PerformanceStats
          :best-distance="bestDistance"
          :runtime="runtime"
          :reads="reads"
          :writes="writes"
          :is-running="isAnyRunning"
          :error="runnerError"
          @algorithm-selected="onAlgorithmSelected"
          @config-changed="onConfigChanged"
          @timeout-changed="onTimeoutChanged"
          @run-algorithm="runAlgorithm"
          @cancel-algorithm="cancelAlgorithm"
        />
        <Leaderboard
          :entries="leaderboardEntries"
          :selected-entry-id="selectedEntryId"
          :is-running="isAnyRunning"
          @select-entry="handleEntrySelected"
        />
      </div>
    </div>
  </main>
</template>

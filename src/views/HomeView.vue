<script setup lang="ts">
import NodeCanvas from '../components/NodeCanvas.vue'
import PerformanceStats from '../components/PerformanceStats.vue'
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { Algorithm, Edge, Graph, Node } from '../types/tsp'

const selectedAlgorithm = ref<Algorithm | null>(null)
const bestDistance = ref<number | undefined>(undefined)
const runtime = ref<number | undefined>(undefined)
const reads = ref<number | undefined>(undefined)
const writes = ref<number | undefined>(undefined)

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
})

const resetPerformanceStats = () => {
  bestDistance.value = undefined
  runtime.value = undefined
  reads.value = undefined
  writes.value = undefined
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
}

const clearGraph = () => {
  graph.value.nodes = []
  graph.value.edges = []
  resetPerformanceStats()
}

const onAlgorithmSelected = (algorithm: Algorithm) => {
  selectedAlgorithm.value = algorithm
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

const runAlgorithm = () => {
  if (!selectedAlgorithm.value) {
    return
  }

  const result = selectedAlgorithm.value.solve(graph.value)

  bestDistance.value = result.performance.distance
  runtime.value = result.performance.runtime
  reads.value = result.performance.reads
  writes.value = result.performance.writes
  const edges: Edge[] = []
  for (let i = 0; i < result.path.length; i++) {
    const current = result.path[i]
    const next = result.path[i + 1]
    if (current && next) {
      edges.push({ id: i, from: current, to: next })
    }
  }
  graph.value.edges = edges
}
</script>

<template>
  <main>
    <div class="mb-4 flex gap-2 items-end">
      <label class="input">
        <span class="label">Number of nodes</span>
        <input v-model.number="nodeCount" type="number" min="1" max="5000" />
      </label>
      <button class="btn btn-primary" @click="generateRandomGraph">
        Generate random graph with N nodes
      </button>
      <button class="btn btn-error" @click="clearGraph">Clear graph</button>
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
          @algorithm-selected="onAlgorithmSelected"
          @run-algorithm="runAlgorithm"
        />
      </div>
    </div>
  </main>
</template>

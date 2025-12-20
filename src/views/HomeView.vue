<script setup lang="ts">
import NodeCanvas from '../components/NodeCanvas.vue'
import PerformanceStats from '../components/PerformanceStats.vue'
import { ref } from 'vue'
import type { Algorithm, Graph } from '../types/tsp'

const selectedAlgorithm = ref<Algorithm | null>(null)
const bestDistance = ref<number | undefined>(undefined)
const runtime = ref<number | undefined>(undefined)
const reads = ref<number | undefined>(undefined)
const writes = ref<number | undefined>(undefined)

// Sample graph for testing - this will be replaced with actual graph from NodeCanvas
const sampleGraph: Graph = {
  nodes: [
    { id: 1, x: 100, y: 100 },
    { id: 2, x: 200, y: 150 },
    { id: 3, x: 150, y: 200 },
    { id: 4, x: 50, y: 150 },
  ],
  edges: [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 1 },
  ],
}

const onAlgorithmSelected = (algorithm: Algorithm) => {
  selectedAlgorithm.value = algorithm
}

const runAlgorithm = () => {
  if (!selectedAlgorithm.value) {
    return
  }

  const result = selectedAlgorithm.value.solve(sampleGraph)

  bestDistance.value = result.performance.distance
  runtime.value = result.performance.runtime
  reads.value = result.performance.reads
  writes.value = result.performance.writes
}
</script>

<template>
  <main>
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-8">
        <NodeCanvas />
      </div>
      <div class="col-span-4">
        <PerformanceStats
          :best-distance="bestDistance"
          :runtime="runtime"
          :reads="reads"
          :writes="writes"
          @algorithm-selected="onAlgorithmSelected"
        />
        <button class="btn btn-primary mt-4" @click="runAlgorithm">Run Algorithm</button>
      </div>
    </div>
  </main>
</template>

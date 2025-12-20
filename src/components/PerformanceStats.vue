<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAlgorithmNames, getAlgorithm } from '../algorithms'
import type { Algorithm } from '../types/tsp'

const { bestDistance, runtime, reads, writes } = defineProps<{
  bestDistance?: number
  runtime?: number
  reads?: number
  writes?: number
}>()

const emit = defineEmits<{
  'algorithm-selected': [algorithm: Algorithm]
  'run-algorithm': []
}>()

const algorithmNames = ref<string[]>([])
const selectedAlgorithmName = ref<string>('')

onMounted(() => {
  algorithmNames.value = getAlgorithmNames()
  if (algorithmNames.value.length > 0) {
    const firstAlgorithm = algorithmNames.value[0]
    if (firstAlgorithm) {
      selectedAlgorithmName.value = firstAlgorithm
      const algorithm = getAlgorithm(firstAlgorithm)
      if (algorithm) {
        emit('algorithm-selected', algorithm)
      }
    }
  }
})

const onAlgorithmChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  selectedAlgorithmName.value = target.value
  const algorithm = getAlgorithm(target.value)
  if (algorithm) {
    emit('algorithm-selected', algorithm)
  }
}
</script>
<template>
  <div class="card card-border border-2 border-base-300">
    <div class="card-body">
      <h2 class="card-title text-lg font-bold mb-2">Algorithm performance stats</h2>
      <label class="select">
        <span class="label">Algorithm</span>
        <select v-model="selectedAlgorithmName" @change="onAlgorithmChange">
          <option v-for="name in algorithmNames" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </label>
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full border-2 border-base-300">
          <tbody>
            <tr>
              <td class="font-bold">Best distance</td>
              <td>{{ bestDistance || 'N/A' }}</td>
            </tr>
            <tr>
              <td class="font-bold">Runtime</td>
              <td>{{ runtime || 'N/A' }} ms</td>
            </tr>
            <tr>
              <td class="font-bold">Reads</td>
              <td>{{ reads || 'N/A' }}</td>
            </tr>
            <tr>
              <td class="font-bold">Writes</td>
              <td>{{ writes || 'N/A' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-actions justify-center mt-4">
        <button class="btn btn-primary" @click="emit('run-algorithm')">Run Algorithm</button>
      </div>
    </div>
  </div>
</template>

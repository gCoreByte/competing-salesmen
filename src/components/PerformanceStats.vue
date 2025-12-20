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
      <div class="form-control w-full mb-4">
        <label class="label">
          <span class="label-text font-bold">Algorithm:</span>
        </label>
        <select
          v-if="algorithmNames.length > 0"
          v-model="selectedAlgorithmName"
          class="select select-bordered w-full"
          @change="onAlgorithmChange"
        >
          <option v-for="name in algorithmNames" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
        <p v-else class="text-sm text-gray-500">No algorithms available</p>
      </div>
      <p class="card-text">
        <span class="font-bold">Best distance:</span> {{ bestDistance || 'N/A' }}
      </p>
      <p class="card-text"><span class="font-bold">Runtime:</span> {{ runtime || 'N/A' }} ms</p>
      <p class="card-text"><span class="font-bold">Reads:</span> {{ reads || 'N/A' }}</p>
      <p class="card-text"><span class="font-bold">Writes:</span> {{ writes || 'N/A' }}</p>
    </div>
  </div>
</template>

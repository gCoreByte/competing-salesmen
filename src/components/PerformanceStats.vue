<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getAlgorithmNames, getAlgorithm } from '../algorithms'
import type { Algorithm, AlgorithmConfig } from '../types/tsp'

const { bestDistance, runtime, reads, writes } = defineProps<{
  bestDistance?: number
  runtime?: number
  reads?: number
  writes?: number
}>()

const emit = defineEmits<{
  'algorithm-selected': [algorithm: Algorithm]
  'config-changed': [config: AlgorithmConfig]
  'run-algorithm': []
}>()

const algorithmNames = ref<string[]>([])
const selectedAlgorithmName = ref<string>('')
const algorithmConfig = ref<AlgorithmConfig>({})

const selectedAlgorithm = computed(() => {
  return getAlgorithm(selectedAlgorithmName.value)
})

const initializeConfig = (algorithm: Algorithm | undefined) => {
  if (!algorithm?.configOptions) {
    algorithmConfig.value = {}
    return
  }

  const newConfig: AlgorithmConfig = {}
  for (const option of algorithm.configOptions) {
    newConfig[option.key] = option.default
  }
  algorithmConfig.value = newConfig
  emit('config-changed', algorithmConfig.value)
}

onMounted(() => {
  algorithmNames.value = getAlgorithmNames()
  if (algorithmNames.value.length > 0) {
    const firstAlgorithm = algorithmNames.value[0]
    if (firstAlgorithm) {
      selectedAlgorithmName.value = firstAlgorithm
      const algorithm = getAlgorithm(firstAlgorithm)
      if (algorithm) {
        emit('algorithm-selected', algorithm)
        initializeConfig(algorithm)
      }
    }
  }
})

watch(selectedAlgorithm, (newAlgorithm) => {
  initializeConfig(newAlgorithm)
})

const onAlgorithmChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  selectedAlgorithmName.value = target.value
  const algorithm = getAlgorithm(target.value)
  if (algorithm) {
    emit('algorithm-selected', algorithm)
  }
}

const onConfigChange = (key: string, value: number | string) => {
  algorithmConfig.value[key] = value
  emit('config-changed', algorithmConfig.value)
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
      <template v-if="selectedAlgorithm?.configOptions">
        <div v-for="option in selectedAlgorithm.configOptions" :key="option.key" class="mt-2">
          <label v-if="option.type === 'number'" class="input">
            <span class="label">{{ option.label }}</span>
            <input
              type="number"
              :value="algorithmConfig[option.key]"
              :min="option.min"
              :max="option.max"
              @input="onConfigChange(option.key, Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label v-else-if="option.type === 'select'" class="select">
            <span class="label">{{ option.label }}</span>
            <select
              :value="algorithmConfig[option.key]"
              @change="onConfigChange(option.key, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in option.options" :key="String(opt.value)" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
        </div>
      </template>
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full border-2 border-base-300">
          <tbody>
            <tr>
              <td class="font-bold">Best distance</td>
              <td>{{ bestDistance?.toFixed(4) || 'N/A' }}</td>
            </tr>
            <tr>
              <td class="font-bold">Runtime</td>
              <td>{{ runtime?.toFixed(1) || 'N/A' }} ms</td>
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

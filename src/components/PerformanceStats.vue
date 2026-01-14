<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getAlgorithmNames, getAlgorithm } from '../algorithms'
import type { Algorithm, AlgorithmConfig } from '../types/tsp'

const props = defineProps<{
  bestDistance?: number
  runtime?: number
  reads?: number
  writes?: number
  isRunning?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'algorithm-selected': [key: string, algorithm: Algorithm]
  'config-changed': [config: AlgorithmConfig]
  'timeout-changed': [timeout: number]
  'run-algorithm': []
  'cancel-algorithm': []
}>()

const algorithmNames = ref<string[]>([])
const selectedAlgorithmName = ref<string>('')
const algorithmConfig = ref<AlgorithmConfig>({})
const timeoutSeconds = ref<number>(30)

const selectedAlgorithm = computed(() => {
  return getAlgorithm(selectedAlgorithmName.value)
})

const timeoutMs = computed(() => timeoutSeconds.value * 1000)

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
    const firstAlgorithmKey = algorithmNames.value[0]
    if (firstAlgorithmKey) {
      selectedAlgorithmName.value = firstAlgorithmKey
      const algorithm = getAlgorithm(firstAlgorithmKey)
      if (algorithm) {
        emit('algorithm-selected', firstAlgorithmKey, algorithm)
        initializeConfig(algorithm)
      }
    }
  }
  emit('timeout-changed', timeoutMs.value)
})

watch(selectedAlgorithm, (newAlgorithm) => {
  initializeConfig(newAlgorithm)
})

watch(timeoutMs, (newTimeout) => {
  emit('timeout-changed', newTimeout)
})

const onAlgorithmChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const key = target.value
  selectedAlgorithmName.value = key
  const algorithm = getAlgorithm(key)
  if (algorithm) {
    emit('algorithm-selected', key, algorithm)
  }
}

const onConfigChange = (key: string, value: number | string) => {
  algorithmConfig.value[key] = value
  emit('config-changed', algorithmConfig.value)
}

const handleRun = () => {
  if (!props.isRunning) {
    emit('run-algorithm')
  }
}

const handleCancel = () => {
  if (props.isRunning) {
    emit('cancel-algorithm')
  }
}
</script>
<template>
  <div class="card card-border border-2 border-base-300">
    <div class="card-body">
      <h2 class="card-title text-lg font-bold mb-2">Algorithm performance stats</h2>
      <label class="select">
        <span class="label">Algorithm</span>
        <select
          v-model="selectedAlgorithmName"
          :disabled="isRunning"
          @change="onAlgorithmChange"
        >
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
              :disabled="isRunning"
              @input="onConfigChange(option.key, Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label v-else-if="option.type === 'select'" class="select">
            <span class="label">{{ option.label }}</span>
            <select
              :value="algorithmConfig[option.key]"
              :disabled="isRunning"
              @change="onConfigChange(option.key, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in option.options" :key="String(opt.value)" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
        </div>
      </template>
      <label class="input mt-2">
        <span class="label">Timeout (seconds, 0 = none)</span>
        <input
          v-model.number="timeoutSeconds"
          type="number"
          min="0"
          max="3600"
          :disabled="isRunning"
        />
      </label>
      <div v-if="error" class="alert alert-error mt-2">
        <span>{{ error }}</span>
      </div>
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
      <div class="card-actions justify-center mt-4 gap-2">
        <button
          v-if="!isRunning"
          class="btn btn-primary"
          @click="handleRun"
        >
          Run Algorithm
        </button>
        <button
          v-else
          class="btn btn-primary"
          disabled
        >
          <span class="loading loading-spinner loading-sm"></span>
          Running...
        </button>
        <button
          v-if="isRunning"
          class="btn btn-error"
          @click="handleCancel"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

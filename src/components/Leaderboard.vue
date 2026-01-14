<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LeaderboardEntry } from '../types/tsp'

const props = defineProps<{
  entries: LeaderboardEntry[]
  selectedEntryId?: number | null
  isRunning?: boolean
}>()

const emit = defineEmits<{
  'select-entry': [entry: LeaderboardEntry]
}>()

type SortKey = 'distance' | 'runtime' | 'reads' | 'writes'
type SortDirection = 'asc' | 'desc'

const sortKey = ref<SortKey>('distance')
const sortDirection = ref<SortDirection>('asc')

const sortedEntries = computed(() => {
  const sorted = [...props.entries].sort((a, b) => {
    const aVal = a.performance[sortKey.value]
    const bVal = b.performance[sortKey.value]
    return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
  })
  return sorted
})

const handleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}

const getSortIcon = (key: SortKey) => {
  if (sortKey.value !== key) return '↕'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

const isActiveSort = (key: SortKey) => sortKey.value === key

const handleRowClick = (entry: LeaderboardEntry) => {
  if (!props.isRunning) {
    emit('select-entry', entry)
  }
}
</script>

<template>
  <div class="card card-border border-2 border-base-300 mt-4">
    <div class="card-body">
      <h2 class="card-title text-lg font-bold mb-2">Leaderboard</h2>
      <div v-if="entries.length === 0" class="text-base-content/60 text-center py-4">
        No runs yet. Run an algorithm to see results here.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="table table-zebra w-full border-2 border-base-300 table-sm">
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th>Algorithm</th>
              <th
                class="cursor-pointer select-none hover:bg-base-200 transition-colors"
                :class="{ 'bg-base-200': isActiveSort('distance') }"
                @click="handleSort('distance')"
              >
                <span class="flex items-center gap-1">
                  Distance
                  <span class="text-xs opacity-70">{{ getSortIcon('distance') }}</span>
                </span>
              </th>
              <th
                class="cursor-pointer select-none hover:bg-base-200 transition-colors"
                :class="{ 'bg-base-200': isActiveSort('runtime') }"
                @click="handleSort('runtime')"
              >
                <span class="flex items-center gap-1">
                  Runtime
                  <span class="text-xs opacity-70">{{ getSortIcon('runtime') }}</span>
                </span>
              </th>
              <th
                class="cursor-pointer select-none hover:bg-base-200 transition-colors"
                :class="{ 'bg-base-200': isActiveSort('reads') }"
                @click="handleSort('reads')"
              >
                <span class="flex items-center gap-1">
                  Reads
                  <span class="text-xs opacity-70">{{ getSortIcon('reads') }}</span>
                </span>
              </th>
              <th
                class="cursor-pointer select-none hover:bg-base-200 transition-colors"
                :class="{ 'bg-base-200': isActiveSort('writes') }"
                @click="handleSort('writes')"
              >
                <span class="flex items-center gap-1">
                  Writes
                  <span class="text-xs opacity-70">{{ getSortIcon('writes') }}</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(entry, index) in sortedEntries"
              :key="entry.id"
              class="cursor-pointer hover:bg-primary/10 transition-colors"
              :class="{
                'bg-primary/20 hover:bg-primary/25': selectedEntryId === entry.id,
                'opacity-50 cursor-not-allowed': isRunning,
              }"
              @click="handleRowClick(entry)"
            >
              <td class="text-center font-mono">{{ index + 1 }}</td>
              <td class="font-medium">{{ entry.algorithmName }}</td>
              <td class="font-mono">{{ entry.performance.distance.toFixed(2) }}</td>
              <td class="font-mono">{{ entry.performance.runtime.toFixed(1) }} ms</td>
              <td class="font-mono">{{ entry.performance.reads }}</td>
              <td class="font-mono">{{ entry.performance.writes }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

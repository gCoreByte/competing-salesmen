<script setup lang="ts">
import { ref } from 'vue'
import type { Graph, Node } from '../types/tsp'
import NodeEditModal from './NodeEditModal.vue'

const { graph } = defineProps<{
  graph: Graph
}>()

const emit = defineEmits<{
  (e: 'addNode', node: Node): void
  (e: 'updateNode', node: Node): void
  (e: 'deleteNode', nodeId: number): void
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const selectedNode = ref<Node | null>(null)
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const nodeStartPos = ref({ x: 0, y: 0 })
const editingNode = ref<Node | null>(null)
const hasDragged = ref(false)

const getCanvasDimensions = () => {
  if (!svgRef.value) return { width: 600, height: 600 }
  return {
    width: svgRef.value.clientWidth || svgRef.value.getBoundingClientRect().width,
    height: svgRef.value.clientHeight || svgRef.value.getBoundingClientRect().height,
  }
}

defineExpose({
  getCanvasDimensions,
  svgRef,
})

const getNextNodeId = () => {
  if (graph.nodes.length === 0) return 1
  return Math.max(...graph.nodes.map((n) => n.id)) + 1
}

const getSvgCoordinates = (event: MouseEvent, svg: SVGSVGElement) => {
  const rect = svg.getBoundingClientRect()
  const point = svg.createSVGPoint()
  point.x = event.clientX - rect.left
  point.y = event.clientY - rect.top
  return { x: point.x, y: point.y }
}

const handleSvgClick = (event: MouseEvent) => {
  // don't add node if we just finished dragging
  if (hasDragged.value) {
    hasDragged.value = false
    return
  }

  const target = event.target as HTMLElement
  if (target.tagName === 'circle' || target.closest('g[data-node-id]')) {
    return
  }

  const svg = event.currentTarget as SVGSVGElement
  const coords = getSvgCoordinates(event, svg)

  emit('addNode', {
    id: getNextNodeId(),
    x: coords.x,
    y: coords.y,
  })
}

const handleNodeClick = (event: MouseEvent, node: Node) => {
  event.stopPropagation()
  // open modal only if we didn't just drag
  if (!hasDragged.value && !isDragging.value) {
    selectedNode.value = node
    editingNode.value = { ...node }
  }
}

const handleNodeMouseDown = (event: MouseEvent, node: Node) => {
  event.stopPropagation()
  isDragging.value = true
  hasDragged.value = false
  selectedNode.value = node
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  nodeStartPos.value = { x: node.x, y: node.y }
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !selectedNode.value || !svgRef.value) return

  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y

  // significant movement only
  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    hasDragged.value = true
  }

  const svg = svgRef.value
  const newX = Math.max(0, Math.min(svg.clientWidth, nodeStartPos.value.x + deltaX))
  const newY = Math.max(0, Math.min(svg.clientHeight, nodeStartPos.value.y + deltaY))

  const updatedNode = {
    ...selectedNode.value,
    x: newX,
    y: newY,
  }

  emit('updateNode', updatedNode)
}

const handleMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false
  }
}

const handleModalUpdate = (node: Node) => {
  emit('updateNode', node)
}

const handleModalDelete = (nodeId: number) => {
  emit('deleteNode', nodeId)
}

const handleModalClose = () => {
  editingNode.value = null
  selectedNode.value = null
}
</script>
<template>
  <div class="border border-gray-300 rounded-md relative">
    <svg
      ref="svgRef"
      width="100%"
      height="600"
      @click="handleSvgClick"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <!-- Edges first so they appear behind nodes -->
      <g v-for="edge in graph.edges" :key="edge.id">
        <line
          :x1="edge.from.x"
          :y1="edge.from.y"
          :x2="edge.to.x"
          :y2="edge.to.y"
          stroke="black"
          stroke-width="2"
        />
      </g>
      <!-- Nodes -->
      <g
        v-for="node in graph.nodes"
        :key="node.id"
        :data-node-id="node.id"
        :transform="`translate(${node.x}, ${node.y})`"
      >
        <circle
          :cx="0"
          :cy="0"
          r="20"
          :class="[
            'cursor-move hover:fill-blue-400 transition-colors',
            selectedNode?.id === node.id ? 'fill-blue-500' : 'fill-gray-400',
          ]"
          @click="handleNodeClick($event, node)"
          @mousedown="handleNodeMouseDown($event, node)"
        />
        <text
          :x="0"
          :y="0"
          text-anchor="middle"
          dominant-baseline="central"
          class="pointer-events-none select-none text-xs font-bold fill-white"
        >
          {{ node.id }}
        </text>
      </g>
    </svg>

    <NodeEditModal
      :node="editingNode"
      @update="handleModalUpdate"
      @delete="handleModalDelete"
      @close="handleModalClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Node } from '../types/tsp'

const props = defineProps<{
  node: Node | null
}>()

const emit = defineEmits<{
  (e: 'update', node: Node): void
  (e: 'delete', nodeId: number): void
  (e: 'close'): void
}>()

const modalRef = ref<HTMLDialogElement | null>(null)
const editX = ref(0)
const editY = ref(0)

watch(
  () => props.node,
  (newNode) => {
    if (newNode) {
      editX.value = newNode.x
      editY.value = newNode.y
      if (modalRef.value) {
        modalRef.value.showModal()
      }
    } else {
      if (modalRef.value) {
        modalRef.value.close()
      }
    }
  },
  { immediate: true },
)

const saveNodeEdit = () => {
  if (props.node) {
    const updatedNode = {
      ...props.node,
      x: editX.value,
      y: editY.value,
    }
    emit('update', updatedNode)
    closeModal()
  }
}

const closeModal = () => {
  if (modalRef.value) {
    modalRef.value.close()
  }
  emit('close')
}

const deleteNode = () => {
  if (props.node) {
    emit('delete', props.node.id)
    closeModal()
  }
}
</script>

<template>
  <dialog ref="modalRef" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Edit Node</h3>
      <div v-if="node" class="space-y-4">
        <div>
          <label class="label">
            <span class="label-text">Node ID</span>
          </label>
          <input type="number" :value="node.id" disabled class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">X Position</span>
          </label>
          <input v-model.number="editX" type="number" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Y Position</span>
          </label>
          <input v-model.number="editY" type="number" class="input input-bordered w-full" />
        </div>
      </div>
      <div class="modal-action">
        <button class="btn btn-error" @click="deleteNode">Delete</button>
        <button class="btn btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn btn-primary" @click="saveNodeEdit">Save</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>

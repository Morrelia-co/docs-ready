<script setup>
import { ref } from 'vue'
import { useDocs } from '../../composables/useDocs'

defineProps({ id: { type: String, required: true }, label: { type: String, required: true }, accept: String, help: String, error: String, buttonLabel: String, disabled: Boolean })
const emit = defineEmits(['pick'])
const { t } = useDocs()
const input = ref(null)

function onChange(e) {
  const files = [...e.target.files]
  e.target.value = '' // allows choosing the same file again after fixing it
  if (files[0]) emit('pick', files[0])
}
</script>

<template>
  <div>
    <p :id="id + '-label'" class="field-label">{{ label }}</p>
    <input :id="id" ref="input" type="file" class="peer sr-only" :accept="accept" :disabled="disabled" :aria-describedby="[help && id + '-help', error && id + '-error'].filter(Boolean).join(' ') || undefined" @change="onChange" />
    <label :for="id" class="btn cursor-pointer peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)] peer-disabled:opacity-50">{{ buttonLabel || t('obChooseFile') }}</label>
    <p v-if="help" :id="id + '-help'" class="field-help">{{ help }}</p>
    <p v-if="error" :id="id + '-error'" class="field-error" role="alert">{{ error }}</p>
  </div>
</template>

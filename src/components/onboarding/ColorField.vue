<script setup>
import { ref, watch, computed } from 'vue'
import { normalizeHex } from '../../utils/color'
import { useDocs } from '../../composables/useDocs'

const props = defineProps({ id: String, label: String, modelValue: String, fallback: String, help: String })
const emit = defineEmits(['update:modelValue'])
const { t } = useDocs()

// The color picker needs a valid #rrggbb value; the text box keeps what the user types until it parses.
const effective = computed(() => normalizeHex(props.modelValue) || props.fallback)
const draft = ref(effective.value)
const invalid = computed(() => !normalizeHex(draft.value))
watch(effective, (v) => { if (normalizeHex(draft.value) !== v) draft.value = v })

function onText(e) {
  draft.value = e.target.value
  const hex = normalizeHex(draft.value)
  if (hex) emit('update:modelValue', hex)
}
const onPick = (e) => emit('update:modelValue', e.target.value)
</script>

<template>
  <div>
    <label class="field-label" :for="id">{{ label }}</label>
    <div class="flex items-center gap-2">
      <input :id="id + '-picker'" type="color" class="h-10 w-12 shrink-0 cursor-pointer rounded-ctl border border-line-strong bg-surface p-1" :value="effective" :aria-label="label" @input="onPick" />
      <input :id="id" type="text" class="input max-w-[8.5rem] font-mono" :value="draft" maxlength="7" spellcheck="false" autocomplete="off" :aria-invalid="invalid" :aria-describedby="[help && id + '-help', invalid && id + '-error'].filter(Boolean).join(' ') || undefined" @input="onText" />
      <button v-if="modelValue" type="button" class="rounded text-sm text-accent hover:underline" @click="emit('update:modelValue', null)">{{ t('obResetColors') }}</button>
    </div>
    <p v-if="help" :id="id + '-help'" class="field-help">{{ help }}</p>
    <p v-if="invalid" :id="id + '-error'" class="field-error" role="alert">{{ t('errHex') }}</p>
  </div>
</template>

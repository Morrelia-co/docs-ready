<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useDocs } from '../composables/useDocs'

const { languages, lang, t, switchTarget } = useDocs()
const open = ref(false)
const root = ref(null)

const onOutside = (e) => { if (root.value && !root.value.contains(e.target)) open.value = false }
const onKey = (e) => { if (e.key === 'Escape') open.value = false }
onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))
</script>

<template>
  <div v-if="languages.length > 1" ref="root" class="relative shrink-0" @keydown="onKey">
    <button
      type="button"
      class="icon-btn w-auto gap-1.5 px-2 text-sm"
      :aria-label="t('language')"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></svg>
      <span class="hidden sm:inline">{{ languages.find((l) => l.code === lang)?.label }}</span>
    </button>
    <ul v-if="open" class="absolute right-0 top-full z-50 mt-1 w-44 rounded-panel border border-line-strong bg-surface p-1 shadow-2xl">
      <li v-for="l in languages" :key="l.code">
        <router-link
          :to="switchTarget(l.code)"
          :lang="l.code"
          :hreflang="l.code"
          class="block rounded-ctl px-3 py-2 text-sm"
          :class="l.code === lang ? 'text-accent' : 'text-body hover:bg-surface-2 hover:text-fg'"
          :aria-current="l.code === lang ? 'true' : undefined"
          @click="open = false"
        >{{ l.label }}</router-link>
      </li>
    </ul>
  </div>
</template>

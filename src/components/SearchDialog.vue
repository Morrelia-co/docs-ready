<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSearch } from '../composables/useSearch'
import { useDocs } from '../composables/useDocs'

const { open, status, close, load, query } = useSearch()
const { lang, t } = useDocs()
const router = useRouter()
const q = ref('')
const results = ref([])
const active = ref(0)
const input = ref(null)
const list = ref(null)
let opener = null

watch([q, status, lang], () => { results.value = query(q.value, lang.value); active.value = 0 })
// Each language has its own index; load the one for the current language when search opens or the language changes.
watch(lang, () => open.value && load(lang.value))

watch(open, async (isOpen) => {
  document.documentElement.style.overflow = isOpen ? 'hidden' : ''
  if (isOpen) {
    load(lang.value)
    opener = document.activeElement
    q.value = ''
    await nextTick()
    input.value?.focus()
  } else {
    opener?.focus?.()
  }
})

function go(r) {
  close()
  router.push({ path: '/' + r.slug, hash: r.anchor ? '#' + r.anchor : '' })
}

async function move(d) {
  if (!results.value.length) return
  active.value = (active.value + d + results.value.length) % results.value.length
  await nextTick()
  list.value?.children[active.value]?.scrollIntoView({ block: 'nearest' })
}

function onKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); close() }
  else if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
  else if (e.key === 'Enter' && results.value[active.value]) { e.preventDefault(); go(results.value[active.value]) }
  else if (e.key === 'Tab') e.preventDefault() // keep focus in the input; results are navigated with arrow keys
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10vh]" @mousedown.self="close">
      <div role="dialog" aria-modal="true" :aria-label="t('searchButton')" class="w-full max-w-xl overflow-hidden rounded-panel border border-line-strong bg-surface shadow-2xl" @keydown="onKey">
        <div class="flex items-center gap-3 border-b border-line px-4 focus-within:border-accent">
          <svg class="shrink-0 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            ref="input" v-model="q" type="text" role="combobox" autocomplete="off" spellcheck="false"
            class="h-12 flex-1 bg-transparent text-fg outline-none placeholder:text-faint"
            :placeholder="t('searchButton')"
            :aria-label="t('searchButton')" aria-controls="search-results" aria-autocomplete="list"
            :aria-expanded="results.length > 0" :aria-activedescendant="results.length ? 'search-opt-' + active : undefined"
          />
          <kbd class="kbd">Esc</kbd>
        </div>
        <div class="max-h-[60vh] overflow-y-auto">
          <p v-if="status === 'error'" class="px-4 py-8 text-center text-sm text-muted">{{ t('searchError') }}</p>
          <p v-else-if="status === 'loading'" class="px-4 py-8 text-center text-sm text-muted">{{ t('searchLoading') }}</p>
          <p v-else-if="!q.trim()" class="px-4 py-8 text-center text-sm text-muted">{{ t('searchHint') }}</p>
          <p v-else-if="!results.length" class="px-4 py-8 text-center text-sm text-muted">{{ t('noResults', { q }) }}</p>
          <ul v-else id="search-results" ref="list" role="listbox" aria-label="Search results" class="p-2">
            <li v-for="(r, i) in results" :id="'search-opt-' + i" :key="r.id" role="option" :aria-selected="i === active">
              <a
                :href="'/' + r.slug + (r.anchor ? '#' + r.anchor : '')" tabindex="-1"
                class="block rounded-ctl border-l-2 px-3 py-2.5"
                :class="i === active ? 'border-accent bg-surface-2' : 'border-transparent'"
                @click.prevent="go(r)" @mousemove="active = i"
              >
                <span class="flex items-baseline justify-between gap-3">
                  <span class="truncate text-sm font-medium text-fg"><span v-html="r.title" /><template v-if="r.heading"> / <span v-html="r.heading" /></template></span>
                  <span class="shrink-0 text-xs text-faint">{{ r.category }}</span>
                </span>
                <span v-if="r.snippet" class="mt-1 line-clamp-2 block text-[0.8125rem] leading-snug text-muted" v-html="r.snippet" />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

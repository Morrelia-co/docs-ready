<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useDocs } from '../composables/useDocs'

const props = defineProps({ headings: { type: Array, default: () => [] }, ready: Boolean })
const { t } = useDocs()
const active = ref('')
let observer

function observe() {
  observer?.disconnect()
  if (!props.ready || !props.headings.length) return
  const visible = new Set()
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)
      const first = props.headings.find((h) => visible.has(h.id))
      if (first) active.value = first.id
    },
    { rootMargin: '-72px 0px -65% 0px' },
  )
  props.headings.forEach((h) => { const el = document.getElementById(h.id); if (el) observer.observe(el) })
  active.value = props.headings[0].id
}

watch(() => [props.headings, props.ready], async () => { await nextTick(); observe() }, { immediate: true, flush: 'post' })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <nav v-if="headings.length" :aria-label="t('onThisPage')">
    <p class="mb-3 text-sm font-semibold text-fg">{{ t('onThisPage') }}</p>
    <ul class="border-l border-line">
      <li v-for="h in headings" :key="h.id">
        <a
          :href="'#' + h.id"
          class="-ml-px block border-l py-1 text-[0.8125rem] leading-snug"
          :class="[h.level === 3 ? 'pl-7' : 'pl-4', active === h.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg']"
          :aria-current="active === h.id ? 'location' : undefined"
          @click="active = h.id"
        >{{ h.text }}</a>
      </li>
    </ul>
  </nav>
</template>

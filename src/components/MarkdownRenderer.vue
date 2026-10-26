<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { sanitize } from '../utils/sanitize'
import { useDocs } from '../composables/useDocs'

const props = defineProps({ html: { type: String, default: '' } })
const router = useRouter()
const { t } = useDocs()
const clean = computed(() => sanitize(props.html))

async function onClick(e) {
  const btn = e.target.closest('.copy-btn')
  if (btn) {
    const code = btn.closest('.code-block')?.querySelector('pre')?.textContent ?? ''
    try { await navigator.clipboard.writeText(code); btn.textContent = t('copied') } catch { btn.textContent = t('copyFailed') }
    setTimeout(() => (btn.textContent = t('copy')), 1600)
    return
  }
  // Internal links navigate client-side instead of reloading the page.
  const a = e.target.closest('a')
  const href = a?.getAttribute('href')
  if (a && href?.startsWith('/') && !href.startsWith('//') && !a.target && e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) {
    e.preventDefault()
    router.push(href)
  }
}
</script>

<template>
  <div class="prose-docs" @click="onClick" v-html="clean" />
</template>

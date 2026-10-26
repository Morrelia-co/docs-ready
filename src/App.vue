<script setup>
import { onMounted, onUnmounted } from 'vue'
import DocsLayout from './layouts/DocsLayout.vue'
import { useSearch } from './composables/useSearch'
import { navOpen, closeNav, site } from './composables/useDocs'

const { show } = useSearch()
const typing = (el) => el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
// "/" and Ctrl/Cmd+K only exist when both search and keyboard shortcuts are enabled. Escape (close drawer) always works.
const shortcuts = site.navigation.search && site.navigation.shortcuts

function onKey(e) {
  if (shortcuts && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); show() }
  else if (shortcuts && e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e.target)) { e.preventDefault(); show() }
  else if (e.key === 'Escape' && navOpen.value) closeNav()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <DocsLayout />
</template>

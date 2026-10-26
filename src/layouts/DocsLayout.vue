<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import TopNav from '../components/TopNav.vue'
import Sidebar from '../components/Sidebar.vue'
import SearchDialog from '../components/SearchDialog.vue'
import { useDocs, navOpen, closeNav, openSection } from '../composables/useDocs'

const route = useRoute()
const { current, lang, t, site } = useDocs()

// The layout preset only changes CSS variables (see tokens.css); the markup is the same for every preset.
document.documentElement.dataset.layout = site.layout

// Keep the current page's section expanded, and close the mobile drawer after navigating.
watch(() => current.value?.category, (c) => c && openSection(c), { immediate: true })
watch(() => route.path, closeNav)
watch(lang, (l) => (document.documentElement.lang = l), { immediate: true })
</script>

<template>
  <a href="#content" class="sr-only rounded bg-accent px-3 py-2 text-on-accent focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60]">{{ t('skip') }}</a>
  <TopNav />
  <div v-if="navOpen" class="fixed inset-0 top-14 z-30 bg-black/60 lg:hidden" aria-hidden="true" @click="closeNav" />
  <aside
    id="sidebar"
    class="fixed bottom-0 left-0 top-14 z-30 w-[var(--sidebar-w)] max-w-[85vw] overflow-y-auto border-r border-line bg-surface transition-transform lg:translate-x-0"
    :class="navOpen ? 'translate-x-0' : '-translate-x-full max-lg:invisible'"
  >
    <Sidebar />
  </aside>
  <div class="pt-14 lg:pl-[var(--sidebar-w)]">
    <router-view />
  </div>
  <SearchDialog v-if="site.navigation.search" />
</template>

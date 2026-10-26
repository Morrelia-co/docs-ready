<script setup>
import { computed } from 'vue'
import { useSearch } from '../composables/useSearch'
import LanguageSwitcher from './LanguageSwitcher.vue'
import { useDocs, navOpen, toggleNav } from '../composables/useDocs'

const { show } = useSearch()
const { info, home, t, site } = useDocs()
const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'
const logoSrc = computed(() => site.branding.logo && import.meta.env.BASE_URL + site.branding.logo)
const showTitle = computed(() => !logoSrc.value || site.branding.showTitle)
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-40 h-14 border-b border-line bg-bg">
    <div class="flex h-full items-center gap-3 px-3 sm:px-5">
      <button type="button" class="icon-btn lg:hidden" :aria-label="t('toggleNav')" aria-controls="sidebar" :aria-expanded="navOpen" @click="toggleNav">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      <router-link :to="home" class="flex shrink-0 items-center gap-2.5 rounded font-semibold text-fg" :aria-label="showTitle ? undefined : info.siteTitle">
        <img v-if="logoSrc" :src="logoSrc" alt="" class="h-7 w-auto max-w-[10rem] object-contain" />
        <img src="/512x512.png" alt="Docs-Ready Logo" class="h-7 w-auto max-w-[10rem] object-contain"/>
        <span v-if="showTitle" class="hidden sm:inline">{{ info.siteTitle }}</span>
      </router-link>
      <div class="flex flex-1 justify-center">
        <button
          v-if="site.navigation.search"
          type="button"
          class="flex h-9 w-full max-w-md items-center gap-2.5 rounded-ctl border border-line bg-surface px-3 text-sm text-muted hover:border-line-strong hover:text-fg"
          :aria-label="t('searchButton')"
          @click="show"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span class="flex-1 truncate text-left">{{ t('searchButton') }}</span>
          <span v-if="site.navigation.shortcuts" class="hidden items-center gap-1 sm:flex"><kbd class="kbd">/</kbd><kbd class="kbd">{{ mod }}K</kbd></span>
        </button>
      </div>
      <nav v-if="site.navigation.links.length" :aria-label="t('links')" class="hidden shrink-0 items-center gap-1 md:flex">
        <a v-for="l in site.navigation.links" :key="l.url" :href="l.url" target="_blank" rel="noopener noreferrer" class="rounded-ctl px-2.5 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg">{{ l.label }}</a>
      </nav>
      <LanguageSwitcher />
    </div>
  </header>
</template>

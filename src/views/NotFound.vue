<script setup>
import { useSearch } from '../composables/useSearch'
import { useDocs } from '../composables/useDocs'

const { show } = useSearch()
const { t, home, list, site } = useDocs()
</script>

<template>
  <div class="py-10">
    <h1 class="text-3xl font-semibold tracking-tight text-fg">{{ t('pageNotFound') }}</h1>
    <p class="mt-3 max-w-prose text-muted">{{ t('pageNotFoundBody') }}</p>
    <div class="mt-6 flex flex-wrap gap-3">
      <button v-if="site.navigation.search" type="button" class="rounded-ctl border border-line-strong px-4 py-2 text-sm text-fg hover:bg-surface-2" @click="show">{{ t('searchButton') }}</button>
      <router-link v-if="list[0]" :to="home" class="rounded-ctl border border-accent px-4 py-2 text-sm text-accent hover:bg-surface-2">{{ t('goTo', { title: list[0].title }) }}</router-link>
    </div>
  </div>
</template>

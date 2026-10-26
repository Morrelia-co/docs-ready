<script setup>
import { computed } from 'vue'
import { useDocs, isOpen, toggleSection } from '../composables/useDocs'

const props = defineProps({ section: { type: Object, required: true } })
const { current, site } = useDocs()
const collapsible = site.navigation.collapsibleSidebar
const open = computed(() => !collapsible || isOpen(props.section.title))
const listId = computed(() => 'nav-' + props.section.title.toLowerCase().replace(/\W+/g, '-'))
</script>

<template>
  <li>
    <button
      v-if="collapsible"
      type="button"
      class="flex w-full items-center justify-between rounded-ctl px-2 py-1.5 text-left text-sm font-semibold text-fg hover:bg-surface-2"
      :aria-expanded="open"
      :aria-controls="listId"
      @click="toggleSection(section.title)"
    >
      <span>{{ section.title }}</span>
      <svg class="text-faint transition-transform" :class="{ 'rotate-90': open }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
    </button>
    <p v-else class="px-2 py-1.5 text-sm font-semibold text-fg">{{ section.title }}</p>
    <ul v-show="open" :id="listId" class="mb-2 ml-2 mt-0.5">
      <li v-for="p in section.pages" :key="p.slug">
        <router-link
          :to="'/' + p.slug"
          class="block border-l py-[var(--nav-py)] pl-4 pr-2 text-sm"
          :class="current?.slug === p.slug ? 'border-accent text-accent' : 'border-line text-muted hover:border-line-strong hover:text-fg'"
          :aria-current="current?.slug === p.slug ? 'page' : undefined"
        >{{ p.title }}</router-link>
      </li>
    </ul>
  </li>
</template>

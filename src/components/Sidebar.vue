<script setup>
import { useRoute } from 'vue-router'
import SidebarItem from './SidebarItem.vue'
import { useDocs, onboardingPathFor } from '../composables/useDocs'

const { tree, t, site, lang, aboutPath } = useDocs()
const route = useRoute()
const wizard = __ONBOARDING__ && site.features.onboarding
</script>

<template>
  <nav :aria-label="t('docNav')" class="px-3 py-5">
    <router-link
      v-if="wizard"
      :to="onboardingPathFor(lang)"
      class="mb-3 flex items-center gap-2.5 rounded-ctl border px-2.5 py-2 text-sm font-semibold"
      :class="route.meta.onboarding ? 'border-accent text-accent' : 'border-line text-fg hover:border-line-strong hover:bg-surface-2'"
      :aria-current="route.meta.onboarding ? 'page' : undefined"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4 10-10" /></svg>
      {{ t('onboarding') }}
    </router-link>
    <ul class="space-y-1">
      <SidebarItem v-for="s in tree" :key="s.title" :section="s" />
    </ul>
    <div v-if="site.features.about || site.navigation.links.length" class="mt-4 space-y-0.5 border-t border-line pt-4 text-sm">
      <router-link
        v-if="site.features.about"
        :to="aboutPath"
        class="block rounded-ctl px-2 py-1.5"
        :class="route.meta.about ? 'text-accent' : 'text-muted hover:bg-surface-2 hover:text-fg'"
        :aria-current="route.meta.about ? 'page' : undefined"
      >{{ t('aboutLink') }}</router-link>
      <!-- The top bar hides these below the md breakpoint, so they are repeated here for the mobile drawer. -->
      <a v-for="l in site.navigation.links" :key="l.url" :href="l.url" target="_blank" rel="noopener noreferrer" class="block rounded-ctl px-2 py-1.5 text-muted hover:bg-surface-2 hover:text-fg md:hidden">{{ l.label }}</a>
    </div>
  </nav>
</template>

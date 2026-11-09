<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useDocs } from '../composables/useDocs'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'
import TableOfContents from '../components/TableOfContents.vue'
import NotFound from './NotFound.vue'

const route = useRoute()
const { current, prev, next, loaders, info, lang, t, site, home } = useDocs()
const nav = site.navigation
const html = ref('')
const ready = ref(false)
const failed = ref(false)
let token = 0

const fmt = (d) => new Date(d).toLocaleDateString(lang.value, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

function setMeta(title, description) {
  document.title = title ? `${title} · ${info.value.siteTitle}` : info.value.siteTitle
  document.querySelector('meta[name="description"]')?.setAttribute('content', description || info.value.siteDescription)
}

async function scrollToHash() {
  await nextTick()
  let id = route.hash.slice(1)
  try { id = decodeURIComponent(id) } catch { /* malformed escape such as #%E0%A4%A: use the raw value */ }
  if (id) document.getElementById(id)?.scrollIntoView()
}

watch(current, async (doc) => {
  const ticket = ++token
  ready.value = false
  failed.value = false
  if (!doc) { html.value = ''; setMeta(t('pageNotFound')); return }
  setMeta(doc.title, doc.description)
  try {
    const mod = await loaders[doc.slug]()
    if (ticket !== token) return
    html.value = mod.default
    ready.value = true
    scrollToHash()
  } catch {
    if (ticket === token) failed.value = true
  }
}, { immediate: true })

watch(() => route.hash, () => ready.value && scrollToHash())
</script>

<template>
  <div class="mx-auto flex max-w-[calc(var(--content-w)+24rem)] gap-12 px-5 sm:px-8 lg:px-12">
    <main id="content" class="min-w-0 flex-1 py-10 lg:max-w-[var(--content-w)]">
      <article v-if="current">
        <header class="mb-8">
          <nav v-if="nav.breadcrumbs" :aria-label="t('breadcrumb')" class="mb-2 text-sm text-muted">
            <ol class="flex flex-wrap items-center gap-x-2">
              <li><router-link :to="home" class="hover:text-fg hover:underline">{{ t('home') }}</router-link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{{ current.category }}</li>
            </ol>
          </nav>
          <h1 class="font-heading text-3xl font-semibold tracking-tight text-fg sm:text-[2.125rem] sm:leading-tight">{{ current.title }}</h1>
          <p v-if="current.description" class="mt-3 text-lg leading-snug text-muted">{{ current.description }}</p>
        </header>

        <p v-if="failed" class="rounded-panel border border-line bg-surface p-4 text-sm text-muted" role="alert">{{ t('loadFailed') }}</p>
        <p v-else-if="!ready" class="text-sm text-muted" role="status">{{ t('loading') }}</p>
        <MarkdownRenderer v-else :html="html" />

        <footer v-if="ready && (nav.editLink || (nav.lastUpdated && current.lastUpdated) || (nav.prevNext && (prev || next)))" class="mt-14 border-t border-line pt-6">
          <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <a v-if="nav.editLink" :href="current.editUrl" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">{{ t('editOnGitHub') }}</a>
            <span v-if="nav.lastUpdated && current.lastUpdated">{{ t('lastUpdated') }} <time :datetime="current.lastUpdated">{{ fmt(current.lastUpdated) }}</time></span>
          </div>
          <nav v-if="nav.prevNext && (prev || next)" :aria-label="t('pagination')" class="mt-8 grid gap-4 sm:grid-cols-2">
            <router-link v-if="prev" :to="'/' + prev.slug" class="rounded-panel border border-line p-4 hover:border-line-strong hover:bg-surface">
              <span class="block text-xs text-muted">{{ t('previous') }}</span>
              <span class="mt-1 block font-medium text-accent">{{ prev.title }}</span>
            </router-link>
            <router-link v-if="next" :to="'/' + next.slug" class="rounded-panel border border-line p-4 text-right hover:border-line-strong hover:bg-surface sm:col-start-2">
              <span class="block text-xs text-muted">{{ t('next') }}</span>
              <span class="mt-1 block font-medium text-accent">{{ next.title }}</span>
            </router-link>
          </nav>
        </footer>
      </article>
      <NotFound v-else />
    </main>
    <aside v-if="nav.toc" class="hidden w-56 shrink-0 xl:block" :aria-label="t('pageOutline')">
      <div class="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto py-10">
        <TableOfContents v-if="current" :headings="current.headings" :ready="ready" />
      </div>
    </aside>
  </div>
</template>

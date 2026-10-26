<script setup>
import { computed } from 'vue'
import { previewStyle } from '../../utils/theme'
import { stackFor } from '../../utils/fonts'
import { useDocs } from '../../composables/useDocs'

// Re-themes everything inside it by scoping the design tokens (CSS variables) to this element, so the preview uses the
// real portal styles (.prose-docs, utilities) rather than a separate imitation.
const props = defineProps({ tokens: { type: Object, required: true }, scheme: String, fonts: Object, compact: Boolean })
const { t } = useDocs()
const style = computed(() => {
  const f = props.fonts
  return {
    ...previewStyle(props.tokens, props.scheme),
    ...(f && {
      '--font-sans': stackFor(f.body, 'text', { preview: true }),
      '--font-heading': f.headings === 'body' ? 'var(--font-sans)' : stackFor(f.headings, 'text', { preview: true }),
      '--font-mono': stackFor(f.code, 'code', { preview: true }),
    }),
  }
})
</script>

<template>
  <div :style="style" class="overflow-hidden rounded-panel border border-line bg-bg font-sans text-fg" style="color-scheme: var(--scheme)">
    <!-- Compact: a miniature for theme cards -->
    <div v-if="compact" class="flex h-24" aria-hidden="true">
      <div class="w-1/4 space-y-1.5 border-r border-line bg-surface p-2"><div class="h-1.5 rounded bg-accent" /><div class="h-1.5 rounded bg-line-strong" /><div class="h-1.5 rounded bg-line-strong" /></div>
      <div class="flex-1 space-y-2 p-3">
        <div class="h-2.5 w-2/3 rounded bg-fg" /><div class="h-1.5 w-full rounded bg-muted" /><div class="h-1.5 w-5/6 rounded bg-muted" />
        <div class="flex gap-1.5 pt-1"><div class="h-4 w-10 rounded bg-accent" /><div class="h-4 w-4 rounded border border-line-strong" /></div>
      </div>
    </div>
    <!-- Full: a miniature docs page -->
    <div v-else class="flex min-h-[22rem]">
      <div class="hidden w-1/4 shrink-0 space-y-1 border-r border-line bg-surface p-3 text-sm sm:block">
        <p class="px-2 pb-1 font-semibold text-fg">{{ t('pvNav2') }}</p>
        <p class="border-l border-accent py-1 pl-3 text-accent">{{ t('pvNav1') }}</p>
        <p class="border-l border-line py-1 pl-3 text-muted">{{ t('pvNav2') }}</p>
        <p class="border-l border-line py-1 pl-3 text-muted">{{ t('pvNav3') }}</p>
      </div>
      <div class="min-w-0 flex-1 p-5">
        <p class="text-xs text-muted">{{ t('home') }} / {{ t('pvCrumb') }}</p>
        <p class="mb-3 mt-1 font-heading text-2xl font-semibold tracking-tight text-fg">{{ t('pvHeading') }}</p>
        <div class="prose-docs text-[0.9rem]">
          <p>{{ t('pvBodyStart') }} <a href="#preview" tabindex="-1" @click.prevent>{{ t('pvLink') }}</a> {{ t('pvBodyMid') }} <code>npm run dev</code>.</p>
          <ul><li>{{ t('pvItem1') }}</li><li>{{ t('pvItem2') }}</li></ul>
          <div class="callout callout-note" role="note"><p class="callout-title">{{ t('calloutNote') }}</p><p>{{ t('pvNote') }}</p></div>
          <div class="code-block"><div class="code-head"><span>bash</span><span class="copy-btn">{{ t('copy') }}</span></div><pre><code>npm install
npm run dev</code></pre></div>
          <div class="buttons"><p><a href="#preview" tabindex="-1" @click.prevent>{{ t('pvButton') }}</a></p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useDocs } from '../composables/useDocs'
import licenseText from '../../LICENSE?raw'

const { t, lang, info, site } = useDocs()
const about = site.about
const sample = () => t('aboutSample', { project: about.projectName, author: about.authorName, url: about.repoUrl })

watch(lang, () => {
  document.title = `${t('aboutTitle')} · ${info.value.siteTitle}`
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('aboutIntro'))
}, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-[calc(var(--content-w)+24rem)] px-5 sm:px-8 lg:px-12">
    <main id="content" class="py-10 lg:max-w-[var(--content-w)]">
      <header class="mb-8">
        <h1 class="font-heading text-3xl font-semibold tracking-tight text-fg sm:text-[2.125rem] sm:leading-tight">{{ t('aboutTitle') }}</h1>
        <p class="mt-3 text-lg leading-snug text-muted">{{ t('aboutIntro') }}</p>
      </header>
      <div class="prose-docs">
        <h2>{{ t('aboutFreeTitle') }}</h2>
        <p>{{ t('aboutFreeBody') }}</p>
        <h2>{{ t('aboutCreditTitle') }}</h2>
        <p>{{ t('aboutCreditBody') }}</p>
        <dl class="panel !p-0 divide-y divide-line">
          <div class="px-4 py-3"><dt class="text-sm text-muted">{{ t('aboutProject') }}</dt><dd class="text-fg">{{ about.projectName }}</dd></div>
          <div class="px-4 py-3"><dt class="text-sm text-muted">{{ t('aboutAuthor') }}</dt><dd class="text-fg">{{ about.authorName }}</dd></div>
          <div class="px-4 py-3"><dt class="text-sm text-muted">{{ t('aboutRepo') }}</dt><dd class="break-all text-fg">{{ about.repoUrl }}</dd></div>
        </dl>
        <h3>{{ t('aboutSampleTitle') }}</h3>
        <blockquote><p>{{ sample() }}</p></blockquote>
        <h2>{{ t('aboutLicenseTitle') }}</h2>
        <pre class="overflow-x-auto rounded-panel border border-line bg-surface p-4 font-mono text-[0.8125rem] leading-relaxed text-body whitespace-pre-wrap">{{ licenseText }}</pre>
      </div>
    </main>
  </div>
</template>

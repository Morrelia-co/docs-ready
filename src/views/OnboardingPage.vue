<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useDocs } from '../composables/useDocs'
import { form, wizard, useOnboardingForm } from '../composables/useOnboardingForm'
import { STEP_COUNT, validate, buildFiles, plannedPaths, parseSections, activeLinks, brandPaths, NAV_OPTIONS, LANGUAGES } from '../utils/onboarding'
import { resolveTheme, THEMES } from '../utils/theme'
import { FONT_OPTIONS } from '../utils/fonts'
import { formatBytes } from '../utils/assets'
import { createZip, downloadBlob } from '../utils/zip'
import { syncPreviewFonts } from '../utils/uploads'
import StepProject from '../components/onboarding/StepProject.vue'
import StepContent from '../components/onboarding/StepContent.vue'
import StepTheme from '../components/onboarding/StepTheme.vue'
import StepTypography from '../components/onboarding/StepTypography.vue'
import StepBranding from '../components/onboarding/StepBranding.vue'
import StepLayout from '../components/onboarding/StepLayout.vue'

const { t, lang, info, site } = useDocs()
useOnboardingForm({ name: info.value.siteTitle, description: info.value.siteDescription, lang: lang.value })

const STEPS = ['obStepProject', 'obStepContent', 'obStepTheme', 'obStepType', 'obStepBrand', 'obStepLayout', 'obStepReview']
const LAST = STEP_COUNT - 1
const COMPONENTS = [StepProject, StepContent, StepTheme, StepTypography, StepBranding, StepLayout]

const errors = ref({})
const attempted = ref(false)
const heading = ref(null)

watch(() => form.fonts.files, (files) => syncPreviewFonts(files), { deep: true, immediate: true })
watch(form, () => { if (attempted.value) errors.value = validate(wizard.step, form) }, { deep: true })
watch(lang, () => {
  document.title = `${t('onboarding')} · ${info.value.siteTitle}`
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('obIntro'))
}, { immediate: true })

const focusHeading = () => nextTick(() => heading.value?.focus())
function goTo(n) { wizard.step = n; attempted.value = false; errors.value = {}; focusHeading() }
function fail(n, e) {
  goTo(n); errors.value = e; attempted.value = true
  nextTick(() => document.getElementById('f-' + Object.keys(e)[0])?.focus())
}
function next() {
  const e = validate(wizard.step, form)
  if (Object.keys(e).length) return fail(wizard.step, e)
  wizard.maxStep = Math.max(wizard.maxStep, wizard.step + 1)
  goTo(wizard.step + 1)
}

async function finish() {
  for (let s = 0; s < LAST; s++) { const e = validate(s, form); if (Object.keys(e).length) return fail(s, e) }
  wizard.status = 'working'
  try {
    const source = (await import('virtual:project-source')).default // text of the portal itself, loaded only now
    const { folder, files, generated } = buildFiles(form, { source, about: site.about })
    const bytes = createZip(files.map((f) => ({ path: `${folder}/${f.path}`, content: f.content })))
    wizard.result = { name: `${folder}.zip`, folder, bytes, paths: generated, total: files.length }
    downloadBlob(wizard.result.name, bytes)
    wizard.status = 'done'
  } catch {
    wizard.status = 'error'
  }
  focusHeading()
}

function editChoices() { wizard.status = 'idle'; wizard.result = null; goTo(LAST) }
const submit = () => (wizard.step === LAST ? finish() : next())

// ----- review
const labelOf = (code) => LANGUAGES.find((l) => l.code === code)?.label
const fontName = (id, kind) => (id === 'body' ? t('obSameAsBody') : id.startsWith('up:') ? `${id.slice(3)} (${t('obUploaded')})` : FONT_OPTIONS[kind].flatMap((g) => g.options).find((o) => o.id === id)?.label)
const onOff = (v) => (v ? t('obEnabled') : t('obDisabled'))
const review = computed(() => {
  if (wizard.step !== LAST) return []
  const th = resolveTheme(form.theme)
  const { logo, favicon } = brandPaths(form)
  const links = activeLinks(form)
  return [
    { step: 0, title: t('obStepProject'), rows: [
      [t('obProjectName'), form.name.trim()], [t('obDescription'), form.description.trim() || t('obNone')],
      [t('obRepoUrl'), form.repoUrl.trim() || t('obNotSet')], [t('obBranch'), form.branch.trim()] ] },
    { step: 1, title: t('obStepContent'), rows: [
      [t('obDefaultLang'), labelOf(form.defaultLang)], [t('obExtraLangs'), form.extraLangs.map(labelOf).join(', ') || t('obNone')],
      [t('obSections'), parseSections(form.sections).join(', ')], [t('obStarter'), form.starterPages ? t('obYes') : t('obNo')] ] },
    { step: 2, title: t('obStepTheme'), rows: [
      [t('obStepTheme'), `${THEMES[form.theme.preset].label} (${th.scheme === 'dark' ? t('obDark') : t('obLight')})`],
      [t('obColors'), [th.tokens.accent, th.tokens.bg, th.tokens.fg]] ] },
    { step: 3, title: t('obStepType'), rows: [
      [t('obBodyFont'), fontName(form.fonts.body, 'text')], [t('obHeadingFont'), fontName(form.fonts.headings, 'text')], [t('obCodeFont'), fontName(form.fonts.code, 'code')],
      [t('obUploadFonts'), form.fonts.files.map((f) => `${f.name} (${formatBytes(f.size)})`).join(', ') || t('obNone')] ] },
    { step: 4, title: t('obStepBrand'), rows: [
      [t('obLogo'), logo ? `${form.branding.logo.name} → ${logo}` : t('obDefaultMark')], [t('obFavicon'), favicon ? favicon : t('obDefaultMark')],
      [t('obShowTitle'), onOff(form.branding.showTitle)] ] },
    { step: 5, title: t('obStepLayout'), rows: [
      [t('obLayoutTitle'), t('layout' + form.layout.charAt(0).toUpperCase() + form.layout.slice(1))],
      ...[...NAV_OPTIONS, 'about'].map((k) => [t('nav' + k.charAt(0).toUpperCase() + k.slice(1)), onOff(form.nav[k])]),
      [t('obLinksTitle'), links.map((l) => l.label).join(', ') || t('obNone')] ] },
  ]
})
const files = computed(() => (wizard.step === LAST ? plannedPaths(form) : []))
</script>

<template>
  <div class="mx-auto max-w-[calc(var(--content-w)+24rem)] px-5 sm:px-8 lg:px-12">
    <main id="content" class="py-10 lg:max-w-[var(--content-w)]">
      <header class="mb-8">
        <p class="mb-2 text-sm text-muted">{{ t('onboarding') }}</p>
        <h1 class="font-heading text-3xl font-semibold tracking-tight text-fg sm:text-[2.125rem] sm:leading-tight">{{ t('obTitle') }}</h1>
        <p class="mt-3 text-lg leading-snug text-muted">{{ t('obIntro') }}</p>
      </header>

      <!-- Success -->
      <section v-if="wizard.status === 'done'" class="panel" role="status">
        <div class="flex items-start gap-4">
          <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4 10-10" /></svg>
          </span>
          <div class="min-w-0">
            <h2 ref="heading" tabindex="-1" class="text-xl font-semibold text-fg outline-none">{{ t('obSuccessTitle') }}</h2>
            <p class="mt-1 text-muted">{{ t('obSuccessBody') }}</p>
            <p class="mt-3 break-all font-mono text-sm text-fg">{{ wizard.result.name }}</p>
          </div>
        </div>
        <p class="mb-2 mt-6 text-sm font-semibold text-fg">{{ t('obNextSteps') }}</p>
        <p class="text-sm text-muted">{{ t('obRunSteps') }}</p>
        <pre class="mt-2 overflow-x-auto rounded-ctl border border-line bg-bg p-3 font-mono text-[0.8125rem] text-body">cd {{ wizard.result.folder }}
npm install
npm run dev</pre>
        <p class="mb-2 mt-6 text-sm font-semibold text-fg">{{ t('obCustomFiles') }}</p>
        <ul class="max-h-56 overflow-y-auto rounded-ctl border border-line bg-bg p-3 font-mono text-[0.8125rem] leading-relaxed text-body">
          <li v-for="p in wizard.result.paths" :key="p" class="break-all">{{ p }}</li>
        </ul>
        <p class="field-help">{{ t('obPlusTemplate') }}</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <button type="button" class="btn btn-primary" @click="downloadBlob(wizard.result.name, wizard.result.bytes)">{{ t('obDownloadAgain') }}</button>
          <button type="button" class="btn" @click="editChoices">{{ t('obEditChoices') }}</button>
        </div>
      </section>

      <!-- Wizard -->
      <template v-else>
        <nav :aria-label="t('obSteps')">
          <ol class="flex items-center gap-1.5 sm:gap-2">
            <li v-for="(key, i) in STEPS" :key="key" class="flex items-center gap-1.5 sm:gap-2" :class="i < LAST ? 'flex-1' : ''">
              <button type="button" class="flex items-center gap-2 rounded-ctl py-1 text-sm disabled:cursor-default" :disabled="i > wizard.maxStep || i === wizard.step" :aria-current="i === wizard.step ? 'step' : undefined" :aria-label="`${i + 1}. ${t(key)}`" @click="goTo(i)">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold" :class="i === wizard.step ? 'border-accent bg-accent text-on-accent' : i < wizard.step ? 'border-accent text-accent' : 'border-line-strong text-muted'">{{ i + 1 }}</span>
                <span class="hidden xl:inline" :class="i === wizard.step ? 'text-fg' : 'text-muted'">{{ t(key) }}</span>
              </button>
              <span v-if="i < LAST" class="h-px flex-1 bg-line" aria-hidden="true" />
            </li>
          </ol>
        </nav>

        <form class="mt-8" novalidate @submit.prevent="submit">
          <p class="text-sm text-muted">{{ t('obStepOf', { n: wizard.step + 1, total: STEP_COUNT }) }}</p>
          <h2 ref="heading" tabindex="-1" class="mb-6 mt-1 font-heading text-2xl font-semibold tracking-tight text-fg outline-none">{{ t(STEPS[wizard.step]) }}</h2>

          <component :is="COMPONENTS[wizard.step]" v-if="wizard.step < LAST" :errors="errors" />

          <div v-else>
            <p class="mb-4 text-muted">{{ t('obReviewIntro') }}</p>
            <div class="space-y-4">
              <section v-for="g in review" :key="g.title" class="panel !p-0">
                <div class="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <h3 class="text-sm font-semibold text-fg">{{ g.title }}</h3>
                  <button type="button" class="rounded text-sm text-accent hover:underline" :aria-label="`${t('obEdit')}: ${g.title}`" @click="goTo(g.step)">{{ t('obEdit') }}</button>
                </div>
                <dl class="divide-y divide-line">
                  <div v-for="[label, value] in g.rows" :key="label" class="grid gap-1 px-4 py-2.5 sm:grid-cols-[12rem_1fr]">
                    <dt class="text-sm text-muted">{{ label }}</dt>
                    <dd class="break-words text-sm text-fg">
                      <span v-if="Array.isArray(value)" class="flex gap-2"><span v-for="c in value" :key="c" class="inline-flex items-center gap-1.5 font-mono text-xs"><span class="h-4 w-4 rounded border border-line-strong" :style="{ background: c }" aria-hidden="true" />{{ c }}</span></span>
                      <template v-else>{{ value }}</template>
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
            <p class="mb-2 mt-6 text-sm font-semibold text-fg">{{ t('obCustomFiles') }}</p>
            <ul class="max-h-56 overflow-y-auto rounded-ctl border border-line bg-surface p-3 font-mono text-[0.8125rem] leading-relaxed text-body">
              <li v-for="p in files" :key="p" class="break-all">{{ p }}</li>
            </ul>
            <p class="field-help">{{ t('obPlusTemplate') }}</p>
            <p v-if="wizard.status === 'error'" class="field-error mt-4" role="alert">{{ t('obError') }}</p>
          </div>

          <div class="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
            <button v-if="wizard.step > 0" type="button" class="btn" :disabled="wizard.status === 'working'" @click="goTo(wizard.step - 1)">{{ t('obBack') }}</button>
            <span v-else />
            <button type="submit" class="btn btn-primary" :disabled="wizard.status === 'working'">
              {{ wizard.step === LAST ? (wizard.status === 'working' ? t('obGenerating') : t('obFinish')) : t('obNext') }}
            </button>
          </div>
        </form>
      </template>
    </main>
  </div>
</template>

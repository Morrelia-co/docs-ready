<script setup>
import { computed } from 'vue'
import { form } from '../../composables/useOnboardingForm'
import { useDocs } from '../../composables/useDocs'
import { THEMES, resolveTheme, suggestAccent } from '../../utils/theme'
import ThemePreview from './ThemePreview.vue'
import ColorField from './ColorField.vue'

defineProps({ errors: { type: Object, default: () => ({}) } })
const { t } = useDocs()
const r = computed(() => resolveTheme(form.theme))
const accentCheck = computed(() => r.value.checks.find((c) => c.id === 'accent'))
const label = { text: 'obCheckText', accent: 'obCheckAccent', onAccent: 'obCheckOnAccent' }
const custom = computed(() => form.theme.primary || form.theme.bg || form.theme.fg)
const resetColors = () => Object.assign(form.theme, { primary: null, bg: null, fg: null })
</script>

<template>
  <div class="space-y-8">
    <p class="text-muted">{{ t('obThemeHelp') }}</p>

    <fieldset>
      <legend class="sr-only">{{ t('obStepTheme') }}</legend>
      <div class="grid gap-3 sm:grid-cols-2">
        <label v-for="(th, id) in THEMES" :key="id" class="relative block cursor-pointer">
          <input v-model="form.theme.preset" type="radio" name="theme" :value="id" class="peer sr-only" />
          <span class="block rounded-panel border border-line p-2 hover:border-line-strong peer-checked:border-accent peer-checked:ring-1 peer-checked:ring-[var(--color-accent)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)]">
            <ThemePreview compact :tokens="resolveTheme({ preset: id }).tokens" :scheme="th.scheme" />
            <span class="mt-2 flex items-baseline justify-between px-1">
              <span class="text-sm font-semibold text-fg">{{ th.label }}</span>
              <span class="text-xs text-muted">{{ th.scheme === 'dark' ? t('obDark') : t('obLight') }}</span>
            </span>
            <span class="block px-1 pb-1 text-[0.8125rem] leading-snug text-muted">{{ t('themeDesc_' + id) }}</span>
          </span>
        </label>
      </div>
    </fieldset>

    <div class="space-y-5">
      <ColorField id="f-primary" :label="t('obPrimary')" :help="t('obPrimaryHelp')" :model-value="form.theme.primary" :fallback="r.tokens.accent" @update:model-value="form.theme.primary = $event" />
      <details class="rounded-ctl border border-line px-4 py-3">
        <summary class="cursor-pointer text-sm font-medium text-fg">{{ t('obAdvanced') }}</summary>
        <div class="mt-4 grid gap-5 sm:grid-cols-2">
          <ColorField id="f-bg" :label="t('obBg')" :model-value="form.theme.bg" :fallback="r.tokens.bg" @update:model-value="form.theme.bg = $event" />
          <ColorField id="f-fg" :label="t('obFg')" :model-value="form.theme.fg" :fallback="r.tokens.fg" @update:model-value="form.theme.fg = $event" />
        </div>
      </details>
      <button v-if="custom" type="button" class="btn" @click="resetColors">{{ t('obResetColors') }}</button>
    </div>

    <section aria-labelledby="contrast-h">
      <h3 id="contrast-h" class="mb-2 text-sm font-semibold text-fg">{{ t('obContrast') }}</h3>
      <ul class="panel divide-y divide-line !p-0 text-sm">
        <li v-for="c in r.checks" :key="c.id" class="flex items-center justify-between gap-4 px-4 py-2.5">
          <span class="text-body">{{ t(label[c.id]) }}</span>
          <span class="flex items-center gap-2 font-mono text-xs" :class="c.ok ? 'text-muted' : 'text-[var(--color-danger)]'">
            {{ c.ratio.toFixed(1) }}:1 <span class="font-sans font-semibold">{{ c.ok ? '✓ ' + t('obPass') : '! ' + t('obLow') }}</span>
          </span>
        </li>
      </ul>
      <button v-if="!accentCheck.ok" type="button" class="btn mt-3" @click="form.theme.primary = suggestAccent(r.tokens)">{{ t('obAutoFix') }}</button>
      <p v-if="errors.contrast" id="e-contrast" class="field-error" role="alert">{{ t(errors.contrast) }}</p>
      <p class="field-help">{{ t('obThemeNote') }}</p>
    </section>

    <section aria-labelledby="preview-h">
      <h3 id="preview-h" class="mb-2 text-sm font-semibold text-fg">{{ t('obPreview') }}</h3>
      <ThemePreview :tokens="r.tokens" :scheme="r.scheme" :fonts="form.fonts" />
    </section>
  </div>
</template>

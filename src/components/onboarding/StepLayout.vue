<script setup>
import { computed } from 'vue'
import { form } from '../../composables/useOnboardingForm'
import { useDocs } from '../../composables/useDocs'
import { LAYOUTS, NAV_OPTIONS } from '../../utils/onboarding'

defineProps({ errors: { type: Object, default: () => ({}) } })
const { t } = useDocs()
const cap = (k) => k.charAt(0).toUpperCase() + k.slice(1)
const options = computed(() => [...NAV_OPTIONS, 'about'])
</script>

<template>
  <div class="space-y-10">
    <fieldset>
      <legend class="field-label">{{ t('obLayoutTitle') }}</legend>
      <div class="grid gap-3 sm:grid-cols-3">
        <label v-for="l in LAYOUTS" :key="l.id" class="relative block cursor-pointer">
          <input v-model="form.layout" type="radio" name="layout" :value="l.id" class="peer sr-only" />
          <span class="block rounded-panel border border-line p-2 hover:border-line-strong peer-checked:border-accent peer-checked:ring-1 peer-checked:ring-[var(--color-accent)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)]">
            <!-- Schematic: column widths are proportional to the real preset widths -->
            <span class="block overflow-hidden rounded border border-line-strong bg-bg" aria-hidden="true">
              <span class="block h-2.5 border-b border-line bg-surface" />
              <span class="grid h-20" :style="{ gridTemplateColumns: `${l.sidebar}fr ${l.content}fr ${form.nav.toc ? 14 : 0}fr` }">
                <span class="border-r border-line bg-surface p-1"><span class="mb-1 block h-1 rounded bg-accent" /><span class="block h-1 rounded bg-line-strong" /></span>
                <span class="p-1.5"><span class="mb-1 block h-1.5 w-2/3 rounded bg-fg" /><span class="mb-0.5 block h-1 rounded bg-muted" /><span class="block h-1 w-5/6 rounded bg-muted" /></span>
                <span v-if="form.nav.toc" class="border-l border-line p-1"><span class="block h-1 rounded bg-line-strong" /></span>
              </span>
            </span>
            <span class="mt-2 block px-1 text-sm font-semibold text-fg">{{ t('layout' + cap(l.id)) }}</span>
            <span class="block px-1 pb-1 text-[0.8125rem] leading-snug text-muted">{{ t('layout' + cap(l.id) + 'Help') }}</span>
          </span>
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend class="field-label">{{ t('obNavTitle') }}</legend>
      <p class="field-help mb-3 mt-0">{{ t('obNavHelp') }}</p>
      <div class="panel divide-y divide-line !p-0">
        <label v-for="k in options" :key="k" class="flex cursor-pointer items-start gap-3 px-4 py-3" :class="k === 'shortcuts' && !form.nav.search ? 'opacity-60' : ''">
          <input v-model="form.nav[k]" type="checkbox" class="mt-1 h-4 w-4 accent-[var(--color-accent)]" :disabled="k === 'shortcuts' && !form.nav.search" :aria-describedby="'nh-' + k" />
          <span class="text-sm text-fg">{{ t('nav' + cap(k)) }}<span :id="'nh-' + k" class="field-help mt-0.5 block">{{ t('nav' + cap(k) + 'Help') }}</span></span>
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend class="field-label">{{ t('obLinksTitle') }}</legend>
      <p class="field-help mb-3 mt-0">{{ t('obLinksHelp') }}</p>
      <div class="space-y-3">
        <div v-for="(l, i) in form.links" :key="i" class="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <div><label class="sr-only" :for="'ll-' + i">{{ t('obLinkLabel') }} {{ i + 1 }}</label><input :id="'ll-' + i" v-model="l.label" class="input" maxlength="24" :placeholder="t('obLinkLabel')" :aria-invalid="!!errors.links" /></div>
          <div><label class="sr-only" :for="'lu-' + i">{{ t('obLinkUrl') }} {{ i + 1 }}</label><input :id="'lu-' + i" v-model="l.url" class="input" type="url" placeholder="https://example.com" :aria-invalid="!!errors.links" /></div>
        </div>
      </div>
      <p v-if="errors.links" class="field-error" role="alert">{{ t(errors.links) }}</p>
    </fieldset>
  </div>
</template>

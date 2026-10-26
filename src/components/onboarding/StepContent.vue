<script setup>
import { watch } from 'vue'
import { form } from '../../composables/useOnboardingForm'
import { useDocs } from '../../composables/useDocs'
import { LANGUAGES } from '../../utils/onboarding'
defineProps({ errors: { type: Object, default: () => ({}) } })
const { t } = useDocs()
watch(() => form.defaultLang, (d) => { form.extraLangs = form.extraLangs.filter((c) => c !== d) })
</script>

<template>
  <div class="space-y-8">
    <div class="sm:max-w-xs">
      <label class="field-label" for="f-defaultLang">{{ t('obDefaultLang') }}</label>
      <select id="f-defaultLang" v-model="form.defaultLang" class="input" aria-describedby="h-defaultLang">
        <option v-for="l in LANGUAGES" :key="l.code" :value="l.code">{{ l.label }}</option>
      </select>
      <p id="h-defaultLang" class="field-help">{{ t('obDefaultLangHelp') }}</p>
    </div>
    <fieldset aria-describedby="h-extra">
      <legend class="field-label">{{ t('obExtraLangs') }}</legend>
      <p id="h-extra" class="field-help mb-3 mt-0">{{ t('obExtraLangsHelp') }}</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <label v-for="l in LANGUAGES.filter((x) => x.code !== form.defaultLang)" :key="l.code" class="flex cursor-pointer items-center gap-3 rounded-ctl border border-line px-3 py-2 text-sm text-fg hover:border-line-strong">
          <input v-model="form.extraLangs" type="checkbox" :value="l.code" class="h-4 w-4 accent-[var(--color-accent)]" />
          {{ l.label }}
        </label>
      </div>
    </fieldset>
    <div>
      <label class="field-label" for="f-sections">{{ t('obSections') }}</label>
      <textarea id="f-sections" v-model="form.sections" class="input" rows="6" spellcheck="false" :aria-invalid="!!errors.sections" :aria-describedby="errors.sections ? 'h-sections e-sections' : 'h-sections'" />
      <p id="h-sections" class="field-help">{{ t('obSectionsHelp') }}</p>
      <p v-if="errors.sections" id="e-sections" class="field-error" role="alert">{{ t(errors.sections) }}</p>
    </div>
    <label class="flex cursor-pointer items-start gap-3 text-sm text-fg">
      <input v-model="form.starterPages" type="checkbox" class="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" aria-describedby="h-starter" />
      <span>{{ t('obStarter') }}<span id="h-starter" class="field-help mt-0.5 block">{{ t('obStarterHelp') }}</span></span>
    </label>
  </div>
</template>

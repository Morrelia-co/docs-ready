<script setup>
import { ref, computed } from 'vue'
import { form } from '../../composables/useOnboardingForm'
import { useDocs } from '../../composables/useDocs'
import { resolveTheme } from '../../utils/theme'
import { FONT_OPTIONS, WEIGHTS, familiesOf, FAMILY_RE } from '../../utils/fonts'
import { LIMITS, ACCEPT, ALLOWED, formatBytes } from '../../utils/assets'
import { readUpload, verifyFont } from '../../utils/uploads'
import ThemePreview from './ThemePreview.vue'
import FilePicker from './FilePicker.vue'

defineProps({ errors: { type: Object, default: () => ({}) } })
const { t } = useDocs()
const r = computed(() => resolveTheme(form.theme))
const uploadError = ref('')
const families = computed(() => familiesOf(form.fonts.files))
const roles = [['body', 'obBodyFont', 'text'], ['headings', 'obHeadingFont', 'text'], ['code', 'obCodeFont', 'code']]

async function addFont(file) {
  uploadError.value = ''
  if (form.fonts.files.length >= LIMITS.maxFonts) return (uploadError.value = t('errFontCount'))
  const res = await readUpload('font', file)
  if (!res.ok) return (uploadError.value = t(res.error))
  if (!(await verifyFont(res.bytes))) return (uploadError.value = t('errFontUnreadable'))
  const family = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/[^A-Za-z0-9 ]/g, '').trim().slice(0, 40) || 'Custom Font'
  const weight = [400, 700, 300, 500, 600, 800, 900, 100, 200].find((w) => !form.fonts.files.some((f) => f.family === family && f.weight === w && f.style === 'normal')) || 400
  form.fonts.files.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), family, weight, style: 'normal', ext: res.ext, bytes: res.bytes, size: file.size, name: file.name })
}

// Selections that point at a family follow it when it is renamed and fall back to the default when it disappears.
function retarget(oldFamily, newFamily) {
  if (families.value.includes(oldFamily)) return
  for (const [role, , kind] of roles) if (form.fonts[role] === 'up:' + oldFamily) form.fonts[role] = newFamily ? 'up:' + newFamily : role === 'code' ? 'plex-mono' : role === 'body' ? 'plex' : 'body'
}
function rename(file, value) {
  const old = file.family
  file.family = value.trim()
  if (FAMILY_RE.test(file.family)) retarget(old, file.family)
}
function removeFont(file) {
  form.fonts.files = form.fonts.files.filter((f) => f.id !== file.id)
  retarget(file.family, null)
}
const nameOf = (id, kind) => FONT_OPTIONS[kind].flatMap((g) => g.options).find((o) => o.id === id)?.label
</script>

<template>
  <div class="space-y-8">
    <details class="panel text-sm">
      <summary class="cursor-pointer font-medium text-fg">{{ t('obFontsNoteTitle') }}</summary>
      <p class="mt-3 leading-relaxed text-muted">{{ t('obFontsNote') }}</p>
    </details>

    <div class="grid gap-5 sm:grid-cols-3">
      <div v-for="[role, key, kind] in roles" :key="role">
        <label class="field-label" :for="'f-font-' + role">{{ t(key) }}</label>
        <select :id="'f-font-' + role" v-model="form.fonts[role]" class="input">
          <option v-if="role === 'headings'" value="body">{{ t('obSameAsBody') }}</option>
          <optgroup v-for="g in FONT_OPTIONS[kind]" :key="g.group" :label="g.group">
            <option v-for="o in g.options" :key="o.id" :value="o.id">{{ o.label }}</option>
          </optgroup>
          <optgroup v-if="families.length" :label="t('obUploadedGroup')">
            <option v-for="fam in families" :key="fam" :value="'up:' + fam">{{ fam }}</option>
          </optgroup>
        </select>
      </div>
    </div>

    <section aria-labelledby="up-h" class="space-y-4">
      <h3 id="up-h" class="text-sm font-semibold text-fg">{{ t('obUploadFonts') }}</h3>
      <FilePicker id="f-font-file" :label="t('obUploadFonts')" :accept="ACCEPT.font" :help="t('obUploadFontsHelp') + ' ' + t('obAllowed', { types: ALLOWED.font.join(', '), size: formatBytes(LIMITS.font) })" :error="uploadError" @pick="addFont" />
      <p v-if="errors.fonts" class="field-error" role="alert">{{ t(errors.fonts) }}</p>
      <p v-if="!form.fonts.files.length" class="text-sm text-muted">{{ t('obNoFonts') }}</p>
      <ul v-else class="panel divide-y divide-line !p-0">
        <li v-for="(f, i) in form.fonts.files" :key="f.id" class="grid gap-3 p-4 sm:grid-cols-[1fr_7rem_7rem_auto] sm:items-end">
          <div>
            <label class="field-label" :for="'fam-' + i">{{ t('obFamily') }}</label>
            <input :id="'fam-' + i" :value="f.family" class="input" maxlength="40" :aria-invalid="!FAMILY_RE.test(f.family)" @change="rename(f, $event.target.value)" />
            <p class="field-help font-mono">{{ f.name }} · {{ formatBytes(f.size) }}</p>
          </div>
          <div>
            <label class="field-label" :for="'wt-' + i">{{ t('obWeight') }}</label>
            <select :id="'wt-' + i" v-model.number="f.weight" class="input"><option v-for="w in WEIGHTS" :key="w" :value="w">{{ w }}</option></select>
          </div>
          <div>
            <label class="field-label" :for="'st-' + i">{{ t('obStyle') }}</label>
            <select :id="'st-' + i" v-model="f.style" class="input"><option value="normal">{{ t('obNormal') }}</option><option value="italic">{{ t('obItalic') }}</option></select>
          </div>
          <button type="button" class="btn" :aria-label="t('obRemove') + ': ' + f.name" @click="removeFont(f)">{{ t('obRemove') }}</button>
        </li>
      </ul>
    </section>

    <section aria-labelledby="tp-h">
      <h3 id="tp-h" class="mb-2 text-sm font-semibold text-fg">{{ t('obPreview') }}</h3>
      <ThemePreview :tokens="r.tokens" :scheme="r.scheme" :fonts="form.fonts" />
    </section>
  </div>
</template>

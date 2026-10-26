<script setup>
import { reactive, computed } from 'vue'
import { form } from '../../composables/useOnboardingForm'
import { useDocs } from '../../composables/useDocs'
import { resolveTheme } from '../../utils/theme'
import { previewStyle } from '../../utils/theme'
import { LIMITS, ACCEPT, ALLOWED, formatBytes } from '../../utils/assets'
import { readUpload, measureImage, previewUrl } from '../../utils/uploads'
import FilePicker from './FilePicker.vue'

defineProps({ errors: { type: Object, default: () => ({}) } })
const { t, info } = useDocs()
const err = reactive({ logo: '', favicon: '' })
const r = computed(() => resolveTheme(form.theme))
const style = computed(() => previewStyle(r.value.tokens, r.value.scheme))
const b = form.branding

async function setImage(kind, file) {
  err[kind] = ''
  const res = await readUpload(kind, file)
  if (!res.ok) return (err[kind] = t(res.error))
  const dims = await measureImage(res.bytes, res.ext)
  if (!dims) return (err[kind] = t('errImageUnreadable'))
  if (b[kind]?.url) URL.revokeObjectURL(b[kind].url)
  b[kind] = { ext: res.ext, bytes: res.bytes, name: file.name, size: file.size, width: dims.width, height: dims.height, url: previewUrl(res.bytes, res.ext) }
  if (kind === 'favicon') b.faviconFromLogo = false
}
function clear(kind) {
  if (b[kind]?.url) URL.revokeObjectURL(b[kind].url)
  b[kind] = null
  if (kind === 'logo') b.faviconFromLogo = false
}
// A logo is offered as a favicon only when it is a square-ish PNG or SVG; otherwise the user uploads a separate one.
const logoSuitable = computed(() => { const l = b.logo; if (!l || !['png', 'svg'].includes(l.ext) || !l.width) return false; const ratio = l.width / l.height; return ratio > 0.8 && ratio < 1.25 })
const faviconNote = computed(() => { const f = b.favicon; if (!f || !f.width) return ''; if (f.width < 32 || f.height < 32) return t('obFaviconSmall'); return Math.abs(f.width / f.height - 1) > 0.05 ? t('obFaviconNotSquare') : '' })
const favSrc = computed(() => b.favicon?.url || (b.faviconFromLogo && b.logo?.url) || null)
const dim = (i) => (i.width ? ' · ' + t('obDimensions', { w: i.width, h: i.height }) : '')
</script>

<template>
  <div class="space-y-8">
    <p class="text-muted">{{ t('obBrandHelp') }}</p>
    <div class="grid gap-8 sm:grid-cols-2">
      <div class="space-y-3">
        <FilePicker id="f-logo" :label="t('obLogo')" :accept="ACCEPT.logo" :help="t('obLogoHelp') + ' ' + t('obAllowed', { types: ALLOWED.logo.join(', '), size: formatBytes(LIMITS.logo) })" :error="err.logo" @pick="setImage('logo', $event)" />
        <div v-if="b.logo" class="flex items-center gap-3 text-sm text-muted">
          <img :src="b.logo.url" alt="" class="h-10 w-auto max-w-[8rem] rounded border border-line bg-surface object-contain p-1" />
          <span class="min-w-0 break-all">{{ b.logo.name }}{{ dim(b.logo) }}</span>
          <button type="button" class="rounded text-accent hover:underline" :aria-label="t('obRemove') + ': ' + b.logo.name" @click="clear('logo')">{{ t('obRemove') }}</button>
        </div>
        <p v-else class="text-sm text-muted">{{ t('obNoImage') }}</p>
        <label class="flex cursor-pointer items-start gap-3 text-sm text-fg">
          <input v-model="b.showTitle" type="checkbox" class="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" />{{ t('obShowTitle') }}
        </label>
      </div>
      <div class="space-y-3">
        <FilePicker id="f-favicon" :label="t('obFavicon')" :accept="ACCEPT.favicon" :help="t('obFaviconHelp') + ' ' + t('obAllowed', { types: ALLOWED.favicon.join(', '), size: formatBytes(LIMITS.favicon) })" :error="err.favicon || (errors.favicon ? t(errors.favicon) : '')" @pick="setImage('favicon', $event)" />
        <div v-if="b.favicon" class="flex items-center gap-3 text-sm text-muted">
          <img :src="b.favicon.url" alt="" class="h-8 w-8 rounded border border-line bg-surface object-contain p-1" />
          <span class="min-w-0 break-all">{{ b.favicon.name }}{{ dim(b.favicon) }}</span>
          <button type="button" class="rounded text-accent hover:underline" :aria-label="t('obRemove') + ': ' + b.favicon.name" @click="clear('favicon')">{{ t('obRemove') }}</button>
        </div>
        <p v-if="faviconNote" class="text-sm text-[var(--color-warning)]">{{ faviconNote }}</p>
        <label v-if="b.logo && !b.favicon && logoSuitable" class="flex cursor-pointer items-start gap-3 text-sm text-fg">
          <input v-model="b.faviconFromLogo" type="checkbox" class="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" />{{ t('obFaviconFromLogo') }}
        </label>
        <p v-else-if="b.logo && !b.favicon" class="field-help">{{ t('obLogoNotSquare') }}</p>
        <p v-if="!b.favicon && !b.faviconFromLogo" class="text-sm text-muted">{{ t('obNoImage') }}</p>
      </div>
    </div>

    <section aria-labelledby="bp-h">
      <h3 id="bp-h" class="mb-2 text-sm font-semibold text-fg">{{ t('obPreview') }}</h3>
      <div :style="style" class="space-y-3 rounded-panel border border-line bg-surface p-4" style="color-scheme: var(--scheme)">
        <p class="text-xs text-muted">{{ t('obTabPreview') }}</p>
        <div class="flex max-w-xs items-center gap-2 rounded-t-ctl border border-line bg-bg px-3 py-1.5 text-xs text-fg">
          <img v-if="favSrc" :src="favSrc" alt="" class="h-4 w-4 object-contain" />
          <svg v-else width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="var(--color-accent)" /></svg>
          <span class="truncate">{{ form.name }}</span>
        </div>
        <p class="text-xs text-muted">{{ t('obNavbarPreview') }}</p>
        <div class="flex h-14 items-center gap-2.5 rounded-ctl border border-line bg-bg px-4 font-semibold text-fg">
          <img v-if="b.logo" :src="b.logo.url" alt="" class="h-7 w-auto max-w-[10rem] object-contain" />
          <svg v-else width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="var(--color-accent)" /><path d="M8 7h8M8 12h8M8 17h5" stroke="var(--color-on-accent)" stroke-width="2" stroke-linecap="round" /></svg>
          <span v-if="!b.logo || b.showTitle" class="truncate">{{ form.name }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

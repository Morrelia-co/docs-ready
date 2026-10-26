import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { docs, sections, loaders, languages, defaultLanguage, siteInfo, site } from 'virtual:docs-manifest'
import { t as translate } from '../i18n/ui.js'

const bySlug = Object.fromEntries(docs.map((d) => [d.slug, d]))
const byLangPath = Object.fromEntries(docs.map((d) => [`${d.lang}|${d.pagePath}`, d]))
const codes = languages.map((l) => l.code)

// Default-language URLs have no prefix; other languages start with their code.
export const langOf = (path) => {
  const first = String(path || '').split('/')[0]
  return first !== defaultLanguage && codes.includes(first) ? first : defaultLanguage
}
export const langDocs = (lang) => (sections[lang] || []).flatMap((s) => s.slugs.map((x) => bySlug[x]))
export { site }
const prefixOf = (lang) => (lang === defaultLanguage ? '' : '/' + lang)
export const onboardingPathFor = (lang) => prefixOf(lang) + '/onboarding'
export const aboutPathFor = (lang) => prefixOf(lang) + '/about'
export const homeOf = (lang) => '/' + (langDocs(lang)[0]?.slug ?? '')

// UI state only (which sections are open). Nothing sensitive is stored.
const KEY = 'docs:open-sections'
const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : null } catch { return null } }
const openSections = ref(load() ?? Object.values(sections).flat().map((s) => s.title))
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(openSections.value)) } catch { /* private mode */ } }

export const navOpen = ref(false)
export const toggleNav = () => (navOpen.value = !navOpen.value)
export const closeNav = () => (navOpen.value = false)
export const isOpen = (t) => openSections.value.includes(t)
export const openSection = (t) => { if (!isOpen(t)) { openSections.value = [...openSections.value, t]; save() } }
export const toggleSection = (t) => { openSections.value = isOpen(t) ? openSections.value.filter((x) => x !== t) : [...openSections.value, t]; save() }

export function useDocs() {
  const route = useRoute()
  const path = computed(() => String(route.params.path || '').replace(/\/+$/, ''))
  const lang = computed(() => route.meta.lang ?? langOf(path.value))
  const current = computed(() => bySlug[path.value] || null)
  const list = computed(() => langDocs(lang.value))
  const idx = computed(() => list.value.findIndex((d) => d.slug === path.value))
  const prev = computed(() => (idx.value > 0 ? list.value[idx.value - 1] : null))
  const next = computed(() => (idx.value > -1 ? list.value[idx.value + 1] || null : null))
  const tree = computed(() => (sections[lang.value] || []).map((s) => ({ title: s.title, pages: s.slugs.map((x) => bySlug[x]) })))
  const info = computed(() => siteInfo[lang.value])
  const t = (key, vars) => translate(lang.value, key, vars)
  // Same page in another language if it has been translated, otherwise that language's first page.
  const switchTarget = (code) => {
    if (route.meta.onboarding) return onboardingPathFor(code)
    if (route.meta.about) return aboutPathFor(code)
    const twin = current.value && byLangPath[`${code}|${current.value.pagePath}`]
    return twin ? '/' + twin.slug : homeOf(code)
  }
  return { languages, lang, list, info, site, aboutPath: computed(() => aboutPathFor(lang.value)), tree, loaders, current, prev, next, t, switchTarget, home: computed(() => homeOf(lang.value)), onboardingPath: computed(() => onboardingPathFor(lang.value)) }
}

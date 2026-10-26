import { ref } from 'vue'
import MiniSearch from 'minisearch'
import { searchOptions } from '../utils/search-options.js'

const open = ref(false)
const status = ref('idle') // idle | loading | ready | error
const indexes = {} // one search index per language
let wanted = ''

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const termRe = (terms) => {
  const t = (terms || []).filter(Boolean).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return t.length ? new RegExp(`(${t.join('|')})`, 'gi') : null
}

// Escapes first, then wraps matches in <mark>, so the result is safe for v-html.
export function highlight(str, terms) {
  const re = termRe(terms)
  if (!re) return esc(str)
  return str.split(re).map((p, i) => (i % 2 ? `<mark>${esc(p)}</mark>` : esc(p))).join('')
}

function snippet(text, terms) {
  if (!text) return ''
  const re = termRe(terms)
  const m = re ? re.exec(text) : null
  const start = m ? Math.max(0, m.index - 60) : 0
  const part = text.slice(start, start + 160)
  return (start > 0 ? '…' : '') + highlight(part, terms) + (start + 160 < text.length ? '…' : '')
}

export function useSearch() {
  async function load(lang) {
    wanted = lang
    if (indexes[lang]) { status.value = 'ready'; return }
    status.value = 'loading'
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}search-index.${lang}.json`)
      if (!res.ok) throw new Error(String(res.status))
      indexes[lang] = MiniSearch.loadJSON(await res.text(), searchOptions)
      if (wanted === lang) status.value = 'ready'
    } catch {
      if (wanted === lang) status.value = 'error'
    }
  }
  const show = () => { open.value = true }
  const close = () => { open.value = false }
  function query(q, lang) {
    const index = indexes[lang]
    if (!index || !q.trim()) return []
    return index.search(q).slice(0, 12).map((r) => ({
      id: r.id, slug: r.slug, anchor: r.anchor, category: r.category,
      title: highlight(r.title, r.queryTerms),
      heading: r.heading ? highlight(r.heading, r.queryTerms) : '',
      snippet: snippet(r.text, r.queryTerms),
    }))
  }
  return { open, status, show, close, load, query }
}

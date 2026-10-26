// Build-time content pipeline: Markdown -> manifest + per-page HTML modules + search index.
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import taskLists from 'markdown-it-task-lists'
import container from 'markdown-it-container'
import mark from 'markdown-it-mark'
import { createHighlighter } from 'shiki'
import MiniSearch from 'minisearch'
import { searchOptions } from '../src/utils/search-options.js'
import { t as tr } from '../src/i18n/ui.js'
import config from '../docs.config.js'

const DEF = config.defaultLanguage

const MANIFEST = 'virtual:docs-manifest'
const DOC = 'virtual:doc/'
const THEME = 'github-dark-default'
const LANGS = ['bash', 'json', 'yaml', 'python', 'javascript', 'typescript', 'jsx', 'tsx', 'vue', 'sql', 'html', 'xml', 'css', 'markdown', 'diff', 'ini', 'toml']
const PROJECT_SRC = 'virtual:project-source'
const LAYOUTS = ['standard', 'compact', 'wide']
const NAV_DEFAULTS = { toc: true, prevNext: true, breadcrumbs: true, search: true, shortcuts: true, collapsibleSidebar: true, editLink: true, lastUpdated: true, links: [] }

// Site-wide settings with defaults, so docs.config.js files written before these options existed keep working.
export function siteSettings(warn = console.warn) {
  const layout = LAYOUTS.includes(config.layout) ? config.layout : 'standard'
  if (config.layout && layout !== config.layout) warn(`Unknown layout "${config.layout}", using "standard". Options: ${LAYOUTS.join(', ')}`)
  const links = (config.navigation?.links || []).filter((l) => l?.label && /^https?:\/\//i.test(l.url || '')).slice(0, 5)
  return {
    layout,
    navigation: { ...NAV_DEFAULTS, ...config.navigation, links },
    branding: { logo: null, favicon: null, showTitle: true, ...config.branding },
    features: { onboarding: true, about: true, ...config.features },
    about: { projectName: '[ORIGINAL PROJECT NAME]', authorName: '[ORIGINAL AUTHOR]', repoUrl: '[ORIGINAL REPOSITORY URL]', ...config.about },
  }
}


const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const prettify = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const fmtDate = (d) => (!d ? '' : d instanceof Date ? d.toISOString().slice(0, 10) : String(d))
const plain = (inline) => (inline.children || []).filter((c) => c.type === 'text' || c.type === 'code_inline').map((c) => c.content).join('')

let highlighter
function createMd(uiLang) {
  const md = new MarkdownIt({ html: false, linkify: true }) // raw HTML in Markdown is never rendered
  md.use(anchor, { permalink: anchor.permalink.headerLink() }).use(taskLists, { enabled: false }).use(mark)

  // Callouts: :::note / :::tip / :::warning / :::danger  (optional custom title after the keyword)
  for (const [kind, key] of [['note', 'calloutNote'], ['tip', 'calloutTip'], ['warning', 'calloutWarning'], ['danger', 'calloutDanger']]) {
    md.use(container, kind, {
      render: (tokens, idx) => {
        const t = tokens[idx]
        if (t.nesting !== 1) return '</div>\n'
        const title = t.info.trim().slice(kind.length).trim() || tr(uiLang, key)
        return `<div class="callout callout-${kind}" role="note"><p class="callout-title">${esc(title)}</p>\n`
      },
    })
  }
  // Layout blocks: ::::columns with :::column children, :::banner, :::buttons
  for (const name of ['columns', 'column', 'banner', 'buttons']) {
    md.use(container, name, { render: (tokens, idx) => (tokens[idx].nesting === 1 ? `<div class="${name}">\n` : '</div>\n') })
  }

  // Collect headings (for the right-hand TOC) and per-section text (for search).
  md.core.ruler.push('collect', (state) => {
    const env = state.env
    env.headings = []
    env.sections = [{ heading: '', anchor: '', text: '' }]
    let cur = env.sections[0]
    const toks = state.tokens
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i]
      if (t.type === 'heading_open') {
        const level = Number(t.tag.slice(1))
        const text = plain(toks[i + 1])
        const id = t.attrGet('id')
        if (level === 2 || level === 3) env.headings.push({ id, text, level })
        if (level >= 2) env.sections.push((cur = { heading: text, anchor: id, text: '' }))
        else cur.text += text + ' '
        i++
      } else if (t.type === 'inline') cur.text += plain(t) + ' '
      else if (t.type === 'fence' || t.type === 'code_block') cur.text += t.content + ' '
    }
  })

  md.renderer.rules.fence = (tokens, idx) => {
    const t = tokens[idx]
    const lang = (t.info || '').trim().split(/\s+/)[0] || 'text'
    const title = /title="([^"]*)"/.exec(t.info || '')?.[1] // ```js title="config.js"
    const label = title || (lang === 'text' ? '' : lang)
    const code = t.content.replace(/\n$/, '')
    let html
    try { html = highlighter.codeToHtml(code, { lang, theme: THEME }) }
    catch { html = highlighter.codeToHtml(code, { lang: 'text', theme: THEME }) }
    return `<div class="code-block"><div class="code-head"><span>${esc(label)}</span><button type="button" class="copy-btn" aria-label="${esc(tr(uiLang, 'copyAria'))}">${esc(tr(uiLang, 'copy'))}</button></div>${html}</div>\n`
  }
  md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n'
  md.renderer.rules.table_close = () => '</table></div>\n'
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const t = tokens[idx]
    const img = `<img src="${esc(t.attrGet('src'))}" alt="${esc(self.renderInlineAsText(t.children, options, env))}" loading="lazy" decoding="async">`
    const title = t.attrGet('title')
    return title ? `<span class="figure">${img}<span class="figcaption">${esc(title)}</span></span>` : img
  }
  // Relative links to other .md files become site routes (and still work in GitHub's preview).
  const defaultLink = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options)
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const t = tokens[idx]
    const href = t.attrGet('href')
    if (href && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(href)) {
      const [p, hash] = href.split('#')
      if (p.endsWith('.md')) {
        const target = path.posix.join('/', path.posix.dirname(env.slug), p).replace(/\.md$/, '')
        t.attrSet('href', target + (hash ? '#' + hash : ''))
      }
    }
    return defaultLink(tokens, idx, options, env, self)
  }
  return md
}

async function walk(dir, skip = new Set(), top = true) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (!(top && skip.has(e.name))) out.push(...(await walk(p, skip, false))) }
    else if (e.name.endsWith('.md') && !e.name.startsWith('_') && e.name !== 'README.md') out.push(p)
  }
  return out
}

async function buildAll(root, warn) {
  highlighter ??= await createHighlighter({ themes: [THEME], langs: LANGS })
  const dir = path.resolve(root, 'src/content')
  const others = new Set(config.languages.map((l) => l.code).filter((c) => c !== DEF))
  const docs = []
  const seen = new Set()

  for (const { code } of config.languages) {
    const base = code === DEF ? dir : path.join(dir, code)
    let files = []
    try { files = await walk(base, code === DEF ? others : new Set()) } catch { warn(`No content folder for language "${code}" (${base})`) }
    const md = createMd(code)
    const prefix = code === DEF ? '' : code + '/'
    for (const file of files.sort()) {
      const rel = path.relative(base, file).split(path.sep).join('/')
      const { data, content } = matter(await readFile(file, 'utf8'))
      if (data.published === false) continue // drafts never reach the manifest, the bundle or the search index
      const pagePath = rel.replace(/\.md$/, '') // identical across languages: this is how translations are matched
      const slug = prefix + pagePath
      if (seen.has(slug)) warn(`Duplicate slug: ${slug}`)
      seen.add(slug)
      let h1
      const body = content.replace(/^\s*#\s+(.+?)\s*\n/, (_, t) => ((h1 = t), '')) // title comes from frontmatter; drop a leading "# Title"
      if (!data.title && !h1) warn(`${prefix}${rel}: no title in frontmatter or leading # heading`)
      const env = { slug }
      const html = md.render(body, env)
      docs.push({
        lang: code, slug, pagePath, file: prefix + rel, html, sections: env.sections, headings: env.headings,
        title: data.title || h1 || prettify(path.basename(slug)),
        description: data.description || '',
        category: data.category || prettify(rel.includes('/') ? rel.split('/')[0] : 'general'),
        order: Number.isFinite(data.order) ? data.order : 999,
        lastUpdated: fmtDate(data.lastUpdated),
      })
    }
  }

  const bySlug = Object.fromEntries(docs.map((d) => [d.slug, d]))
  const sections = {}
  const searchJson = {}
  const ordered = []
  for (const l of config.languages) {
    const list = docs.filter((d) => d.lang === l.code)
    if (!list.length) warn(`Language "${l.code}" has no published pages`)
    const rank = (c) => { const i = (l.categoryOrder || []).indexOf(c); return i === -1 ? 1e9 : i }
    const cats = [...new Set(list.map((d) => d.category))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    sections[l.code] = cats.map((title) => ({
      title,
      slugs: list.filter((d) => d.category === title).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)).map((d) => d.slug),
    }))
    ordered.push(...sections[l.code].flatMap((s) => s.slugs.map((x) => bySlug[x])))

    const ms = new MiniSearch(searchOptions)
    for (const d of list) {
      d.sections.forEach((s, i) => {
        const text = ((i === 0 ? d.description + ' ' : '') + s.text).replace(/\s+/g, ' ').trim()
        ms.add({ id: `${d.slug}#${s.anchor}`, slug: d.slug, anchor: s.anchor, title: d.title, heading: s.heading, text, category: d.category })
      })
    }
    searchJson[l.code] = JSON.stringify(ms)
  }

  const edit = (f) => `${config.repo.url}/edit/${config.repo.branch}/src/content/${f}`
  const manifest = [
    `export const defaultLanguage = ${JSON.stringify(DEF)};`,
    `export const languages = ${JSON.stringify(config.languages.map(({ code, label }) => ({ code, label })))};`,
    `export const siteInfo = ${JSON.stringify(Object.fromEntries(config.languages.map((l) => [l.code, { siteTitle: l.siteTitle, siteDescription: l.siteDescription }])))};`,
    `export const docs = ${JSON.stringify(ordered.map(({ html, sections: _s, ...m }) => ({ ...m, editUrl: edit(m.file) })))};`,
    `export const sections = ${JSON.stringify(sections)};`,
    `export const site = ${JSON.stringify(siteSettings(warn))};`,
    `export const loaders = {\n${ordered.map((d) => `${JSON.stringify(d.slug)}: () => import(${JSON.stringify(DOC + d.slug)})`).join(',\n')}\n};`,
  ].join('\n')

  return { bySlug, manifest, searchJson }
}

export default function docsPlugin() {
  let root
  let cache
  const get = (ctx) => (cache ??= buildAll(root, (m) => ctx.warn(m)))
  return {
    name: 'docs-plugin',
    configResolved(c) { root = c.root },
    buildStart() { cache = null },
    resolveId(id) { if (id === MANIFEST || id === PROJECT_SRC || id.startsWith(DOC)) return '\0' + id },
    async load(id) {
      if (id === '\0' + MANIFEST) return (await get(this)).manifest
      if (id === '\0' + PROJECT_SRC) return `export default ${JSON.stringify(await collectSource(root))}`
      if (id.startsWith('\0' + DOC)) {
        const d = (await get(this)).bySlug[id.slice(DOC.length + 1)]
        return `export default ${JSON.stringify(d.html)}`
      }
    },
    async generateBundle() {
      if (!siteSettings(() => {}).navigation.search) return // search is disabled: ship no index
      const { searchJson } = await get(this)
      for (const [code, source] of Object.entries(searchJson)) this.emitFile({ type: 'asset', fileName: `search-index.${code}.json`, source })
    },
    configureServer(server) {
      const dir = path.resolve(root, 'src/content')
      server.watcher.add(dir)
      const refresh = (f) => {
        if (!f.endsWith('.md') || !f.startsWith(dir)) return
        cache = null
        for (const m of server.moduleGraph.idToModuleMap.values()) if (m.id?.startsWith('\0virtual:doc')) server.moduleGraph.invalidateModule(m)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('change', refresh).on('add', refresh).on('unlink', refresh)
      server.middlewares.use(async (req, res, next) => {
        const m = /^\/search-index\.([\w-]+)\.json/.exec(req.url)
        if (!m) return next()
        res.setHeader('Content-Type', 'application/json')
        res.end((await get({ warn: console.warn })).searchJson[m[1]] ?? '{}')
      })
    },
  }
}

// Text files of the portal (source, plugins, public assets, lockfile...) used by the onboarding wizard to assemble a
// complete, runnable project. Sample content is left out, except the Markdown guide the wizard reuses as an example page.
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'tests', '.vercel'])
const ROOT_FILES = ['package.json', 'package-lock.json', 'vite.config.js', 'vercel.json', '.gitignore', 'LICENSE', 'docs.config.js', 'index.html']
const TEXT = /\.(vue|js|css|json|svg|md|html|txt)$/i

export async function collectSource(root) {
  const out = {}
  const walkDir = async (dir) => {
    for (const e of await readdir(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) await walkDir(rel) }
      else if (TEXT.test(e.name)) {
        if (rel.startsWith('src/content/') && rel !== 'src/content/getting-started/markdown-guide.md') continue
        out[rel] = await readFile(path.join(root, rel), 'utf8')
      }
    }
  }
  for (const d of ['src', 'plugins', 'public']) await walkDir(d)
  for (const f of ROOT_FILES) { try { out[f] = await readFile(path.join(root, f), 'utf8') } catch { /* optional */ } }
  return out
}

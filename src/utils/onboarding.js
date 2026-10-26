// Single source of truth for the onboarding wizard: the form model, validation, and generation of the project ZIP contents.
// Pure functions only (no Vue, no DOM), so everything here can be tested in Node.
import { normalizeHex } from './color.js'
import { resolveTheme, tokensCss, DEFAULT_THEME } from './theme.js'
import { FONT_OPTIONS, stackFor, fontFaceCss, fileOut, familiesOf, validateFonts } from './fonts.js'
import { MIME } from './assets.js'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
]
export const DEFAULT_SECTIONS = ['Getting Started', 'ERPNext Customizations', 'Business Processes', 'Administration', 'Troubleshooting']
export const REPO_PLACEHOLDER = 'https://github.com/your-org/your-docs-repo'

// Widths (rem) mirror the layout presets in tokens.css; the wizard only uses them to draw previews.
export const LAYOUTS = [
  { id: 'standard', sidebar: 18, content: 46 },
  { id: 'compact', sidebar: 14, content: 44 },
  { id: 'wide', sidebar: 18, content: 60 },
]
// Every option here is implemented in the portal (see docs.config.js). `key` is the property in navigation.
export const NAV_OPTIONS = ['toc', 'prevNext', 'breadcrumbs', 'search', 'shortcuts', 'collapsibleSidebar', 'editLink', 'lastUpdated']

export const defaultForm = (seed = {}) => ({
  name: seed.name || 'My Documentation',
  description: seed.description || '',
  repoUrl: '',
  branch: 'main',
  defaultLang: LANGUAGES.some((l) => l.code === seed.lang) ? seed.lang : 'en',
  extraLangs: [],
  sections: DEFAULT_SECTIONS.join('\n'),
  starterPages: true,
  theme: { preset: DEFAULT_THEME, primary: null, bg: null, fg: null },
  fonts: { body: 'plex', headings: 'body', code: 'plex-mono', files: [] },
  branding: { logo: null, favicon: null, faviconFromLogo: false, showTitle: true },
  layout: 'standard',
  nav: Object.fromEntries([...NAV_OPTIONS.map((k) => [k, true]), ['about', true]]),
  links: [{ label: '', url: '' }, { label: '', url: '' }, { label: '', url: '' }],
})

const REPO_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/
const BRANCH_RE = /^[A-Za-z0-9._/-]+$/
const q = JSON.stringify // JSON strings are valid JS and valid YAML double-quoted strings, so user text cannot break out of them
const clean = (s) => String(s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const mdEscape = (s) => s.replace(/[\\`*_{}[\]<>#|~]/g, '\\$&')
const j = (v) => JSON.stringify(v, null, 2).replace(/^(\s*)"([A-Za-z_]\w*)":/gm, '$1$2:').split('\n').map((l, i) => (i ? '  ' + l : l)).join('\n')

export const slugify = (s, fallback = 'docs-portal') =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback

const lines = (text) => text.split('\n').map(clean).filter(Boolean)
export const parseSections = (text) => [...new Set(lines(text))]
export const activeLinks = (f) => f.links.map((l) => ({ label: clean(l.label), url: l.url.trim() })).filter((l) => l.label || l.url)
export const brandPaths = (f) => {
  const b = f.branding
  const logo = b.logo ? `brand/logo.${b.logo.ext}` : null
  const favicon = b.favicon ? `brand/favicon.${b.favicon.ext}` : b.faviconFromLogo && logo ? logo : null
  return { logo, favicon }
}

export const STEP_COUNT = 7 // project, content, theme, typography, branding, layout and navigation, review

/** Returns { fieldName: errorKey } for one step (0-based). Keys are translated in the UI. */
export function validate(step, f) {
  const e = {}
  if (step === 0) {
    const name = clean(f.name)
    if (name.length < 2 || name.length > 60) e.name = 'errName'
    if (clean(f.description).length > 200) e.description = 'errDesc'
    const repo = f.repoUrl.trim()
    if (repo && !REPO_RE.test(repo)) e.repoUrl = 'errRepo'
    const b = f.branch.trim()
    if (!b || !BRANCH_RE.test(b) || /^[/-]|\/$|\.\./.test(b)) e.branch = 'errBranch'
  }
  if (step === 1) {
    const all = lines(f.sections)
    if (all.length < 1 || all.length > 12) e.sections = 'errSectionsCount'
    else if (all.some((s) => s.length > 40)) e.sections = 'errSectionLen'
    else if (new Set(all.map((s) => s.toLowerCase())).size !== all.length) e.sections = 'errSectionDup'
  }
  if (step === 2) {
    for (const k of ['primary', 'bg', 'fg']) if (f.theme[k] && !normalizeHex(f.theme[k])) e[k] = 'errHex'
    if (!Object.keys(e).length) {
      const { blocking } = resolveTheme(f.theme)
      if (blocking.includes('text')) e.contrast = 'errThemeText'
      else if (blocking.includes('accent') || blocking.includes('onAccent')) e.contrast = 'errThemeAccent'
    }
  }
  if (step === 3) {
    const err = validateFonts(f.fonts.files)
    if (err) e.fonts = err
  }
  if (step === 4) {
    if (f.branding.faviconFromLogo && !f.branding.logo) e.favicon = 'errFaviconNoLogo'
  }
  if (step === 5) {
    const bad = activeLinks(f).some((l) => !l.label || l.label.length > 24 || !/^https?:\/\/[^\s]+$/i.test(l.url) || l.url.length > 200)
    if (bad) e.links = 'errLinks'
  }
  return e
}

const COPY = {
  en: {
    intro: 'Introduction',
    introDesc: 'What this documentation covers and how to use it.',
    starter: '> **Starter page.** Replace this text with your own documentation.',
    welcome: (n) => `Welcome to ${n}. This portal is built from Markdown files in \`src/content/\`.`,
    around: 'Find your way around',
    around1: 'Press `/` or `Ctrl+K` to search every page.',
    around2: 'Use the sidebar to browse by section.',
    edit: 'Edit this documentation',
    editBody: 'Use the edit link at the bottom of any page to change it on GitHub, or edit the Markdown files locally and preview them with `npm run dev`. The Markdown guide lists every supported feature.',
    placeholder: (s) => `This section is a placeholder for **${s}**. Add your documentation here, or create more pages in this folder.`,
    sectionDesc: (s) => `Placeholder for the ${s} section.`,
  },
  es: {
    intro: 'Introducción',
    introDesc: 'Qué cubre esta documentación y cómo usarla.',
    starter: '> **Página inicial.** Reemplaza este texto con tu propia documentación.',
    welcome: (n) => `Te damos la bienvenida a ${n}. Este portal se genera a partir de archivos Markdown en \`src/content/\`.`,
    around: 'Cómo orientarte',
    around1: 'Pulsa `/` o `Ctrl+K` para buscar en todas las páginas.',
    around2: 'Usa la barra lateral para explorar por sección.',
    edit: 'Editar esta documentación',
    editBody: 'Usa el enlace de edición al final de cualquier página para cambiarla en GitHub, o edita los archivos Markdown en local y previsualízalos con `npm run dev`. La guía de Markdown (en inglés) lista todas las funciones disponibles.',
    placeholder: (s) => `Esta sección es un marcador de posición para **${s}**. Añade aquí tu documentación o crea más páginas en esta carpeta.`,
    sectionDesc: (s) => `Marcador de posición de la sección ${s}.`,
  },
}

const page = (fm, body) => `---\n${Object.entries(fm).map(([k, v]) => `${k}: ${typeof v === 'string' && k !== 'lastUpdated' ? q(v) : v}`).join('\n')}\n---\n\n${body}\n`

const resolved = (f) => {
  const r = resolveTheme(f.theme)
  const files = f.fonts.files
  const known = (id, kind) => id.startsWith('up:') ? familiesOf(files).includes(id.slice(3)) : FONT_OPTIONS[kind].some((g) => g.options.some((o) => o.id === id))
  const body = known(f.fonts.body, 'text') ? f.fonts.body : 'plex'
  const headings = f.fonts.headings === 'body' || !known(f.fonts.headings, 'text') ? 'body' : f.fonts.headings
  const code = known(f.fonts.code, 'code') ? f.fonts.code : 'plex-mono'
  return { ...r, fonts: { body, headings, code } }
}

/** The files that are specific to this project (everything except the unchanged portal source). */
export function generateFiles(f, ctx = {}) {
  const today = ctx.today || new Date().toISOString().slice(0, 10)
  const name = clean(f.name)
  const description = clean(f.description) || name
  const repoUrl = f.repoUrl.trim().replace(/\/+$/, '').replace(/\.git$/, '') || REPO_PLACEHOLDER
  const branch = f.branch.trim()
  const sections = parseSections(f.sections)
  const def = f.defaultLang
  const langs = [def, ...LANGUAGES.map((l) => l.code).filter((c) => c !== def && f.extraLangs.includes(c))].map((c) => LANGUAGES.find((l) => l.code === c))
  const theme = resolved(f)
  const { logo, favicon } = brandPaths(f)
  const links = activeLinks(f)
  const about = { projectName: '[ORIGINAL PROJECT NAME]', authorName: '[ORIGINAL AUTHOR]', repoUrl: '[ORIGINAL REPOSITORY URL]', ...ctx.about }

  const used = new Set()
  const folders = sections.map((s, i) => {
    const base = slugify(s, `section-${i + 1}`)
    let slug = base
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`
    used.add(slug)
    return slug
  })

  const out = []
  const add = (path, content) => out.push({ path, content })

  add('docs.config.js', `// Generated by the onboarding wizard on ${today}.
// Page metadata lives in each Markdown file's frontmatter, not here. README.md explains every option.
export default {
  repo: { url: ${q(repoUrl)}, branch: ${q(branch)} },
  defaultLanguage: ${q(def)},
  layout: ${q(f.layout)},
  navigation: ${j({ ...Object.fromEntries(NAV_OPTIONS.map((k) => [k, !!f.nav[k]])), links })},
  branding: ${j({ logo, favicon, showTitle: !!f.branding.showTitle })},
  features: { onboarding: false, about: ${!!f.nav.about} },
  // Attribution for the original project (see README.md, "License and attribution").
  about: ${j(about)},
  languages: [
${langs.map((l) => `    {
      code: ${q(l.code)},
      label: ${q(l.label)},
      siteTitle: ${q(name)},
      siteDescription: ${q(description)},
      categoryOrder: ${JSON.stringify(sections)},
    },`).join('\n')}
  ],
}
`)

  // Theme and typography: overrides of the tokens declared in src/styles/tokens.css (loaded after global.css).
  const t = theme.tokens
  const heading = theme.fonts.headings === 'body' ? 'var(--font-sans)' : stackFor(theme.fonts.headings, 'text')
  const faces = fontFaceCss(f.fonts.files, (file) => `../assets/fonts/${fileOut(file)}`)
  add('src/styles/custom.css', `/* Generated by the onboarding wizard on ${today}. Theme: ${THEME_LABEL(f.theme.preset)}${f.theme.primary || f.theme.bg || f.theme.fg ? ' with custom colors' : ''}.
   These variables override the defaults in tokens.css. Edit the values to adjust the design; nothing else needs to change. */
${faces ? faces + '\n\n' : ''}:root {
${tokensCss(t, theme.scheme)}
  --font-sans: ${stackFor(theme.fonts.body, 'text')};
  --font-heading: ${heading};
  --font-mono: ${stackFor(theme.fonts.code, 'code')};
}
`)
  for (const file of f.fonts.files) add(`src/assets/fonts/${fileOut(file)}`, file.bytes)

  if (f.branding.logo) add(logo, f.branding.logo.bytes) // placed below under public/
  if (f.branding.favicon) add(favicon, f.branding.favicon.bytes)
  for (const o of out) if (o.path.startsWith('brand/')) o.path = 'public/' + o.path

  const favHref = favicon ? `%BASE_URL%${favicon}` : '/favicon.svg'
  const favType = favicon ? MIME[favicon.split('.').pop()] : 'image/svg+xml'
  add('index.html', `<!doctype html>
<html lang="${def}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="${t.bg}" />
    <meta name="description" content="${esc(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(name)}" />
    <meta property="og:description" content="${esc(description)}" />
    <link rel="icon" type="${favType}" href="${favHref}" />
    <title>${esc(name)}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`)

  // Starter content
  for (const l of langs) {
    const c = COPY[l.code] || COPY.en
    const base = l.code === def ? 'src/content/' : `src/content/${l.code}/`
    add(`${base}${folders[0]}/introduction.md`, page(
      { title: c.intro, description: c.introDesc, category: sections[0], order: 1, published: true, lastUpdated: today },
      `${c.starter}\n\n${c.welcome(mdEscape(name))}\n\n## ${c.around}\n\n- ${c.around1}\n- ${c.around2}\n\n## ${c.edit}\n\n${c.editBody}`,
    ))
    if (f.starterPages) {
      sections.forEach((s, i) => add(`${base}${folders[i]}/overview.md`, page(
        { title: s, description: c.sectionDesc(s), category: s, order: i === 0 ? 2 : 1, published: true, lastUpdated: today },
        `${c.starter}\n\n${c.placeholder(mdEscape(s))}`,
      )))
    }
  }
  // Example page demonstrating the Markdown features: reuses the portal's own guide so the two never drift apart.
  const guide = ctx.source?.['src/content/getting-started/markdown-guide.md']
  if (guide) {
    add(`src/content/${folders[0]}/markdown-guide.md`, guide
      .replace(/^category: .*$/m, `category: ${q(sections[0])}`).replace(/^order: .*$/m, 'order: 90').replace(/^lastUpdated: .*$/m, `lastUpdated: ${today}`))
  }
  add('public/images/banner-example.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" role="img" aria-label="Abstract banner"><rect width="1200" height="300" fill="${t.surface}"/><circle cx="980" cy="60" r="170" fill="${t.accent}" opacity=".22"/><circle cx="1100" cy="250" r="120" fill="${t.accent}" opacity=".35"/><rect x="70" y="110" width="420" height="14" rx="7" fill="${t.fg}" opacity=".85"/><rect x="70" y="146" width="300" height="10" rx="5" fill="${t.fg}" opacity=".4"/></svg>\n`)

  add('LICENSE', ctx.source?.LICENSE || MIT_FALLBACK)
  add('README.md', readme({ f, name, def, langs, repoUrl, branch, sections, folders, theme, logo, favicon, links, about, today }))
  return out
}

const THEME_LABEL = (id) => ({ midnight: 'Midnight', graphite: 'Graphite', forest: 'Forest', paper: 'Paper', daylight: 'Daylight' })[id] || 'Midnight'

const MIT_FALLBACK = `MIT License

Copyright (c) [YEAR] [COPYRIGHT HOLDER: replace with the original author's name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

/** Paths of the project-specific files, for the review step (no source needed). */
export const plannedPaths = (f) => generateFiles(f).map((x) => x.path)

// Files from the portal that must not be copied into a generated project.
const SKIP = (p) => p.startsWith('src/content/') || p === 'README.md' || p === 'public/images/sample-architecture.svg' || p.startsWith('tests/')

/** Complete project: portal source + generated files. `ctx.source` is { path: text } (see the virtual:project-source module). */
export function buildFiles(f, ctx = {}) {
  const generated = generateFiles(f, ctx)
  const slug = slugify(clean(f.name))
  const out = new Map()
  for (const [p, c] of Object.entries(ctx.source || {})) if (!SKIP(p)) out.set(p, c)
  for (const [p, rename] of [['package.json', (o) => ({ ...o, name: slug, version: '0.1.0', description: clean(f.description) || clean(f.name) })], ['package-lock.json', (o) => ({ ...o, name: slug, version: '0.1.0', packages: { ...o.packages, '': { ...o.packages?.[''], name: slug, version: '0.1.0' } } })]]) {
    if (out.has(p)) { try { out.set(p, JSON.stringify(rename(JSON.parse(out.get(p))), null, 2) + '\n') } catch { /* keep the original if it is not valid JSON */ } }
  }
  for (const g of generated) out.set(g.path, g.content)
  return { folder: slug, files: [...out].map(([path, content]) => ({ path, content })), generated: generated.map((g) => g.path) }
}

function readme({ f, name, def, langs, repoUrl, branch, sections, folders, theme, logo, favicon, links, about, today }) {
  const L = []
  const on = (k) => (f.nav[k] ? 'on' : 'off')
  const fontName = (id, kind) => id === 'body' ? 'same as body' : id.startsWith('up:') ? `${id.slice(3)} (uploaded)` : FONT_OPTIONS[kind].flatMap((g) => g.options).find((o) => o.id === id)?.label
  L.push(`# ${mdEscape(name)}`, '', `A documentation site generated by the onboarding wizard on ${today}. It is a complete, runnable project (Vue 3, Vite, Tailwind CSS, Markdown content) licensed under the MIT License, with your theme, fonts, branding, layout and navigation choices already applied.`, '')
  L.push('## Quick start', '', 'Requirements: Node.js 20 or newer and npm.', '', '```bash', 'npm install', 'npm run dev       # http://localhost:5173, content and style changes reload automatically', 'npm run build     # production build into dist/', 'npm run preview   # serve dist/ locally to check the build', '```', '')
  L.push('This project needs no environment variables, so there is no `.env` file, and it contains no secrets.', '')
  L.push('## Your selections', '')
  L.push(`- **Theme:** ${THEME_LABEL(f.theme.preset)} (${theme.scheme})${f.theme.primary ? `, primary color ${theme.tokens.accent}` : ''}${f.theme.bg || f.theme.fg ? `, custom background/text colors` : ''}`)
  L.push(`- **Fonts:** body ${fontName(theme.fonts.body, 'text')}; headings ${fontName(theme.fonts.headings, 'text')}; code ${fontName(theme.fonts.code, 'code')}`)
  L.push(`- **Branding:** logo ${logo ? `\`public/${logo}\`` : 'default mark'}; favicon ${favicon ? `\`public/${favicon}\`` : 'default'}`)
  L.push(`- **Layout:** ${f.layout}`)
  L.push(`- **Navigation:** table of contents ${on('toc')}, previous/next ${on('prevNext')}, breadcrumbs ${on('breadcrumbs')}, search ${on('search')}, keyboard shortcuts ${on('shortcuts')}, collapsible sidebar ${on('collapsibleSidebar')}, edit link ${on('editLink')}, last updated ${on('lastUpdated')}${links.length ? `; top-bar links: ${links.map((l) => l.label).join(', ')}` : ''}`)
  L.push(`- **Languages:** ${langs.map((l) => `${l.label} (\`${l.code}\`${l.code === def ? ', default' : ''})`).join(', ')}`)
  L.push(`- **Sections:** ${sections.map(mdEscape).join(', ')}`)
  L.push(`- **Repository:** \`${repoUrl}\` (branch \`${branch}\`)`, '')
  if (repoUrl === REPO_PLACEHOLDER) L.push(`You left the repository URL blank, so \`docs.config.js\` contains a placeholder. Set \`repo.url\` to your real GitHub repository, otherwise the "Edit this page" links will not work.`, '')
  L.push('## Where to change things', '', '| To change | Edit |', '| --- | --- |', '| Site title, languages, section order, layout, navigation options, logo and favicon paths | `docs.config.js` |', '| Colors, fonts and `@font-face` rules | `src/styles/custom.css` (overrides `src/styles/tokens.css`) |', '| Logo and favicon files | `public/brand/` |', '| Uploaded font files | `src/assets/fonts/` |', '| Page title and description before the app loads | `index.html` |', '| Content | `src/content/` |', '')
  L.push('Layout options are `standard`, `compact` and `wide`. Navigation options in `docs.config.js` are real switches: turning off `search` also removes the search index from the build, and turning off `shortcuts` removes the `/` and `Ctrl+K` listeners.', '')
  L.push('## Writing content', '', `Add \`.md\` files under \`src/content/\` (the default language) or \`src/content/<language code>/\`. Each file starts with frontmatter:`, '', '```markdown', '---', 'title: My page', 'description: One-sentence summary.', `category: ${sections[0]}`, 'order: 3', 'published: true', `lastUpdated: ${today}`, '---', '```', '')
  L.push(`\`category\` must match a section name exactly, the URL is the file path without \`.md\`, and \`published: false\` keeps a draft out of the site and the search index. The page \`src/content/${folders[0]}/markdown-guide.md\` demonstrates every supported feature: callouts, columns, banner images, highlighting, code blocks with titles and copy buttons, and buttons. This project supports Markdown only (no MDX).`, '')
  L.push('## Deploy', '', 'The site is static: `npm run build` produces `dist/`. On Vercel, import the repository; `vercel.json` already sets the Vite preset, `npm ci`, `npm run build` and the `dist` output directory. On any other static host, upload `dist/` and configure a fallback that serves `index.html` for unknown paths, otherwise refreshing a page such as `/getting-started/introduction` returns a 404.', '', 'A deployed site is public unless you add access protection.', '')
  L.push('## License and attribution', '')
  L.push('This project is free to use under the MIT License (see `LICENSE`). The license has one condition: the copyright notice and the license text must be kept in all copies or substantial portions of the software.', '')
  L.push('Attribution beyond that notice is not a condition of the MIT License, but it is requested: please credit the original project and its author, for example in your README or on your site.', '')
  L.push(`- Original project: ${about.projectName}`, `- Author: ${about.authorName}`, `- Repository: ${about.repoUrl}`, '')
  L.push('Suggested attribution:', '', `> Documentation site built with ${about.projectName} by ${about.authorName}, MIT licensed: ${about.repoUrl}`, '')
  if (/^\[/.test(about.projectName + about.authorName + about.repoUrl)) L.push('The bracketed values above are placeholders carried over from the original project\'s `docs.config.js` (`about`). Replace them with the real project name, author and repository.', '')
  L.push('## About the onboarding wizard', '', 'The wizard that created this project is switched off here (`features.onboarding: false` in `docs.config.js`) and is left out of the build. Its source files remain in `src/` and can be deleted if you do not want them.', '')
  return L.join('\n')
}

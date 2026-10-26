// Font stacks and @font-face generation.
// System stacks are curated lists: whether a given font is actually installed depends on the visitor's operating system and
// cannot be detected reliably (the one enumeration API, queryLocalFonts(), is limited-availability and permission-gated).
// That is separate from browser compatibility: web font formats such as WOFF2 are supported by every current browser.
// To add a built-in font, add one option below. To support another upload format, extend ALLOWED in assets.js and FORMAT here.
const SANS_FALLBACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
const MONO_FALLBACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

export const FONT_OPTIONS = {
  text: [
    { group: 'Bundled', options: [{ id: 'plex', label: 'IBM Plex Sans (default)', stack: `'IBM Plex Sans', ${SANS_FALLBACK}` }] },
    {
      group: 'System sans-serif',
      options: [
        { id: 'sys-ui', label: 'System UI', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" },
        { id: 'sys-helvetica', label: 'Helvetica / Arial', stack: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
        { id: 'sys-verdana', label: 'Verdana', stack: "Verdana, Geneva, 'DejaVu Sans', sans-serif" },
        { id: 'sys-trebuchet', label: 'Trebuchet MS', stack: "'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', Tahoma, sans-serif" },
      ],
    },
    {
      group: 'System serif',
      options: [
        { id: 'sys-georgia', label: 'Georgia', stack: "Georgia, Cambria, 'Times New Roman', Times, serif" },
        { id: 'sys-charter', label: 'Charter / Palatino', stack: "'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', Palatino, P052, serif" },
        { id: 'sys-times', label: 'Times New Roman', stack: "'Times New Roman', Times, 'Liberation Serif', serif" },
      ],
    },
  ],
  code: [
    { group: 'Bundled', options: [{ id: 'plex-mono', label: 'IBM Plex Mono (default)', stack: `'IBM Plex Mono', ${MONO_FALLBACK}` }] },
    {
      group: 'System monospace',
      options: [
        { id: 'sys-mono', label: 'System monospace', stack: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace" },
        { id: 'sys-consolas', label: 'Consolas', stack: "Consolas, 'Lucida Console', 'DejaVu Sans Mono', monospace" },
        { id: 'sys-courier', label: 'Courier New', stack: "'Courier New', Courier, monospace" },
      ],
    },
  ],
}
const ALL = Object.values(FONT_OPTIONS).flat().flatMap((g) => g.options)

export const FORMAT = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' }
export const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]
export const FAMILY_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{0,39}$/ // safe to place inside CSS quotes

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'font'
export const fileOut = (f) => `${slug(f.family)}-${f.weight}${f.style === 'italic' ? '-italic' : ''}.${f.ext}`
export const familiesOf = (files) => [...new Set(files.map((f) => f.family))]
export const previewFamily = (family) => `ob-${slug(family)}`

/** Resolves a selection id ('plex', 'sys-ui', 'up:My Font') to a CSS font-family value. */
export function stackFor(id, kind, { preview = false } = {}) {
  if (id?.startsWith('up:')) {
    const family = id.slice(3)
    return `"${preview ? previewFamily(family) : family}", ${kind === 'code' ? MONO_FALLBACK : SANS_FALLBACK}`
  }
  return (ALL.find((o) => o.id === id) || ALL[0]).stack
}

export function fontFaceCss(files, urlFor) {
  return files.map((f) => `@font-face {\n  font-family: "${f.family}";\n  src: url("${urlFor(f)}") format("${FORMAT[f.ext]}");\n  font-weight: ${f.weight};\n  font-style: ${f.style};\n  font-display: swap;\n}`).join('\n\n')
}

/** Uploaded files must have valid, unique family/weight/style combinations. Returns an error key or null. */
export function validateFonts(files) {
  if (files.some((f) => !FAMILY_RE.test(f.family))) return 'errFontFamily'
  const keys = files.map((f) => `${f.family}|${f.weight}|${f.style}`)
  if (new Set(keys).size !== keys.length) return 'errFontDup'
  return null
}

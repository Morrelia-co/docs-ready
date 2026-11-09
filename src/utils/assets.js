// Validation of uploaded fonts and images. Files are checked by extension, size AND content (magic bytes), never by MIME type alone.
export const LIMITS = { font: 2 * 1024 * 1024, logo: 1024 * 1024, favicon: 256 * 1024, maxFonts: 6 }
export const ALLOWED = {
  font: ['woff2', 'woff', 'ttf', 'otf'],
  logo: ['png', 'jpg', 'webp', 'svg'],
  favicon: ['png', 'svg', 'ico'],
}
export const ACCEPT = {
  font: '.woff2,.woff,.ttf,.otf',
  logo: '.png,.jpg,.jpeg,.webp,.svg',
  favicon: '.png,.svg,.ico',
}
export const MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon' }

export const extOf = (name) => {
  const e = String(name).split('.').pop().toLowerCase()
  return e === 'jpeg' ? 'jpg' : e
}

const startsWith = (b, sig) => sig.every((x, i) => b[i] === x)
const ascii = (b, from, to) => String.fromCharCode(...b.slice(from, to))

/** Detects the real type from the first bytes. Returns an extension-style id or null. */
export function sniff(bytes) {
  const b = bytes
  if (b.length < 4) return null
  if (ascii(b, 0, 4) === 'wOF2') return 'woff2'
  if (ascii(b, 0, 4) === 'wOFF') return 'woff'
  if (ascii(b, 0, 4) === 'OTTO') return 'otf'
  if (startsWith(b, [0, 1, 0, 0]) || ascii(b, 0, 4) === 'true') return 'ttf'
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47])) return 'png'
  if (startsWith(b, [0xff, 0xd8, 0xff])) return 'jpg'
  if (b.length > 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return 'webp'
  if (startsWith(b, [0, 0, 1, 0])) return 'ico'
  const head = new TextDecoder().decode(b.slice(0, 1024)).toLowerCase()
  if (head.includes('<svg')) return 'svg'
  return null
}

// Denylist of active or external content. An SVG shown through <img> cannot run script, but a file opened directly (or served by a
// host without a CSP) can, so anything that could execute or load a remote resource is rejected: scripts, event handlers
// (including "<svg/onload=...>"), SMIL animation, foreign objects, entity tricks, stylesheet imports, and any href that is not a
// same-document "#fragment" (so embedded or remote images are rejected too).
const UNSAFE_SVG = new RegExp([
  '<script', '<foreignobject', '<iframe', '<embed', '<object', '<audio', '<video', '<set\\b', '<animate',
  '<!entity', '<!doctype[^>]*\\[', '<\\?xml-stylesheet', '@import', 'javascript:', 'data:text', '&#',
  '[\\s/"\']on[a-z]+\\s*=', 'url\\(\\s*["\']?(?:https?:|//)', '(?:xlink:)?href\\s*=\\s*(?!["\']?\\s*#)',
].join('|'), 'i')

/** kind: 'font' | 'logo' | 'favicon'. Returns { ok: true, ext } or { ok: false, error: <i18n key> }. */
export function checkFile(kind, { name, size, bytes }) {
  const ext = extOf(name)
  if (!ALLOWED[kind].includes(ext)) return { ok: false, error: 'errFileType' }
  if (size === 0 || bytes.length === 0) return { ok: false, error: 'errFileEmpty' }
  if (size > LIMITS[kind]) return { ok: false, error: 'errFileSize' }
  if (sniff(bytes) !== ext) return { ok: false, error: 'errFileMismatch' }
  if (ext === 'svg' && UNSAFE_SVG.test(new TextDecoder().decode(bytes))) return { ok: false, error: 'errSvgUnsafe' }
  return { ok: true, ext }
}

/** Intrinsic size of an SVG from width/height or viewBox, or null. */
export function svgSize(bytes) {
  const text = new TextDecoder().decode(bytes.slice(0, 4096))
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0] || ''
  const num = (n) => { const m = new RegExp(`\\s${n}\\s*=\\s*["']?([\\d.]+)(?:px)?["']?`, 'i').exec(tag); return m ? parseFloat(m[1]) : 0 }
  let w = num('width'), h = num('height')
  if (!w || !h) { const vb = /viewBox\s*=\s*["']\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)/i.exec(tag); if (vb) { w = parseFloat(vb[1]); h = parseFloat(vb[2]) } }
  return w && h ? { width: w, height: h } : null
}

export const formatBytes = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`)

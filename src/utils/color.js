// Small color helpers for the theme system: hex parsing, mixing and WCAG contrast.
export const normalizeHex = (v) => {
  let h = String(v ?? '').trim().toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(h)) h = '#' + [...h.slice(1)].map((c) => c + c).join('')
  return /^#[0-9a-f]{6}$/.test(h) ? h : null
}
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (rgb) => '#' + rgb.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')

/** t = 0 returns a, t = 1 returns b. */
export const mix = (a, b, t) => { const A = toRgb(a), B = toRgb(b); return toHex(A.map((x, i) => x + (B[i] - x) * t)) }

export function luminance(h) {
  const c = toRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
/** Moves `color` toward `toward` in small steps until it reaches `min` contrast against `bg`. */
export function ensureContrast(color, bg, min, toward) {
  for (let t = 0; t <= 1.0001; t += 0.05) { const c = mix(color, toward, t); if (contrast(c, bg) >= min) return c }
  return toward
}
/** Dark or light text, whichever reads better on `bg`. */
export const bestOn = (bg) => (contrast(bg, '#0a0a0b') >= contrast(bg, '#ffffff') ? '#0a0a0b' : '#ffffff')
export const isLight = (h) => luminance(h) > 0.35

// Theme presets and token generation. Presets are plain token maps; custom colors are layered on top and checked for contrast.
// The output is a :root block that overrides the variables declared in src/styles/tokens.css.
import { normalizeHex, mix, contrast, ensureContrast, bestOn, isLight } from './color.js'

export const THEMES = {
  midnight: {
    label: 'Midnight', scheme: 'dark', description: 'Near-black with a soft blue accent. The default.',
    tokens: { bg: '#0a0a0b', surface: '#121214', surface2: '#1a1a1d', line: '#26262b', lineStrong: '#3a3a42', fg: '#ececee', body: '#cfcfd5', muted: '#9a9aa3', faint: '#80808a', accent: '#6db3f2', danger: '#f19999', tip: '#6fcf97', warning: '#f2c94c' },
  },
  graphite: {
    label: 'Graphite', scheme: 'dark', description: 'Neutral charcoal with a warm amber accent.',
    tokens: { bg: '#131416', surface: '#1a1b1e', surface2: '#222327', line: '#2c2d32', lineStrong: '#42444b', fg: '#f0f0f2', body: '#d2d3d8', muted: '#a1a3ab', faint: '#8a8d96', accent: '#e6a15c', danger: '#f19999', tip: '#6fcf97', warning: '#f2c94c' },
  },
  forest: {
    label: 'Forest', scheme: 'dark', description: 'Deep green-tinted dark with a fresh green accent.',
    tokens: { bg: '#0b100d', surface: '#111813', surface2: '#18211b', line: '#233027', lineStrong: '#36493c', fg: '#e9f0ea', body: '#ccd8cf', muted: '#97a89b', faint: '#82938a', accent: '#5fcf8f', danger: '#f19999', tip: '#6fcf97', warning: '#f2c94c' },
  },
  paper: {
    label: 'Paper', scheme: 'light', description: 'Warm off-white for long reading sessions.',
    tokens: { bg: '#fbfaf7', surface: '#f4f2ec', surface2: '#ebe8df', line: '#dcd8cc', lineStrong: '#c4bfb0', fg: '#1b1b1a', body: '#34332f', muted: '#5d5b54', faint: '#6b6960', accent: '#1d5fbf', danger: '#b42318', tip: '#15703b', warning: '#7a5000' },
  },
  daylight: {
    label: 'Daylight', scheme: 'light', description: 'Clean white with a crisp blue accent.',
    tokens: { bg: '#ffffff', surface: '#f5f7fa', surface2: '#eaeff5', line: '#dde3ea', lineStrong: '#c3ccd8', fg: '#14181f', body: '#2c3440', muted: '#566171', faint: '#657084', accent: '#0b6bcb', danger: '#b42318', tip: '#15703b', warning: '#7a5000' },
  },
}
export const DEFAULT_THEME = 'midnight'

const SEMANTIC = {
  dark: { danger: '#f19999', tip: '#6fcf97', warning: '#f2c94c' },
  light: { danger: '#b42318', tip: '#15703b', warning: '#7a5000' },
}
const VARS = { bg: '--color-bg', surface: '--color-surface', surface2: '--color-surface-2', line: '--color-line', lineStrong: '--color-line-strong', fg: '--color-fg', body: '--color-body', muted: '--color-muted', faint: '--color-faint', accent: '--color-accent', onAccent: '--color-on-accent', danger: '--color-danger', tip: '--color-tip', warning: '--color-warning' }

// Surfaces, borders and secondary text are derived from the chosen background and text colors.
function derive(bg, fg, scheme, accent) {
  const sem = SEMANTIC[scheme]
  return {
    bg, fg, accent,
    surface: mix(bg, fg, 0.04), surface2: mix(bg, fg, 0.08), line: mix(bg, fg, 0.14), lineStrong: mix(bg, fg, 0.24), body: mix(bg, fg, 0.86),
    muted: ensureContrast(mix(bg, fg, 0.62), bg, 4.5, fg),
    faint: ensureContrast(mix(bg, fg, 0.55), bg, 4.5, fg),
    // Callout labels sit on a background tinted with these colors, so they need more headroom than plain text (4.5:1).
    danger: ensureContrast(sem.danger, bg, 5.2, fg), tip: ensureContrast(sem.tip, bg, 5.2, fg), warning: ensureContrast(sem.warning, bg, 5.2, fg),
  }
}

/** theme = { preset, primary, bg, fg } (primary/bg/fg are hex or null). Returns tokens, scheme and contrast checks. */
export function resolveTheme(theme = {}) {
  const base = THEMES[theme.preset] || THEMES[DEFAULT_THEME]
  let tokens = { ...base.tokens }
  let scheme = base.scheme
  const bg = normalizeHex(theme.bg), fg = normalizeHex(theme.fg)
  if (bg || fg) {
    const B = bg || tokens.bg, F = fg || tokens.fg
    scheme = isLight(B) ? 'light' : 'dark'
    tokens = derive(B, F, scheme, tokens.accent)
  }
  const primary = normalizeHex(theme.primary)
  if (primary) tokens.accent = primary
  tokens.onAccent = bestOn(tokens.accent)

  const checks = [
    { id: 'text', ratio: contrast(tokens.fg, tokens.bg), min: 4.5, hard: 4.5 },
    { id: 'accent', ratio: contrast(tokens.accent, tokens.bg), min: 4.5, hard: 3 },
    { id: 'onAccent', ratio: contrast(tokens.onAccent, tokens.accent), min: 4.5, hard: 3 },
  ].map((c) => ({ ...c, ok: c.ratio >= c.min, blocking: c.ratio < c.hard }))
  return { tokens, scheme, checks, blocking: checks.filter((c) => c.blocking).map((c) => c.id) }
}

/** The nearest accent color that reads as text on the background (>= 4.5:1). */
export const suggestAccent = (tokens) => ensureContrast(tokens.accent, tokens.bg, 4.5, tokens.fg)

export const tokensCss = (tokens, scheme) => [...Object.entries(VARS).map(([k, v]) => `  ${v}: ${tokens[k]};`), `  --scheme: ${scheme};`].join('\n')

/** Inline style for a preview element: re-themes everything inside it without touching the page. */
export const previewStyle = (tokens, scheme) => ({ ...Object.fromEntries(Object.entries(VARS).map(([k, v]) => [v, tokens[k]])), '--scheme': scheme })

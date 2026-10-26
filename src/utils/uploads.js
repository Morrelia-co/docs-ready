// Browser-side handling of uploaded files. Everything stays in memory; nothing is sent anywhere.
import { markRaw } from 'vue'
import { checkFile, svgSize, MIME } from './assets.js'
import { previewFamily } from './fonts.js'

/** Reads a File and validates it. Returns { ok, error?, ext?, bytes? }. */
export async function readUpload(kind, file) {
  const bytes = markRaw(new Uint8Array(await file.arrayBuffer()))
  const res = checkFile(kind, { name: file.name, size: file.size, bytes })
  return res.ok ? { ok: true, ext: res.ext, bytes } : res
}

/** Confirms the browser can actually parse the font (skipped where FontFace is unavailable). */
export async function verifyFont(bytes) {
  if (typeof FontFace === 'undefined') return true
  try { await new FontFace('ob-check', bytes.slice().buffer).load(); return true } catch { return false }
}

/** Decodes a raster image to read its size and prove it is a real image. SVG sizes come from the markup. */
export async function measureImage(bytes, ext) {
  if (ext === 'svg') return svgSize(bytes) || { width: 0, height: 0 }
  if (ext === 'ico' || typeof createImageBitmap === 'undefined') return { width: 0, height: 0 }
  try {
    const bmp = await createImageBitmap(new Blob([bytes], { type: MIME[ext] }))
    const size = { width: bmp.width, height: bmp.height }
    bmp.close?.()
    return size
  } catch { return null }
}

export const previewUrl = (bytes, ext) => URL.createObjectURL(new Blob([bytes], { type: MIME[ext] }))

// Keeps document.fonts in sync with the uploaded files so every preview can use them.
const registered = new Map()
export function syncPreviewFonts(files) {
  if (typeof FontFace === 'undefined') return
  const wanted = new Map(files.map((f) => [f.id, `${f.family}|${f.weight}|${f.style}`]))
  for (const [id, entry] of registered) {
    if (wanted.get(id) !== entry.key) { document.fonts.delete(entry.face); registered.delete(id) }
  }
  for (const f of files) {
    if (registered.has(f.id)) continue
    const face = new FontFace(previewFamily(f.family), f.bytes.slice().buffer, { weight: String(f.weight), style: f.style })
    document.fonts.add(face)
    face.load().catch(() => {})
    registered.set(f.id, { key: wanted.get(f.id), face })
  }
}

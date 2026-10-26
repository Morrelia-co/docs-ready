// Minimal ZIP writer (store method, no compression). Enough for a handful of small text files, so no dependency is needed.
const TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()

export function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** files: [{ path, content: string | Uint8Array }] -> Uint8Array containing a valid .zip (UTF-8 names). */
export function createZip(files, now = new Date()) {
  const enc = new TextEncoder()
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()
  const entries = files.map((f) => {
    const name = enc.encode(f.path)
    const data = typeof f.content === 'string' ? enc.encode(f.content) : f.content
    return { name, data, crc: crc32(data) }
  })
  let size = 22
  for (const e of entries) size += 76 + e.name.length * 2 + e.data.length
  const out = new Uint8Array(size)
  const v = new DataView(out.buffer)
  let p = 0
  const u16 = (x) => { v.setUint16(p, x, true); p += 2 }
  const u32 = (x) => { v.setUint32(p, x, true); p += 4 }
  const offsets = []
  for (const e of entries) {
    offsets.push(p)
    u32(0x04034b50); u16(20); u16(0x0800); u16(0); u16(time); u16(date)
    u32(e.crc); u32(e.data.length); u32(e.data.length); u16(e.name.length); u16(0)
    out.set(e.name, p); p += e.name.length
    out.set(e.data, p); p += e.data.length
  }
  const cd = p
  entries.forEach((e, i) => {
    u32(0x02014b50); u16(0x031e); u16(20); u16(0x0800); u16(0); u16(time); u16(date)
    u32(e.crc); u32(e.data.length); u32(e.data.length); u16(e.name.length)
    u16(0); u16(0); u16(0); u16(0); u32((0o100644 << 16) >>> 0); u32(offsets[i])
    out.set(e.name, p); p += e.name.length
  })
  const cdSize = p - cd // measured before the end record is written
  u32(0x06054b50); u16(0); u16(0); u16(entries.length); u16(entries.length); u32(cdSize); u32(cd); u16(0)
  return out
}

export function downloadBlob(filename, bytes, type = 'application/zip') {
  const url = URL.createObjectURL(new Blob([bytes], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

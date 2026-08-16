// Dependency-free PNG icon generator (no sharp/ImageMagick available in this
// environment) — hand-rolls the PNG chunks. Brand-blue square with a centered
// white circle, echoing the "RL" badge used in the sidebar/login screen.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const BRAND = [0x37, 0x63, 0xf4] // #3763f4
const WHITE = [0xff, 0xff, 0xff]

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function generatePng(size, circleRadiusRatio) {
  const raw = Buffer.alloc(size * (1 + size * 4)) // filter byte + RGBA per row
  const cx = size / 2
  const cy = size / 2
  const r = size * circleRadiusRatio

  let offset = 0
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const inCircle = dx * dx + dy * dy <= r * r
      const [r8, g8, b8] = inCircle ? WHITE : BRAND
      raw[offset++] = r8
      raw[offset++] = g8
      raw[offset++] = b8
      raw[offset++] = 0xff
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type RGBA
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0

  const idatData = deflateSync(raw)

  return Buffer.concat([signature, chunk('IHDR', ihdrData), chunk('IDAT', idatData), chunk('IEND', Buffer.alloc(0))])
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', generatePng(192, 0.32))
writeFileSync('public/icons/icon-512.png', generatePng(512, 0.32))
// Maskable: keep the mark within the ~80% safe zone so OS masks don't clip it.
writeFileSync('public/icons/maskable-512.png', generatePng(512, 0.28))

console.log('Generated public/icons/{icon-192,icon-512,maskable-512}.png')

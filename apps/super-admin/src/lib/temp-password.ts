import { randomBytes } from 'crypto'

/** Human-typeable temp password (no email delivery yet — see Phase 6). */
export function generateTempPassword(): string {
  const words = ['Harbor', 'Lantern', 'Cedar', 'Comet', 'Marble', 'Falcon', 'Willow', 'Quartz']
  const word = words[randomBytes(1)[0] % words.length]
  const digits = randomBytes(3).readUIntBE(0, 3) % 1000
  return `${word}${digits}!`
}

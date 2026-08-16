import { randomBytes } from 'crypto'

/** Human-typeable temp password, shown once in the UI — no email delivery in V1. */
export function generateTempPassword(): string {
  const words = ['Harbor', 'Lantern', 'Cedar', 'Comet', 'Marble', 'Falcon', 'Willow', 'Quartz']
  const word = words[randomBytes(1)[0] % words.length]
  const digits = randomBytes(3).readUIntBE(0, 3) % 1000
  return `${word}${digits}!`
}

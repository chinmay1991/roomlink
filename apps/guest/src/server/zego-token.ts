import { createCipheriv, createHash } from 'crypto'
import { ConfigurationError } from '@/server/errors'

/**
 * ZegoCloud caps userID at 32 bytes. A raw UUID with a readable prefix
 * ("guest_" + a 36-char guest_sessions.session_id, or "staff_" + a 36-char
 * users.user_id) comes to 42 bytes — over the limit, and the SDK fails
 * silently at login/invite rather than with an obvious validation error.
 * Hashing is one-way, which is fine here: both sides only ever need to
 * re-derive the same id from the same source id, never invert it back.
 */
export function shortZegoId(prefix: 'g' | 's', sourceId: string): string {
  return prefix + createHash('sha256').update(sourceId).digest('hex').slice(0, 24)
}

/**
 * Server-side generator for a ZegoCloud "Token04" — the token the Call
 * Invitation UIKit needs before a user can log in and place/receive a voice
 * call. ZegoCloud doesn't publish this as an npm package, only as per-language
 * sample source; this is a straight port of their official Node/TS reference
 * (https://github.com/ZEGOCLOUD/zego_server_assistant/blob/master/token/nodejs/server/zegoServerAssistant.ts),
 * kept byte-for-byte compatible with that binary layout so it verifies
 * correctly against ZegoCloud's servers.
 */

const IV_CHARSET = '0123456789abcdefghijklmnopqrstuvwxyz'

function randomNonce(): number {
  return Math.floor(Math.random() * (2147483647 - -2147483648 + 1)) + -2147483648
}

function randomIv(): string {
  let iv = ''
  for (let i = 0; i < 16; i++) iv += IV_CHARSET.charAt(Math.floor(Math.random() * IV_CHARSET.length))
  return iv
}

// serverSecret is always required to be exactly 32 bytes (enforced in
// getZegoCredentials below), which maps to aes-256-cbc.
function aesEncrypt(plainText: string, key: string, iv: string): Buffer {
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  cipher.setAutoPadding(true)
  return Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
}

function getZegoCredentials(): { appId: number; serverSecret: string } {
  const appId = Number(process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID)
  const serverSecret = process.env.ZEGOCLOUD_SERVER_SECRET

  if (!process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID || Number.isNaN(appId)) {
    throw new ConfigurationError(
      'NEXT_PUBLIC_ZEGOCLOUD_APP_ID is not set or invalid. Configure it before generating voice-call tokens.',
    )
  }
  if (!serverSecret || serverSecret.length !== 32) {
    throw new ConfigurationError(
      'ZEGOCLOUD_SERVER_SECRET is not set or is not a 32-character key. Configure it before generating voice-call tokens.',
    )
  }

  return { appId, serverSecret }
}

/**
 * Generates a short-lived Token04 for `userId`. When `roomId` is given, the
 * token's privilege payload is scoped to allow login/publish only in that
 * room (mirrors ZegoCloud's documented room-scoped sample); omit it for a
 * basic, unscoped token (e.g. a listener that isn't tied to one call yet).
 */
export function generateZegoToken(userId: string, effectiveTimeInSeconds = 300, roomId?: string): string {
  const { appId, serverSecret } = getZegoCredentials()

  const createTime = Math.floor(Date.now() / 1000)
  const payload = roomId
    ? JSON.stringify({ room_id: roomId, privilege: { 1: 1, 2: 1 }, stream_id_list: null })
    : ''
  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: randomNonce(),
    ctime: createTime,
    expire: createTime + effectiveTimeInSeconds,
    payload,
  }

  const iv = randomIv()
  const cipherText = aesEncrypt(JSON.stringify(tokenInfo), serverSecret, iv)

  const expireBuf = Buffer.alloc(8)
  expireBuf.writeBigInt64BE(BigInt(tokenInfo.expire))
  const ivLengthBuf = Buffer.alloc(2)
  ivLengthBuf.writeUInt16BE(iv.length)
  const cipherLengthBuf = Buffer.alloc(2)
  cipherLengthBuf.writeUInt16BE(cipherText.length)

  const packed = Buffer.concat([expireBuf, ivLengthBuf, Buffer.from(iv), cipherLengthBuf, cipherText])

  return '04' + packed.toString('base64')
}

export function getZegoAppId(): number {
  return getZegoCredentials().appId
}

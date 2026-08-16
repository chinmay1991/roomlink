import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import type { SessionUser } from '@/server/rbac'

export async function beginMfaSetup(userId: string, email: string) {
  const secret = authenticator.generateSecret()
  const otpauthUrl = authenticator.keyuri(email, 'RoomLink Admin', secret)
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)
  return { secret, qrCodeDataUrl }
}

export function verifyMfaToken(secret: string, token: string): boolean {
  try {
    return authenticator.check(token, secret)
  } catch {
    return false
  }
}

export async function enableMfa(userId: string, secret: string, token: string, actor: SessionUser) {
  if (!verifyMfaToken(secret, token)) {
    return { ok: false as const, error: 'That code is incorrect or expired.' }
  }

  await prisma.users.update({ where: { user_id: userId }, data: { mfa_enabled: true, mfa_secret: secret } })
  await recordAudit({ actorId: actor.id, actorType: 'super_admin', action: 'user.mfa_enabled', entityType: 'user', entityId: userId })

  return { ok: true as const }
}

export async function disableMfa(userId: string, actor: SessionUser) {
  await prisma.users.update({ where: { user_id: userId }, data: { mfa_enabled: false, mfa_secret: null } })
  await recordAudit({ actorId: actor.id, actorType: 'super_admin', action: 'user.mfa_disabled', entityType: 'user', entityId: userId })
}

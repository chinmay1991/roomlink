import bcrypt from 'bcryptjs'
import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import type { SessionUser } from '@/server/rbac'

export async function getOwnProfile(userId: string) {
  return prisma.users.findUniqueOrThrow({
    where: { user_id: userId },
    select: { user_id: true, full_name: true, email: true, phone: true, user_type: true, mfa_enabled: true, last_login_at: true },
  })
}

export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string, actor: SessionUser) {
  const user = await prisma.users.findUniqueOrThrow({ where: { user_id: userId } })
  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) return { ok: false as const, error: 'Current password is incorrect.' }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.users.update({ where: { user_id: userId }, data: { password_hash: passwordHash } })

  await recordAudit({ actorId: actor.id, actorType: 'super_admin', action: 'user.password_changed', entityType: 'user', entityId: userId })

  return { ok: true as const }
}

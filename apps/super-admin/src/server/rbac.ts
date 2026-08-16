import { prisma } from '@/server/db'
import { Action, Module, SUPER_ADMIN_ONLY_WRITE_MODULES } from '@/lib/permissions'

export type SessionUser = {
  id: string
  userType: string
  roleId: string
}

/**
 * super_admin can do everything. support_staff is scoped by role_permissions,
 * with money/platform-config modules locked to super_admin regardless of
 * what role_permissions says (see SUPER_ADMIN_ONLY_WRITE_MODULES).
 */
export async function can(user: SessionUser, module: Module, action: Action): Promise<boolean> {
  if (user.userType === 'super_admin') return true
  if (user.userType !== 'support_staff') return false

  if (action !== 'view' && SUPER_ADMIN_ONLY_WRITE_MODULES.includes(module)) {
    return false
  }

  const permission = await prisma.permissions.findUnique({ where: { module } })
  if (!permission) return action === 'view'

  const grant = await prisma.role_permissions.findUnique({
    where: { role_id_permission_id: { role_id: user.roleId, permission_id: permission.permission_id } },
  })
  if (!grant) return false

  switch (action) {
    case 'view':
      return grant.can_view
    case 'create':
      return grant.can_create
    case 'edit':
      return grant.can_edit
    case 'delete':
      return grant.can_delete
  }
}

export async function requireCan(user: SessionUser, module: Module, action: Action) {
  const allowed = await can(user, module, action)
  if (!allowed) {
    throw new ForbiddenError(`${user.userType} lacks ${action} on ${module}`)
  }
}

export class ForbiddenError extends Error {}

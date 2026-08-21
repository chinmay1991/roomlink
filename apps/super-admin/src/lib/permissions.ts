/**
 * Mirrors the Super Admin portal's global navigation (see the PRD).
 * Doubles as the `permissions.module` value used by role_permissions.
 */
export const MODULES = [
  'dashboard',
  'hotels',
  'subscriptions',
  'users',
  'onboarding',
  'support',
  'analytics',
  'billing',
  'integrations',
  'settings',
  'audit_logs',
  'departments',
] as const

export type Module = (typeof MODULES)[number]

export type Action = 'view' | 'create' | 'edit' | 'delete'

/** user_type values allowed to sign in to this portal at all. */
export const PORTAL_USER_TYPES = ['super_admin', 'support_staff'] as const
export type PortalUserType = (typeof PORTAL_USER_TYPES)[number]

/**
 * Modules support staff cannot mutate even with a permissive role_permissions
 * row — money and platform config stay super-admin-only by default.
 */
export const SUPER_ADMIN_ONLY_WRITE_MODULES: Module[] = ['billing', 'subscriptions', 'integrations', 'settings']

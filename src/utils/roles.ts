import type { AuthRole } from '../types'

/** 角色名包含 admin 即视为管理员（兼容 super_admin） */
export function isAdminRoleName(name: string): boolean {
  return name.toLowerCase().includes('admin')
}

export function hasUserRole(roles: AuthRole[] | string[] | null | undefined): boolean {
  const names = normalizeRoleNames(roles)
  return names.includes('user')
}

export function hasAdminRole(roles: AuthRole[] | string[] | null | undefined): boolean {
  return normalizeRoleNames(roles).some(isAdminRoleName)
}

/** 仅管理员：有 admin、无 user */
export function isAdminOnly(roles: AuthRole[] | string[] | null | undefined): boolean {
  return hasAdminRole(roles) && !hasUserRole(roles)
}

/** 双角色：既有 user 又有 admin */
export function isDualRole(roles: AuthRole[] | string[] | null | undefined): boolean {
  return hasUserRole(roles) && hasAdminRole(roles)
}

export function normalizeRoleNames(roles: AuthRole[] | string[] | null | undefined): string[] {
  if (!roles?.length) return []
  return roles.map((role) => (typeof role === 'string' ? role : role.name).trim().toLowerCase())
}

export function parseAuthRoles(raw: unknown): AuthRole[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item }
      }
      if (item && typeof item === 'object' && 'name' in item) {
        const name = String((item as { name: unknown }).name ?? '').trim()
        if (!name) return null
        const id = 'id' in item ? String((item as { id: unknown }).id ?? '') : undefined
        return id ? { id, name } : { name }
      }
      return null
    })
    .filter((role): role is AuthRole => role !== null)
}

export function parseAuthPermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => String(item).trim()).filter(Boolean)
}

export function hasPermission(
  permissions: string[] | null | undefined,
  required: string | string[] | null | undefined,
): boolean {
  if (!required) return true
  const codes = permissions ?? []
  const needed = Array.isArray(required) ? required : [required]
  return needed.some((code) => codes.includes(code))
}

/** 是否具备进入管理端的权限（任一管理权限码即可） */
export function canAccessAdmin(
  roles: AuthRole[] | string[] | null | undefined,
  permissions: string[] | null | undefined,
): boolean {
  return hasAdminRole(roles) || (permissions?.length ?? 0) > 0
}

/** 登录后默认落地路径 */
export function getDefaultHomePath(
  roles: AuthRole[] | string[] | null | undefined,
  permissions?: string[] | null,
): string {
  if (isAdminOnly(roles) && canAccessAdmin(roles, permissions)) return '/admin'
  return '/writing'
}

export const ADMIN_DEFAULT_PATH = '/admin'

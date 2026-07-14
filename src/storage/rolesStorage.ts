import type { AuthRole } from '../types'
import { parseAuthRoles } from '../utils/roles'

const ROLES_KEY = 'ew_user_roles'

export function getStoredRoles(): AuthRole[] {
  try {
    const raw = localStorage.getItem(ROLES_KEY)
    if (!raw) return []
    return parseAuthRoles(JSON.parse(raw))
  } catch {
    return []
  }
}

export function setStoredRoles(roles: AuthRole[]): void {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
}

export function clearStoredRoles(): void {
  localStorage.removeItem(ROLES_KEY)
}

const PERMISSIONS_KEY = 'ew_user_permissions'

export function getStoredPermissions(): string[] {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => String(item)).filter(Boolean)
  } catch {
    return []
  }
}

export function setStoredPermissions(permissions: string[]): void {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions))
}

export function clearStoredPermissions(): void {
  localStorage.removeItem(PERMISSIONS_KEY)
}

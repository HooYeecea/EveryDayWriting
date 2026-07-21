const AUTH_PATHS = ['/login', '/register', '/forgot-password'] as const

export type AuthPath = (typeof AUTH_PATHS)[number]

export function isAuthPath(pathname: string): pathname is AuthPath {
  return (AUTH_PATHS as readonly string[]).includes(pathname)
}

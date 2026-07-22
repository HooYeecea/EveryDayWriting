import { hasPermission } from '../utils/roles'

/** 管理端默认落地路径（无权限列表可用时） */
export const ADMIN_DEFAULT_PATH = '/admin'

/**
 * 仅路径 + 权限元数据，供 App 壳层鉴权跳转使用。
 * 刻意不引用页面组件 / lucide，避免把后台图表等大包卷进用户端入口预加载图。
 */
export const ADMIN_PATH_ENTRIES: ReadonlyArray<{
  path: string
  permission?: string | string[] | null
}> = [
  { path: '/admin', permission: 'dashboard:view' },
  { path: '/admin/system', permission: 'monitor:view' },
  { path: '/admin/token-usage', permission: 'token_usage:view' },
  { path: '/admin/users', permission: 'user:list' },
  { path: '/admin/roles', permission: 'role:manage' },
  { path: '/admin/announcements', permission: 'announcement:manage' },
  { path: '/admin/agreements', permission: 'agreement:manage' },
  { path: '/admin/quotes', permission: 'quotes:manage' },
  { path: '/admin/checkin-tiers', permission: 'checkin_tier:manage' },
  { path: '/admin/topic-types', permission: 'topic_type:manage' },
  { path: '/admin/writing-topics', permission: 'topic_type:manage' },
  { path: '/admin/questions', permission: 'test_question:manage' },
  { path: '/admin/prompts', permission: 'prompt:manage' },
  { path: '/admin/providers', permission: 'provider:manage' },
  { path: '/admin/configs', permission: 'config:manage' },
  { path: '/admin/access-logs', permission: 'access_log:view' },
  { path: '/admin/audit-logs', permission: 'audit:view' },
]

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function canAccessAdminPath(pathname: string, permissions: string[]): boolean {
  const route = ADMIN_PATH_ENTRIES.find((item) => item.path === pathname)
  if (!route) return false
  if (!route.permission) return permissions.length > 0
  return hasPermission(permissions, route.permission)
}

export function getFirstAllowedAdminPath(permissions: string[]): string {
  const first = ADMIN_PATH_ENTRIES.find((route) => {
    if (!route.permission) return permissions.length > 0
    return hasPermission(permissions, route.permission)
  })
  return first?.path ?? ADMIN_DEFAULT_PATH
}

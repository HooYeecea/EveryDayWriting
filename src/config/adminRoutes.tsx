import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  FileText,
  Gauge,
  LayoutDashboard,
  ListOrdered,
  Quote,
  ScrollText,
  Settings,
  Shield,
  Trophy,
  Users,
  Cpu,
} from 'lucide-react'
import { AdminDashboardPage } from '../components/admin/pages/AdminDashboardPage'
import { AdminUsersPage } from '../components/admin/pages/AdminUsersPage'
import { AdminAnnouncementsPage } from '../components/admin/pages/AdminAnnouncementsPage'
import { AdminConfigsPage } from '../components/admin/pages/AdminConfigsPage'
import { AdminQuotesPage } from '../components/admin/pages/AdminQuotesPage'
import { AdminCheckInTiersPage } from '../components/admin/pages/AdminCheckInTiersPage'
import { AdminTopicTypesPage } from '../components/admin/pages/AdminTopicTypesPage'
import { AdminTokenUsagePage } from '../components/admin/pages/AdminTokenUsagePage'
import { AdminAuditLogsPage } from '../components/admin/pages/AdminAuditLogsPage'
import { AdminProvidersPage } from '../components/admin/pages/AdminProvidersPage'
import { AdminRolesPage } from '../components/admin/pages/AdminRolesPage'
import { AdminAgreementsPage } from '../components/admin/pages/AdminAgreementsPage'
import { hasPermission } from '../utils/roles'

export type AdminMenuKey =
  | 'dashboard'
  | 'users'
  | 'announcements'
  | 'configs'
  | 'quotes'
  | 'checkin-tiers'
  | 'topic-types'
  | 'token-usage'
  | 'audit-logs'
  | 'providers'
  | 'roles'
  | 'agreements'

export interface AdminRoute {
  key: AdminMenuKey
  path: string
  label: string
  icon: LucideIcon
  element: ReactNode
  /** 进入该菜单所需权限码；概览页不设，有任一管理权限即可 */
  permission?: string | string[] | null
}

export const ADMIN_DEFAULT_PATH = '/admin'

export const ADMIN_ROUTES: AdminRoute[] = [
  {
    key: 'dashboard',
    path: '/admin',
    label: '概览',
    icon: LayoutDashboard,
    element: <AdminDashboardPage />,
    permission: null,
  },
  {
    key: 'users',
    path: '/admin/users',
    label: '用户管理',
    icon: Users,
    element: <AdminUsersPage />,
    permission: 'user:list',
  },
  {
    key: 'announcements',
    path: '/admin/announcements',
    label: '公告管理',
    icon: Bell,
    element: <AdminAnnouncementsPage />,
    permission: 'announcement:manage',
  },
  {
    key: 'agreements',
    path: '/admin/agreements',
    label: '协议管理',
    icon: FileText,
    element: <AdminAgreementsPage />,
    permission: 'agreement:manage',
  },
  {
    key: 'quotes',
    path: '/admin/quotes',
    label: '励志语录',
    icon: Quote,
    element: <AdminQuotesPage />,
    permission: 'quotes:manage',
  },
  {
    key: 'checkin-tiers',
    path: '/admin/checkin-tiers',
    label: '签到段位',
    icon: Trophy,
    element: <AdminCheckInTiersPage />,
    permission: 'checkin_tier:manage',
  },
  {
    key: 'topic-types',
    path: '/admin/topic-types',
    label: '题目类型',
    icon: ListOrdered,
    element: <AdminTopicTypesPage />,
    permission: 'topic_type:manage',
  },
  {
    key: 'providers',
    path: '/admin/providers',
    label: '模型供应商',
    icon: Cpu,
    element: <AdminProvidersPage />,
    permission: 'provider:manage',
  },
  {
    key: 'roles',
    path: '/admin/roles',
    label: '角色权限',
    icon: Shield,
    element: <AdminRolesPage />,
    permission: 'role:manage',
  },
  {
    key: 'configs',
    path: '/admin/configs',
    label: '系统配置',
    icon: Settings,
    element: <AdminConfigsPage />,
    permission: 'config:manage',
  },
  {
    key: 'token-usage',
    path: '/admin/token-usage',
    label: 'Token 用量',
    icon: Gauge,
    element: <AdminTokenUsagePage />,
    permission: 'token_usage:view',
  },
  {
    key: 'audit-logs',
    path: '/admin/audit-logs',
    label: '操作审计',
    icon: ScrollText,
    element: <AdminAuditLogsPage />,
    permission: 'audit:view',
  },
]

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function getVisibleAdminRoutes(permissions: string[]): AdminRoute[] {
  return ADMIN_ROUTES.filter((route) => {
    if (!route.permission) {
      return permissions.length > 0
    }
    return hasPermission(permissions, route.permission)
  })
}

export function getFirstAllowedAdminPath(permissions: string[]): string {
  const visible = getVisibleAdminRoutes(permissions)
  return visible[0]?.path ?? ADMIN_DEFAULT_PATH
}

export function canAccessAdminPath(pathname: string, permissions: string[]): boolean {
  const route = ADMIN_ROUTES.find((item) => item.path === pathname)
  if (!route) return false
  if (!route.permission) return permissions.length > 0
  return hasPermission(permissions, route.permission)
}

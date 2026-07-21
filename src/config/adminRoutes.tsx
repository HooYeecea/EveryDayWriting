import { lazy, type ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bell,
  FileText,
  Gauge,
  Globe2,
  LayoutDashboard,
  ListOrdered,
  MessageSquare,
  PenLine,
  Quote,
  ScrollText,
  Settings,
  Shield,
  Trophy,
  Users,
  Cpu,
} from 'lucide-react'
import { hasPermission } from '../utils/roles'

export type AdminMenuKey =
  | 'dashboard'
  | 'system'
  | 'users'
  | 'announcements'
  | 'configs'
  | 'quotes'
  | 'checkin-tiers'
  | 'topic-types'
  | 'writing-topics'
  | 'token-usage'
  | 'audit-logs'
  | 'access-logs'
  | 'providers'
  | 'roles'
  | 'agreements'
  | 'prompts'
  | 'questions'

export type AdminMenuGroupKey =
  | 'overview'
  | 'access'
  | 'content'
  | 'topics'
  | 'system'

export type AdminPageProps = {
  onReady?: () => void
}

export interface AdminRoute {
  key: AdminMenuKey
  path: string
  label: string
  icon: LucideIcon
  component: ComponentType<AdminPageProps>
  /** 进入该菜单所需权限码；概览页不设，有任一管理权限即可 */
  permission?: string | string[] | null
}

export interface AdminMenuGroup {
  key: AdminMenuGroupKey
  label: string
  routeKeys: AdminMenuKey[]
}

export interface AdminVisibleMenuGroup {
  key: AdminMenuGroupKey
  label: string
  routes: AdminRoute[]
}

export const ADMIN_DEFAULT_PATH = '/admin'

export const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    key: 'overview',
    label: '概览',
    routeKeys: ['dashboard', 'system', 'token-usage'],
  },
  {
    key: 'access',
    label: '用户与权限',
    routeKeys: ['users', 'roles'],
  },
  {
    key: 'content',
    label: '内容运营',
    routeKeys: ['announcements', 'agreements', 'quotes', 'checkin-tiers'],
  },
  {
    key: 'topics',
    label: '题库与写作',
    routeKeys: ['topic-types', 'writing-topics', 'questions', 'prompts'],
  },
  {
    key: 'system',
    label: '系统与安全',
    routeKeys: ['providers', 'configs', 'access-logs', 'audit-logs'],
  },
]

const AdminDashboardPage = lazy(() =>
  import('../components/admin/pages/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
)
const AdminSystemPage = lazy(() =>
  import('../components/admin/pages/AdminSystemPage').then((m) => ({
    default: m.AdminSystemPage,
  })),
)
const AdminUsersPage = lazy(() =>
  import('../components/admin/pages/AdminUsersPage').then((m) => ({
    default: m.AdminUsersPage,
  })),
)
const AdminAnnouncementsPage = lazy(() =>
  import('../components/admin/pages/AdminAnnouncementsPage').then((m) => ({
    default: m.AdminAnnouncementsPage,
  })),
)
const AdminConfigsPage = lazy(() =>
  import('../components/admin/pages/AdminConfigsPage').then((m) => ({
    default: m.AdminConfigsPage,
  })),
)
const AdminQuotesPage = lazy(() =>
  import('../components/admin/pages/AdminQuotesPage').then((m) => ({
    default: m.AdminQuotesPage,
  })),
)
const AdminCheckInTiersPage = lazy(() =>
  import('../components/admin/pages/AdminCheckInTiersPage').then((m) => ({
    default: m.AdminCheckInTiersPage,
  })),
)
const AdminTopicTypesPage = lazy(() =>
  import('../components/admin/pages/AdminTopicTypesPage').then((m) => ({
    default: m.AdminTopicTypesPage,
  })),
)
const AdminWritingTopicsPage = lazy(() =>
  import('../components/admin/pages/AdminWritingTopicsPage').then((m) => ({
    default: m.AdminWritingTopicsPage,
  })),
)
const AdminTokenUsagePage = lazy(() =>
  import('../components/admin/pages/AdminTokenUsagePage').then((m) => ({
    default: m.AdminTokenUsagePage,
  })),
)
const AdminAuditLogsPage = lazy(() =>
  import('../components/admin/pages/AdminAuditLogsPage').then((m) => ({
    default: m.AdminAuditLogsPage,
  })),
)
const AdminAccessLogsPage = lazy(() =>
  import('../components/admin/pages/AdminAccessLogsPage').then((m) => ({
    default: m.AdminAccessLogsPage,
  })),
)
const AdminProvidersPage = lazy(() =>
  import('../components/admin/pages/AdminProvidersPage').then((m) => ({
    default: m.AdminProvidersPage,
  })),
)
const AdminRolesPage = lazy(() =>
  import('../components/admin/pages/AdminRolesPage').then((m) => ({
    default: m.AdminRolesPage,
  })),
)
const AdminAgreementsPage = lazy(() =>
  import('../components/admin/pages/AdminAgreementsPage').then((m) => ({
    default: m.AdminAgreementsPage,
  })),
)
const AdminPromptsPage = lazy(() =>
  import('../components/admin/pages/AdminPromptsPage').then((m) => ({
    default: m.AdminPromptsPage,
  })),
)
const AdminQuestionsPage = lazy(() =>
  import('../components/admin/pages/AdminQuestionsPage').then((m) => ({
    default: m.AdminQuestionsPage,
  })),
)

export const ADMIN_ROUTES: AdminRoute[] = [
  {
    key: 'dashboard',
    path: '/admin',
    label: '数据中心',
    icon: LayoutDashboard,
    component: AdminDashboardPage,
    permission: 'dashboard:view',
  },
  {
    key: 'system',
    path: '/admin/system',
    label: '系统监控',
    icon: Activity,
    component: AdminSystemPage,
    permission: 'monitor:view',
  },
  {
    key: 'token-usage',
    path: '/admin/token-usage',
    label: 'Token 用量',
    icon: Gauge,
    component: AdminTokenUsagePage,
    permission: 'token_usage:view',
  },
  {
    key: 'users',
    path: '/admin/users',
    label: '用户管理',
    icon: Users,
    component: AdminUsersPage,
    permission: 'user:list',
  },
  {
    key: 'roles',
    path: '/admin/roles',
    label: '角色权限',
    icon: Shield,
    component: AdminRolesPage,
    permission: 'role:manage',
  },
  {
    key: 'announcements',
    path: '/admin/announcements',
    label: '公告管理',
    icon: Bell,
    component: AdminAnnouncementsPage,
    permission: 'announcement:manage',
  },
  {
    key: 'agreements',
    path: '/admin/agreements',
    label: '协议管理',
    icon: FileText,
    component: AdminAgreementsPage,
    permission: 'agreement:manage',
  },
  {
    key: 'quotes',
    path: '/admin/quotes',
    label: '励志语录',
    icon: Quote,
    component: AdminQuotesPage,
    permission: 'quotes:manage',
  },
  {
    key: 'checkin-tiers',
    path: '/admin/checkin-tiers',
    label: '签到段位',
    icon: Trophy,
    component: AdminCheckInTiersPage,
    permission: 'checkin_tier:manage',
  },
  {
    key: 'topic-types',
    path: '/admin/topic-types',
    label: '题目类型',
    icon: ListOrdered,
    component: AdminTopicTypesPage,
    permission: 'topic_type:manage',
  },
  {
    key: 'writing-topics',
    path: '/admin/writing-topics',
    label: '写作题库',
    icon: PenLine,
    component: AdminWritingTopicsPage,
    permission: 'topic_type:manage',
  },
  {
    key: 'questions',
    path: '/admin/questions',
    label: '题库管理',
    icon: ListOrdered,
    component: AdminQuestionsPage,
    permission: 'test_question:manage',
  },
  {
    key: 'prompts',
    path: '/admin/prompts',
    label: 'Prompt 模板',
    icon: MessageSquare,
    component: AdminPromptsPage,
    permission: 'prompt:manage',
  },
  {
    key: 'providers',
    path: '/admin/providers',
    label: '模型供应商',
    icon: Cpu,
    component: AdminProvidersPage,
    permission: 'provider:manage',
  },
  {
    key: 'configs',
    path: '/admin/configs',
    label: '系统配置',
    icon: Settings,
    component: AdminConfigsPage,
    permission: 'config:manage',
  },
  {
    key: 'access-logs',
    path: '/admin/access-logs',
    label: '访问记录',
    icon: Globe2,
    component: AdminAccessLogsPage,
    permission: 'access_log:view',
  },
  {
    key: 'audit-logs',
    path: '/admin/audit-logs',
    label: '操作审计',
    icon: ScrollText,
    component: AdminAuditLogsPage,
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

export function getVisibleAdminMenuGroups(permissions: string[]): AdminVisibleMenuGroup[] {
  const byKey = new Map(getVisibleAdminRoutes(permissions).map((route) => [route.key, route]))

  return ADMIN_MENU_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    routes: group.routeKeys.map((key) => byKey.get(key)).filter(Boolean) as AdminRoute[],
  })).filter((group) => group.routes.length > 0)
}

export function canAccessAdminPath(pathname: string, permissions: string[]): boolean {
  const route = ADMIN_ROUTES.find((item) => item.path === pathname)
  if (!route) return false
  if (!route.permission) return permissions.length > 0
  return hasPermission(permissions, route.permission)
}

export function getFirstAllowedAdminPath(permissions: string[]): string {
  const first = getVisibleAdminRoutes(permissions)[0]
  return first?.path ?? ADMIN_DEFAULT_PATH
}

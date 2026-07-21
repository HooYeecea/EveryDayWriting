import { lazy, type ComponentType } from 'react'
import type { MenuKey } from '../types'
import type { AppPageProps } from './appRouteTypes'

export type { AppPageProps } from './appRouteTypes'

export interface AppRoute {
  key: MenuKey
  path: string
  label: string
  icon: 'user' | 'pen' | 'clipboard' | 'book' | 'chart' | 'help'
  component: ComponentType<AppPageProps>
}

export const DEFAULT_PATH = '/writing'

const UserCenter = lazy(() =>
  import('../components/views/UserCenter').then((m) => ({ default: m.UserCenter })),
)
const StartWriting = lazy(() =>
  import('../components/views/StartWriting').then((m) => ({ default: m.StartWriting })),
)
const WritingRecords = lazy(() =>
  import('../components/views/WritingRecords').then((m) => ({ default: m.WritingRecords })),
)
const PersonalVocabulary = lazy(() =>
  import('../components/views/PersonalVocabulary').then((m) => ({
    default: m.PersonalVocabulary,
  })),
)
const PersonalAssessment = lazy(() =>
  import('../components/views/PersonalAssessment').then((m) => ({
    default: m.PersonalAssessment,
  })),
)
const UsageGuide = lazy(() =>
  import('../components/views/UsageGuide').then((m) => ({ default: m.UsageGuide })),
)

export const APP_ROUTES: AppRoute[] = [
  {
    key: 'user-center',
    path: '/user-center',
    label: '用户中心',
    icon: 'user',
    component: UserCenter,
  },
  {
    key: 'start-writing',
    path: '/writing',
    label: '开始写作',
    icon: 'pen',
    component: StartWriting,
  },
  {
    key: 'writing-records',
    path: '/records',
    label: '写作记录',
    icon: 'clipboard',
    component: WritingRecords,
  },
  {
    key: 'personal-vocabulary',
    path: '/vocabulary',
    label: '个人词库',
    icon: 'book',
    component: PersonalVocabulary,
  },
  {
    key: 'personal-assessment',
    path: '/assessment',
    label: '个人测评',
    icon: 'chart',
    component: PersonalAssessment,
  },
  {
    key: 'usage-guide',
    path: '/guide',
    label: '使用指南',
    icon: 'help',
    component: UsageGuide,
  },
]

export function isAppPath(pathname: string): boolean {
  return APP_ROUTES.some((route) => route.path === pathname)
}

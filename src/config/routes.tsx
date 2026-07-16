import type { ComponentType } from 'react'
import type { MenuKey } from '../types'
import { UserCenter } from '../components/views/UserCenter'
import { StartWriting } from '../components/views/StartWriting'
import { WritingRecords } from '../components/views/WritingRecords'
import { PersonalVocabulary } from '../components/views/PersonalVocabulary'
import { PersonalAssessment } from '../components/views/PersonalAssessment'
import { UsageGuide } from '../components/views/UsageGuide'

export type AppPageProps = {
  onReady?: () => void
}

export interface AppRoute {
  key: MenuKey
  path: string
  label: string
  icon: 'user' | 'pen' | 'clipboard' | 'book' | 'chart' | 'help'
  component: ComponentType<AppPageProps>
}

export const DEFAULT_PATH = '/writing'

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

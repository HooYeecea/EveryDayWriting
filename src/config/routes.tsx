import type { MenuKey } from '../types'
import { UserCenter } from '../components/views/UserCenter'
import { StartWriting } from '../components/views/StartWriting'
import { WritingRecords } from '../components/views/WritingRecords'
import { PersonalVocabulary } from '../components/views/PersonalVocabulary'
import { PersonalAssessment } from '../components/views/PersonalAssessment'
import * as React from "react";

export interface AppRoute {
  key: MenuKey
  path: string
  label: string
  icon: 'user' | 'pen' | 'clipboard' | 'book' | 'chart'
  element: React.ReactNode
}

export const DEFAULT_PATH = '/writing'

export const APP_ROUTES: AppRoute[] = [
  {
    key: 'user-center',
    path: '/user-center',
    label: '用户中心',
    icon: 'user',
    element: <UserCenter />,
  },
  {
    key: 'start-writing',
    path: '/writing',
    label: '开始写作',
    icon: 'pen',
    element: <StartWriting />,
  },
  {
    key: 'writing-records',
    path: '/records',
    label: '写作记录',
    icon: 'clipboard',
    element: <WritingRecords />,
  },
  {
    key: 'personal-vocabulary',
    path: '/vocabulary',
    label: '个人词库',
    icon: 'book',
    element: <PersonalVocabulary />,
  },
  {
    key: 'personal-assessment',
    path: '/assessment',
    label: '个人测评',
    icon: 'chart',
    element: <PersonalAssessment />,
  },
]

export function isAppPath(pathname: string): boolean {
  return APP_ROUTES.some((route) => route.path === pathname)
}

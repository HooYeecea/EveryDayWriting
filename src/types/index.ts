export type MenuKey =
  | 'user-center'
  | 'start-writing'
  | 'writing-records'
  | 'personal-vocabulary'
  | 'personal-assessment'

export interface MenuItem {
  key: MenuKey
  label: string
  icon: string
}

export interface WritingTopic {
  id: number
  prompt: string
  type: string
}

export interface UserProfile {
  name: string
  email: string
  avatar: string
  level: string
  totalWritings: number
  totalWords: number
  streakDays: number
  joinedAt: string
}

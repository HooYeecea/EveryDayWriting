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
  id: string
  name: string
  email: string
  avatar: string
  level: string
  totalWritings: number
  totalWords: number
  streakDays: number
  joinedAt: string
}

export interface StoredUser {
  id: string
  email: string
  password: string
  profile: UserProfile
}

/** 写作记录（保存/提交共用结构） */
export interface WritingRecord {
  id: string
  userId: string
  topicId: number
  topic: string
  topicType: string
  title: string
  content: string
  time: string
}

export interface WritingSavePayload {
  id?: string
  topicId: number
  topic: string
  topicType: string
  title: string
  content: string
}

export interface WritingSubmitPayload {
  id?: string
  topicId: number
  topic: string
  topicType: string
  title: string
  content: string
}

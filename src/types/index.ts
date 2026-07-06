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

/** 题目（API /topics/random） */
export interface WritingTopic {
  id: number
  type: string
  title: string
  description: string
  wordLimit?: string
}

/** 登录响应中的精简用户 */
export interface AuthUserBrief {
  id: string
  email: string
  nickname: string
  avatar: string | null
  vipLevel?: number
  needAcceptAgreement?: boolean
  mustChangePassword?: boolean
}

export interface UserProfileStats {
  totalWritings: number
  totalWords: number
  vocabularyCount?: number
  tokenUsage?: {
    consumedThisMonth: number
    totalCalls: number
  }
}

/** 用户资料（GET /user/profile） */
export interface UserProfile {
  id: string
  email: string
  nickname: string
  avatar: string | null
  vipLevel: number
  vipExpiry?: string | null
  stats: UserProfileStats
  locationText?: string | null
  createdAt: string
}

export interface AuthSession {
  token: string
  refreshToken: string
  expiresAt: string
  user: AuthUserBrief
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/** 草稿详情 */
export interface WritingDraft {
  id: string
  topicId: number | null
  topic: string
  title: string
  content: string
  updatedAt: string
}

export interface WritingDraftListItem {
  id: string
  title: string
  updatedAt: string
}

export interface DraftSaveResult {
  id: string
  wordCount?: number
  wordLimit?: number
  updatedAt: string
}

/** PUT 草稿 409 冲突时服务端返回的最新内容 */
export interface DraftConflictData {
  id: string
  title: string
  content: string
  updatedAt: string
}

export interface SubmitResult {
  id: string
  wordCount?: number
  wordLimit?: number
  aiScore: number | null
  submittedAt: string
}

export interface WritingSubmitListItem {
  id: string
  topicType: string
  title: string
  aiScore: number | null
  wordCount: number
  submittedAt: string
}

export interface GrammarSuggestion {
  id: string
  original: string
  correction: string
  reason: string
}

export interface VocabularySuggestion {
  id: string
  original: string
  suggestion: string
  context: string
}

export interface WritingSubmitDetail {
  id: string
  topicId: number
  topicType: string
  topic: string
  title: string
  content: string
  wordCount: number
  aiScore: number | null
  aiEvaluation: string | null
  grammarSuggestions: GrammarSuggestion[]
  vocabularySuggestions: VocabularySuggestion[]
  submittedAt: string
}

export interface WritingSavePayload {
  topicId: number | null
  topic: string
  title: string
  content: string
}

export interface WritingSubmitPayload {
  topicId: number
  topic: string
  title: string
  content: string
  draftId?: string
}

/** 打卡状态 GET /checkin/status */
export interface CheckInStatus {
  checkedInToday: boolean
  currentStreak: number
  longestStreak: number
  totalCheckIns: number
  totalSubmits: number
  todaySubmitId: string | null
  checkinTier: CheckInTier | null
  quote: CheckInQuote | null
  monthSummary: CheckInMonthSummary
}

export interface CheckInTier {
  id: string
  name: string
  minDays: number
  iconUrl: string
  nextTier?: {
    id: string
    name: string
    minDays: number
    iconUrl: string
    daysRemaining: number
  } | null
}

export interface CheckInQuote {
  id: string
  content: string
  category: string
}

export interface CheckInMonthSummary {
  year: number
  month: number
  checkedDays: number[]
  totalDays: number
}

export type VocabularyType = 'NewWord' | 'WrongWord'

export interface VocabularyItem {
  id: string
  word: string
  partOfSpeech: string
  translations: string[]
  wrongUsage: string | null
  contextSentence: string | null
  type: VocabularyType
  createdAt: string
}

export interface VocabularySearchResult {
  items: VocabularyItem[]
  totalCount: number
}

export interface CreateVocabularyPayload {
  word: string
  partOfSpeech: string
  translation: string
  wrongUsage?: string
  contextSentence?: string
  type: VocabularyType
}

export interface AssessmentSummary {
  totalWritings: number
  averageScore: number
  highestScore: number
  lowestScore: number
  totalWords: number
  vocabularyCount: number
  tokenUsage: {
    totalTokens: number
    thisMonth: number
    totalCalls: number
  }
}

export interface AssessmentStats {
  summary: AssessmentSummary
  scoreTrend: Array<{ date: string; score: number }>
  frequentErrors: unknown[]
  topicDistribution: Array<{ type: string; count: number }>
  scoreDistribution: Record<string, number>
}

export interface CheckInCalendar {
  year: number
  month: number
  checkedDays: number[]
  streakStart: number | null
  streakEnd: number | null
  totalDays: number
}

export type SendCodePurpose = 'register' | 'reset' | 'login_captcha'

export interface LoginErrorData {
  remainingAttempts?: number
  requireCaptcha?: boolean
}

/** 图形验证码（GET /auth/send-graphcode） */
export interface GraphCaptcha {
  captchaId: string
  imageBase64: string
}

/** 登录时携带的图形验证码（对应 LoginRequest.graphCode） */
export interface LoginGraphCaptcha {
  captchaId: string
  graphCode: string
}

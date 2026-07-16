export type MenuKey =
  | 'user-center'
  | 'start-writing'
  | 'writing-records'
  | 'personal-vocabulary'
  | 'personal-assessment'
  | 'usage-guide'

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

/** 登录响应角色项（$.data.user.roles[].name） */
export interface AuthRole {
  id?: string
  name: string
}

/** 登录响应中的精简用户（含 roles / permissions） */
export interface AuthUserBrief {
  id: string
  email: string
  nickname: string
  avatar: string | null
  vipLevel?: number
  needAcceptAgreement?: boolean
  mustChangePassword?: boolean
  roles?: AuthRole[]
  /** 当前用户权限码列表（$.data.user.permissions） */
  permissions?: string[]
}

export interface UserProfileStats {
  /** 正式提交篇数 */
  totalWritings: number
  /** 累计字数 */
  totalWords: number
  /** 词库条数 */
  vocabularyCount: number
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
  /** profile 当前不返回 roles，权限以 permissions 为准 */
  roles?: AuthRole[]
  /** $.data.permissions — 当前用户权限码（去重） */
  permissions?: string[]
  /** 能力测评引导状态（红点 / 首登引导） */
  proficiencyOnboarding?: import('./proficiencyTest').ProficiencyOnboardingBrief
}

export interface AuthSession {
  token: string
  refreshToken: string
  expiresAt: string
  user: AuthUserBrief
  permissions: string[]
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
  iterationGroupId?: string
  iterationNumber?: number
  submittedAt: string
}

export interface IterationSibling {
  id: string
  iterationNumber: number
  aiScore: number | null
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
  reason?: string
}

// ── AI 结构化响应类型（对应各 purpose 的 JSON 返回格式） ──

/** grammar 目的：语法纠错 */
export interface GrammarErrorItem {
  id: string
  original: string
  correction: string
  reason: string
}

export interface GrammarCheckResult {
  errors: GrammarErrorItem[]
}

/** vocabulary 目的：词汇优化建议 */
export interface VocabSuggestionItem {
  id: string
  original: string
  suggestion: string
  context: string
}

export interface VocabularyCheckResult {
  suggestions: VocabSuggestionItem[]
}

/** structure 目的：IELTS 9分制综合评分 + 逐段点评 */
export interface StructureSubScores {
  taskResponse: number
  coherenceCohesion: number
  lexicalResource: number
  grammaticalRange: number
}

export interface StructureOverall {
  strengths: string[]
  weaknesses: string[]
  summary: string
}

export interface ParagraphFeedbackItem {
  paragraphIndex: number
  feedback: string
}

export interface StructureResult {
  score: number
  subScores: StructureSubScores
  overall: StructureOverall
  paragraphFeedback: ParagraphFeedbackItem[]
}

/** dictionary 目的：词典查询 */
export interface DictionaryResult {
  word: string
  phonetic: string
  partOfSpeech: string
  definitions: string[]
  synonyms: string[]
  examples: string[]
}

/** translation 目的：中译英 */
export interface TranslationResult {
  primary: string
  variants: string[]
}

/** brainstorm 目的：头脑风暴 */
export interface BrainstormResult {
  angles: string[]
  vocabulary: string[]
  outline: string[]
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
  iterationGroupId?: string
  iterationNumber?: number
  iterations?: IterationSibling[]
  submittedAt: string
}

export interface IterationResult {
  id: string
  iterationGroupId: string
  iterationNumber: number
  wordCount: number
  wordLimit: number
  submittedAt: string
}

export interface ChatMessage {
  role: string
  content: string
}

export interface SuggestionChatHistory {
  suggestionId: string
  messages: ChatMessage[]
  updatedAt: string
}

export interface AnnouncementItem {
  id: string
  title: string
  content: string
  priority: string
  publishedAt: string
  expiresAt: string | null
  hasRead: boolean
}

export interface TokenUsageSummary {
  consumedThisMonth: number
  totalConsumed: number
  totalCalls: number
  monthlyBudget: number | null
  budgetStatus: string
}

export interface TokenBudgetStatus {
  consumedThisMonth: number
  budgetLimit: number | null
  status: string
  consumedPercent: number
}

export interface TokenUsageDetailItem {
  id: string
  providerId: string
  modelId: string
  purpose: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  createdAt: string
}

export interface AiModelBrief {
  id: string
  name: string
  isDefault: boolean
  capabilities: string[]
  maxTokens: number
}

export interface AiProviderBrief {
  id: string
  name: string
  hasServerKey: boolean
  models: AiModelBrief[]
}

export interface AiFeatureFlags {
  dictionary: boolean
  translation: boolean
  brainstorm: boolean
  typingSound: boolean
}

export interface FreeQuotaInfo {
  enabled: boolean
  dailyTokenLimit: number
  dailySubmitLimit: number
  todayTokensUsed: number
  todaySubmitsUsed: number
}

export interface AiConfig {
  vipLevel: number
  providers: AiProviderBrief[]
  features: AiFeatureFlags
  freeQuota: FreeQuotaInfo | null
}

export interface AgreementStatusItem {
  id: string
  type: string
  title: string
  version: number
  accepted: boolean
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
  gradingSessionId?: string
}

export interface AiProxyResult {
  content: string
  gradingSessionId?: string
  suggestionIds?: {
    grammarSuggestions?: string[]
    vocabularySuggestions?: string[]
  }
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

/** GET /checkin/calendar?year= 仅传年时的响应 */
export interface CheckInYearCalendar {
  year: number
  months: CheckInCalendar[]
}

/** 登录/注册成功后返回给页面的会话结果 */
export interface AuthLoginResult {
  mustChangePassword: boolean
  /** 按角色决定的默认落地路径 */
  redirectTo: string
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

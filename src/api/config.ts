/** API 路径前缀（文档 Base URL：/api/v1） */
export const API_PREFIX = '/api/v1'

/**
 * 获取后端 API 根地址（含 /api/v1）
 * - 生产/联调：VITE_API_BASE_URL，如 http://localhost:5000
 * - 未配置：使用相对路径 /api/v1（开发环境走 Vite 代理）
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!configured) {
    return API_PREFIX
  }
  const base = configured.replace(/\/$/, '')
  if (base.endsWith('/api/v1')) {
    return base
  }
  return `${base}${API_PREFIX}`
}

/** 接口路径（相对 /api/v1） */
export const API_PATHS = {
  auth: {
    sendCode: '/auth/send-code',
    sendGraphCode: '/auth/send-graphcode',
    register: '/auth/register',
    login: '/auth/login',
    resetPassword: '/auth/reset-password',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
  },
  user: {
    profile: '/user/profile',
    password: '/user/password',
  },
  files: {
    upload: '/files/upload',
  },
  announcements: {
    list: '/announcements',
    read: (id: string) => `/announcements/${id}/read`,
  },
  usage: {
    summary: '/usage/summary',
    details: '/usage/details',
    budget: '/usage/budget',
  },
  privacy: {
    aiMemory: '/privacy/ai-memory',
  },
  topics: {
    random: '/topics/random',
    types: '/topics/types',
  },
  agreements: {
    latest: '/agreements/latest',
    accept: (id: string) => `/agreements/${id}/accept`,
    status: '/agreements/status',
    history: '/agreements/history',
  },
  ai: {
    config: '/ai/config',
    key: '/ai/key',
    proxy: (purpose: string) => `/ai/proxy/${purpose}`,
    quota: '/ai/quota',
  },
  writings: {
    drafts: '/writings/drafts',
    draftsLatest: '/writings/drafts/latest',
    draftById: (id: string) => `/writings/drafts/${id}`,
    draftsAutosave: '/writings/drafts/autosave',
    submits: '/writings/submits',
    submitById: (id: string) => `/writings/submits/${id}`,
    submitIterate: (id: string) => `/writings/submits/${id}/iterate`,
    submitAiResults: (submitId: string) => `/writings/submits/${submitId}/ai-results`,
    suggestionChat: (submitId: string, suggestionId: string) =>
      `/writings/submits/${submitId}/suggestions/${suggestionId}/chat`,
  },
  checkin: {
    status: '/checkin/status',
    calendar: '/checkin/calendar',
  },
  vocabulary: {
    list: '/vocabulary',
    search: '/vocabulary/search',
    byId: (id: string) => `/vocabulary/${id}`,
  },
  assessment: {
    stats: '/assessment/stats',
  },
  proficiencyTest: {
    status: '/proficiency-test/status',
    start: '/proficiency-test/start',
    skip: '/proficiency-test/skip',
    dismissRedDot: '/proficiency-test/dismiss-red-dot',
    selfAssessmentQuestions: '/proficiency-test/self-assessment-questions',
    selfAssessment: (testId: string) => `/proficiency-test/${testId}/self-assessment`,
    objectiveQuestions: (testId: string) => `/proficiency-test/${testId}/objective-questions`,
    objectiveAnswers: (testId: string) => `/proficiency-test/${testId}/objective-answers`,
    writingPrompts: (testId: string) => `/proficiency-test/${testId}/writing-prompts`,
    writingPrompt: (testId: string) => `/proficiency-test/${testId}/writing-prompt`,
    writing: (testId: string) => `/proficiency-test/${testId}/writing`,
    evaluationPayload: (testId: string) => `/proficiency-test/${testId}/evaluation-payload`,
    complete: (testId: string) => `/proficiency-test/${testId}/complete`,
    result: (testId: string) => `/proficiency-test/${testId}/result`,
    plan: '/proficiency-test/plan',
    planProgress: '/proficiency-test/plan/progress',
  },
  admin: {
    users: '/admin/users',
    userById: (id: string) => `/admin/users/${id}`,
    banUser: (id: string) => `/admin/users/${id}/ban`,
    unbanUser: (id: string) => `/admin/users/${id}/unban`,
    vipUser: (id: string) => `/admin/users/${id}/vip`,
    userRoles: (id: string) => `/admin/users/${id}/roles`,
    auditLogs: '/admin/audit-logs',
    providers: '/admin/providers',
    providerById: (id: string) => `/admin/providers/${id}`,
    toggleProvider: (id: string) => `/admin/providers/${id}/toggle`,
    providerModels: (providerId: string) => `/admin/providers/${providerId}/models`,
    toggleModel: (providerId: string, modelId: string) =>
      `/admin/providers/${providerId}/models/${modelId}/toggle`,
    deleteModel: (providerId: string, modelId: string) =>
      `/admin/providers/${providerId}/models/${modelId}`,
    roles: '/admin/roles',
    roleById: (id: string) => `/admin/roles/${id}`,
    permissions: '/admin/permissions',
    configs: '/admin/configs',
    configByKey: (key: string) => `/admin/configs/${key}`,
    quotes: '/admin/quotes',
    quoteById: (id: string) => `/admin/quotes/${id}`,
    checkinTiers: '/admin/checkin-tiers',
    checkinTierById: (id: string) => `/admin/checkin-tiers/${id}`,
    reorderTiers: '/admin/checkin-tiers/reorder',
    topicTypes: '/admin/topic-types',
    topicTypeById: (id: number | string) => `/admin/topic-types/${id}`,
    tokenUsage: '/admin/token-usage',
    announcements: '/admin/announcements',
    announcementById: (id: string) => `/admin/announcements/${id}`,
    agreements: '/admin/agreements',
    agreementById: (id: string) => `/admin/agreements/${id}`,
    dashboardOverview: '/admin/dashboard/overview',
    systemInfo: '/admin/system/info',
    freeChannel: '/admin/free-channel',
    freeChannelDefault: '/admin/free-channel/default',
    prompts: '/admin/prompts',
    promptById: (id: string) => `/admin/prompts/${id}`,
    promptHistory: (id: string) => `/admin/prompts/${id}/history`,
    promptTest: (id: string) => `/admin/prompts/${id}/test`,
    promptRollback: (id: string) => `/admin/prompts/${id}/rollback`,
    questions: '/admin/questions',
    questionById: (id: string) => `/admin/questions/${id}`,
    questionToggle: (id: string) => `/admin/questions/${id}/toggle`,
    questionsBatch: '/admin/questions/batch',
    questionsGenerate: '/admin/questions/generate',
    questionsExport: '/admin/questions/export',
    questionsTemplate: '/admin/questions/template',
  },
} as const

export const SUCCESS_CODES = new Set([200, 201])

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

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
  },
  writings: {
    drafts: '/writings/drafts',
    draftsLatest: '/writings/drafts/latest',
    draftById: (id: string) => `/writings/drafts/${id}`,
    submits: '/writings/submits',
    submitById: (id: string) => `/writings/submits/${id}`,
    submitIterate: (id: string) => `/writings/submits/${id}/iterate`,
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
} as const

export const SUCCESS_CODES = new Set([200, 201])

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

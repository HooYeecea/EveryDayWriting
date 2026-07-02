/**
 * API 配置与路径常量
 * 与 API.md 保持一致
 */

/** API 路径前缀（文档约定 Base URL 为 /api） */
export const API_PREFIX = '/api'

/**
 * 获取后端 API 根地址
 * - 生产/联调：通过 VITE_API_BASE_URL 配置，如 http://localhost:5000
 * - 未配置：使用相对路径 /api（开发环境走 Vite 代理）
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!configured) {
    return API_PREFIX
  }
  return configured.replace(/\/$/, '')
}

/** 接口路径常量（相对 /api 的子路径） */
export const API_PATHS = {
  auth: {
    sendCode: '/auth/send-code',
    register: '/auth/register',
    login: '/auth/login',
    resetPassword: '/auth/reset-password',
  },
  user: {
    profile: '/user/profile',
  },
  topics: {
    random: '/topics/random',
  },
  ai: {
    prompts: '/ai/prompts',
  },
  writings: {
    drafts: '/writings/drafts',
    draftsLatest: '/writings/drafts/latest',
    draftById: (id: string) => `/writings/drafts/${id}`,
    submits: '/writings/submits',
    submitById: (id: string) => `/writings/submits/${id}`,
  },
  vocabulary: {
    list: '/vocabulary',
    byId: (id: string) => `/vocabulary/${id}`,
  },
  assessment: {
    stats: '/assessment/stats',
  },
} as const

/** 业务成功状态码（与 API.md 一致） */
export const SUCCESS_CODES = new Set([200, 201])

/** 默认分页参数 */
export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

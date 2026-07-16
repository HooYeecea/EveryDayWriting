import { API_PATHS } from './config'
import { get, post } from './request'
import type { AiConfig, AiProxyResult, ChatMessage, FreeQuotaInfo, SuggestionChatHistory } from '../types'

const AI_CONFIG_TTL_MS = 60_000
let aiConfigCache: AiConfig | null = null
let aiConfigCachedAt = 0
let aiConfigInflight: Promise<AiConfig> | null = null

/** 带短时缓存与 inflight 去重，避免写作辅助与用户中心设置重复打接口 */
export async function getAiConfig(options?: { force?: boolean }): Promise<AiConfig> {
  const fresh = Date.now() - aiConfigCachedAt < AI_CONFIG_TTL_MS
  if (!options?.force && aiConfigCache && fresh) {
    return aiConfigCache
  }
  if (!options?.force && aiConfigInflight) {
    return aiConfigInflight
  }

  aiConfigInflight = get<AiConfig>(API_PATHS.ai.config)
    .then((data) => {
      aiConfigCache = data
      aiConfigCachedAt = Date.now()
      return data
    })
    .finally(() => {
      aiConfigInflight = null
    })

  return aiConfigInflight
}

export function invalidateAiConfigCache() {
  aiConfigCache = null
  aiConfigCachedAt = 0
}

export async function submitAiKey(
  providerId: string,
  apiKey: string,
): Promise<{ encryptedKey: string }> {
  const result = await post<{ encryptedKey: string }>(API_PATHS.ai.key, { providerId, apiKey })
  invalidateAiConfigCache()
  return result
}

export async function callAiProxy(
  purpose: string,
  payload: {
    providerId: string
    modelId: string
    userContent: string
    gradingSessionId?: string
  },
  encryptedKey?: string,
): Promise<AiProxyResult> {
  const fetchOptions: RequestInit = {}
  if (encryptedKey) {
    fetchOptions.headers = { 'X-Encrypted-Key': encryptedKey }
  }
  return post<AiProxyResult>(API_PATHS.ai.proxy(purpose), payload, { fetchOptions })
}

export async function getAiQuota(): Promise<FreeQuotaInfo & {
  tokensRemaining: number
  submitsRemaining: number
}> {
  return get(API_PATHS.ai.quota)
}

export async function getSuggestionChatHistory(
  submitId: string,
  suggestionId: string,
): Promise<SuggestionChatHistory> {
  return get<SuggestionChatHistory>(API_PATHS.writings.suggestionChat(submitId, suggestionId))
}

export async function sendSuggestionChat(
  submitId: string,
  suggestionId: string,
  question: string,
): Promise<{ suggestionId: string; answer: string; messages: ChatMessage[] }> {
  return post(API_PATHS.writings.suggestionChat(submitId, suggestionId), { question })
}

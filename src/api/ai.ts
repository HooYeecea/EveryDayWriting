import { API_PATHS } from './config'
import { get, post } from './request'
import type { AiConfig, AiProxyResult, ChatMessage, FreeQuotaInfo, SuggestionChatHistory } from '../types'

export async function getAiConfig(): Promise<AiConfig> {
  return get<AiConfig>(API_PATHS.ai.config)
}

export async function submitAiKey(
  providerId: string,
  apiKey: string,
): Promise<{ encryptedKey: string }> {
  return post(API_PATHS.ai.key, { providerId, apiKey })
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

import { API_PATHS } from './config'
import { get, post, postStream } from './request'
import { ApiError } from './types'
import type { AiConfig, AiProxyResult, ChatMessage, FreeQuotaInfo, SuggestionChatHistory } from '../types'

export type AiProxyStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; content: string }
  | { type: 'error'; message: string }

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
  signal?: AbortSignal,
): Promise<AiProxyResult> {
  const fetchOptions: RequestInit = {}
  if (encryptedKey) {
    fetchOptions.headers = { 'X-Encrypted-Key': encryptedKey }
  }
  if (signal) {
    fetchOptions.signal = signal
  }
  return post<AiProxyResult>(API_PATHS.ai.proxy(purpose), payload, { fetchOptions })
}

/** realtime_assist SSE：逐段回调 delta，最终返回完整 content */
export async function callAiProxyStream(
  purpose: string,
  payload: {
    providerId: string
    modelId: string
    userContent: string
    gradingSessionId?: string
  },
  encryptedKey: string | undefined,
  signal: AbortSignal | undefined,
  onEvent: (event: AiProxyStreamEvent) => void,
): Promise<string> {
  const fetchOptions: RequestInit = {}
  if (encryptedKey) {
    fetchOptions.headers = { 'X-Encrypted-Key': encryptedKey }
  }
  if (signal) {
    fetchOptions.signal = signal
  }

  const response = await postStream(API_PATHS.ai.proxyStream(purpose), payload, { fetchOptions })
  if (!response.body) {
    throw new ApiError(502, '流式响应为空', 502)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''
  let sawDone = false

  const emitLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return
    const payloadText = trimmed.slice(5).trim()
    if (!payloadText || payloadText === '[DONE]') return

    let parsed: AiProxyStreamEvent
    try {
      parsed = JSON.parse(payloadText) as AiProxyStreamEvent
    } catch {
      return
    }

    if (parsed.type === 'delta' && typeof parsed.text === 'string') {
      fullContent += parsed.text
      onEvent({ type: 'delta', text: parsed.text })
      return
    }
    if (parsed.type === 'done') {
      sawDone = true
      if (typeof parsed.content === 'string' && parsed.content.length > 0) {
        fullContent = parsed.content
      }
      onEvent({ type: 'done', content: fullContent })
      return
    }
    if (parsed.type === 'error') {
      const message = typeof parsed.message === 'string' ? parsed.message : '流式输出失败'
      onEvent({ type: 'error', message })
      throw new ApiError(502, message, 502)
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split(/\r?\n/)
    buffer = parts.pop() ?? ''
    for (const line of parts) {
      emitLine(line)
    }
  }
  if (buffer.trim()) {
    emitLine(buffer)
  }

  if (!sawDone) {
    onEvent({ type: 'done', content: fullContent })
  }
  return fullContent
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

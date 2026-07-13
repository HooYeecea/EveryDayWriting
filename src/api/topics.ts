import { API_PATHS, API_PREFIX, getApiBaseUrl } from './config'
import { get, isApiError } from './request'
import { getToken } from '../storage/tokenStorage'
import type { WritingTopic } from '../types'

/** 后端 /topics/random 支持的 type 可选值（兜底，优先使用 /topics/types） */
export const API_TOPIC_TYPES = ['CET4', 'CET6', 'IELTS', 'TOEFL', '考研'] as const
export type ApiTopicType = (typeof API_TOPIC_TYPES)[number]

export interface TopicTypeItem {
  id: number
  name: string
  description: string
  sortOrder: number
}

export const TOPIC_TYPE_FILTER_OPTIONS: Array<{ value: ApiTopicType | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'CET4', label: 'CET4' },
  { value: 'CET6', label: 'CET6' },
  { value: 'IELTS', label: 'IELTS' },
  { value: 'TOEFL', label: 'TOEFL' },
  { value: '考研', label: '考研' },
]

const LOG_PREFIX = '[topics/random]'

export function resolveTopicTypeParam(type?: string): string | undefined {
  if (!type) return undefined
  return type.trim() || undefined
}

export async function getTopicTypes(): Promise<TopicTypeItem[]> {
  const data = await get<{ items: TopicTypeItem[]; totalCount: number }>(API_PATHS.topics.types)
  return data.items
}

function buildRandomTopicUrl(type?: string): string {
  const path = `${API_PREFIX}${API_PATHS.topics.random}`
  if (!type) return path
  return `${path}?type=${encodeURIComponent(type)}`
}

function logRandomTopicRequest(type?: string): void {
  if (!import.meta.env.DEV) return

  console.groupCollapsed(`${LOG_PREFIX} 请求`)
  console.log('baseUrl:', getApiBaseUrl())
  console.log('path:', API_PATHS.topics.random)
  console.log('type 参数:', type ?? '(未传)')
  console.log('完整 URL:', buildRandomTopicUrl(type))
  console.log('已登录 Token:', Boolean(getToken()))
  console.groupEnd()
}

function logRandomTopicSuccess(topic: WritingTopic): void {
  if (!import.meta.env.DEV) return

  console.groupCollapsed(`${LOG_PREFIX} 成功`)
  console.log('题目:', topic)
  console.groupEnd()
}

function logRandomTopicFailure(type: string | undefined, error: unknown): void {
  if (!import.meta.env.DEV) return

  console.group(`${LOG_PREFIX} 失败`)
  console.log('type 参数:', type ?? '(未传)')
  if (isApiError(error)) {
    console.error('ApiError:', {
      code: error.code,
      message: error.message,
      httpStatus: error.httpStatus,
      data: error.data,
    })
  } else if (error instanceof Error) {
    console.error('Error:', error.message, error)
  } else {
    console.error('未知错误:', error)
  }
  console.groupEnd()
}

export async function getRandomTopic(type?: string): Promise<WritingTopic> {
  const apiType = resolveTopicTypeParam(type)
  logRandomTopicRequest(apiType)

  try {
    const topic = await get<WritingTopic>(API_PATHS.topics.random, {
      params: apiType ? { type: apiType } : undefined,
    })
    logRandomTopicSuccess(topic)
    return topic
  } catch (error) {
    logRandomTopicFailure(apiType, error)
    throw error
  }
}

/** 将 API 题目转为展示用 prompt */
export function topicToPrompt(topic: WritingTopic): string {
  return topic.description?.trim() || topic.title
}

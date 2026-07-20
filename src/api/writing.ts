import { API_PATHS } from './config'
import { del, get, isApiError, post, put } from './request'
import type { GradingStageKey } from '../storage/gradingPreviewStorage'
import {
  normalizeGrammarCheckResult,
  normalizeStructureResult,
  normalizeSubmitListItem,
  normalizeVocabularyCheckResult,
  normalizeWritingSubmitDetail,
} from '../utils/submitDetailNormalizer'
import type {
  CreateAiResultPayload,
  DraftSaveResult,
  GrammarSuggestion,
  IterationResult,
  PaginatedResult,
  SubmitResult,
  VocabularySuggestion,
  WritingAiResultItem,
  WritingDraft,
  WritingDraftListItem,
  WritingSavePayload,
  WritingSubmitDetail,
  WritingSubmitListItem,
  WritingSubmitPayload,
} from '../types'

export async function loadLatestDraft(): Promise<WritingDraft | null> {
  return get<WritingDraft | null>(API_PATHS.writings.draftsLatest)
}

export async function loadDraftById(id: string): Promise<WritingDraft> {
  return get<WritingDraft>(API_PATHS.writings.draftById(id))
}

export async function getDrafts(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResult<WritingDraftListItem>> {
  return get<PaginatedResult<WritingDraftListItem>>(API_PATHS.writings.drafts, {
    params: { page, pageSize },
  })
}

export async function createDraft(payload: WritingSavePayload): Promise<DraftSaveResult> {
  return post<DraftSaveResult>(API_PATHS.writings.drafts, payload)
}

export async function updateDraft(
  id: string,
  payload: { title: string; content: string; expectedUpdatedAt?: string },
): Promise<DraftSaveResult> {
  return put<DraftSaveResult>(API_PATHS.writings.draftById(id), payload)
}

export async function saveWritingDraft(
  draftId: string | undefined,
  payload: WritingSavePayload,
  expectedUpdatedAt?: string,
): Promise<DraftSaveResult> {
  if (draftId) {
    try {
      return await updateDraft(draftId, {
        title: payload.title,
        content: payload.content,
        expectedUpdatedAt,
      })
    } catch (err) {
      // 草稿已被删除（提交后清理、手动删除、超出上限被挤掉等）→ 改走新建
      if (isApiError(err) && err.isNotFound) {
        return createDraft(payload)
      }
      throw err
    }
  }
  return createDraft(payload)
}

export async function deleteDraft(id: string): Promise<void> {
  await del(API_PATHS.writings.draftById(id))
}

export async function autoSaveDraft(payload: {
  topicId: number | null
  topic?: string
  title?: string
  content?: string
}): Promise<{ id: string; updatedAt: string }> {
  return post(API_PATHS.writings.draftsAutosave, payload)
}

export async function submitWriting(payload: WritingSubmitPayload): Promise<SubmitResult> {
  return post<SubmitResult>(API_PATHS.writings.submits, payload)
}

export interface SubmitListQuery {
  keyword?: string
  topicType?: string
  from?: string
  to?: string
  sortBy?: 'score' | 'words'
  order?: 'desc' | 'asc'
  page?: number
  pageSize?: number
}

export async function getSubmittedWritings(
  query: SubmitListQuery = {},
): Promise<PaginatedResult<WritingSubmitListItem>> {
  const result = await get<PaginatedResult<unknown>>(API_PATHS.writings.submits, {
    params: query as Record<string, string | number | boolean | null | undefined>,
  })
  return {
    ...result,
    items: result.items.map(normalizeSubmitListItem),
  }
}

export async function getSubmittedWritingById(id: string): Promise<WritingSubmitDetail> {
  const raw = await get<unknown>(API_PATHS.writings.submitById(id))
  return normalizeWritingSubmitDetail(raw)
}

export async function deleteSubmit(id: string): Promise<void> {
  await del(API_PATHS.writings.submitById(id))
}

export async function iterateSubmit(
  id: string,
  payload: {
    content: string
    title?: string
    gradingSessionId?: string
    aiCheckEnabled?: boolean
    aiStructureEnabled?: boolean
    aiSuggestionEnabled?: boolean
  },
): Promise<IterationResult> {
  return post<IterationResult>(API_PATHS.writings.submitIterate(id), payload)
}

export async function saveSubmitAiResult(
  submitId: string,
  payload: CreateAiResultPayload,
): Promise<WritingAiResultItem> {
  return post<WritingAiResultItem>(API_PATHS.writings.submitAiResults(submitId), payload)
}

function serializeResultContent(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function buildAiResultPayload(
  purpose: GradingStageKey,
  content: unknown,
  meta: { providerId: string; modelId: string },
): CreateAiResultPayload {
  const payload: CreateAiResultPayload = {
    purpose,
    resultContent: serializeResultContent(content),
    providerId: meta.providerId,
    modelId: meta.modelId,
  }

  if (purpose === 'structure') {
    const structure = typeof content === 'string' ? null : normalizeStructureResult(content)
    if (structure) {
      if (Number.isFinite(structure.score)) {
        payload.aiScore = Math.round(structure.score)
      }
      const summary = structure.overall?.summary?.trim()
      if (summary) payload.aiEvaluation = summary
    }
  }

  if (purpose === 'grammar') {
    const grammar = typeof content === 'string' ? null : normalizeGrammarCheckResult(content)
    if (grammar?.errors?.length) {
      payload.grammarSuggestions = grammar.errors.map(
        (item): GrammarSuggestion => ({
          id: item.id,
          original: item.original,
          correction: item.correction,
          reason: item.reason,
        }),
      )
    }
  }

  if (purpose === 'vocabulary') {
    const vocab = typeof content === 'string' ? null : normalizeVocabularyCheckResult(content)
    if (vocab?.suggestions?.length) {
      payload.vocabularySuggestions = vocab.suggestions.map(
        (item): VocabularySuggestion => ({
          id: item.id,
          original: item.original,
          suggestion: item.suggestion,
          context: item.context,
        }),
      )
    }
  }

  return payload
}

/**
 * 将提交前批改得到的各阶段结果写入服务端 WritingAiResults。
 * 单条失败不阻断其余阶段；全部失败时抛出最后一个错误。
 */
export async function persistSubmitAiResults(
  submitId: string,
  stageContents: Partial<Record<GradingStageKey, unknown>>,
  meta?: { providerId?: string; modelId?: string },
): Promise<void> {
  const entries = (Object.entries(stageContents) as [GradingStageKey, unknown][]).filter(
    ([, value]) => value !== undefined && value !== null,
  )
  if (entries.length === 0) return

  const providerId = meta?.providerId?.trim() || 'free'
  const modelId = meta?.modelId?.trim() || 'free'
  const errors: unknown[] = []

  await Promise.all(
    entries.map(async ([purpose, content]) => {
      try {
        await saveSubmitAiResult(submitId, buildAiResultPayload(purpose, content, { providerId, modelId }))
      } catch (err) {
        console.warn(`[persistSubmitAiResults] ${purpose} 落库失败`, err)
        errors.push(err)
      }
    }),
  )

  if (errors.length === entries.length) {
    throw errors[errors.length - 1] instanceof Error
      ? errors[errors.length - 1]
      : new Error('AI 批改结果落库失败')
  }
}

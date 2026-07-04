import { API_PATHS } from './config'
import { del, get, isApiError, post, put } from './request'
import type {
  DraftSaveResult,
  PaginatedResult,
  SubmitResult,
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

/** 后端暂无 GET /drafts/{id}，仅当该 id 为 latest 时可加载 */
export async function loadDraftById(id: string): Promise<WritingDraft> {
  const latest = await loadLatestDraft()
  if (latest?.id === id) {
    return latest
  }
  throw new Error('当前仅支持编辑最新一条草稿，请从写作页自动恢复或打开最新草稿')
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
  return get<PaginatedResult<WritingSubmitListItem>>(API_PATHS.writings.submits, {
    params: query as Record<string, string | number | boolean | null | undefined>,
  })
}

export async function getSubmittedWritingById(id: string): Promise<WritingSubmitDetail> {
  return get<WritingSubmitDetail>(API_PATHS.writings.submitById(id))
}

export async function deleteSubmit(id: string): Promise<void> {
  await del(API_PATHS.writings.submitById(id))
}

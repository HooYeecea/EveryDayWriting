import { API_PATHS } from './config'
import { del, get, post } from './request'
import type {
  CreateVocabularyPayload,
  PaginatedResult,
  VocabularyItem,
  VocabularySearchResult,
  VocabularyType,
} from '../types'

export interface VocabularyListQuery {
  page?: number
  pageSize?: number
  type?: VocabularyType
  sortBy?: 'alphabet'
}

export async function getVocabularyList(
  query: VocabularyListQuery = {},
): Promise<PaginatedResult<VocabularyItem>> {
  return get<PaginatedResult<VocabularyItem>>(API_PATHS.vocabulary.list, {
    params: query as Record<string, string | number | boolean | null | undefined>,
  })
}

export async function searchVocabulary(q: string, limit = 20): Promise<VocabularySearchResult> {
  return get<VocabularySearchResult>(API_PATHS.vocabulary.search, {
    params: { q, limit },
  })
}

export async function createVocabularyItem(
  payload: CreateVocabularyPayload,
): Promise<{ id: string }> {
  return post<{ id: string }>(API_PATHS.vocabulary.list, payload)
}

export async function deleteVocabularyItem(id: string): Promise<void> {
  await del(API_PATHS.vocabulary.byId(id))
}

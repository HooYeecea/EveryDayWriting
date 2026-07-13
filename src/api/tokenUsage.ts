import { API_PATHS } from './config'
import { get, put } from './request'
import type { PaginatedResult, TokenBudgetStatus, TokenUsageDetailItem, TokenUsageSummary } from '../types'

export async function getTokenUsageSummary(): Promise<TokenUsageSummary> {
  return get<TokenUsageSummary>(API_PATHS.usage.summary)
}

export async function getTokenBudget(): Promise<TokenBudgetStatus> {
  return get<TokenBudgetStatus>(API_PATHS.usage.budget)
}

export async function setTokenBudget(
  tokenMonthlyBudget: number | null,
): Promise<{ tokenMonthlyBudget: number | null }> {
  return put(API_PATHS.usage.budget, { tokenMonthlyBudget })
}

export async function getTokenUsageDetails(
  page = 1,
  pageSize = 10,
): Promise<PaginatedResult<TokenUsageDetailItem>> {
  return get<PaginatedResult<TokenUsageDetailItem>>(API_PATHS.usage.details, {
    params: { page, pageSize },
  })
}

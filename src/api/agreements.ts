import { API_PATHS } from './config'
import { get, post } from './request'

export type AgreementType = 'PrivacyPolicy' | 'TermsOfService'

export interface AgreementItem {
  id: string
  type: AgreementType
  title: string
  content: string
  version: number
  publishedAt: string
  effectiveAt: string
}

export interface AgreementStatusItem {
  id: string
  type: AgreementType
  title: string
  version: number
  accepted: boolean
}

export async function getLatestAgreements(type?: AgreementType): Promise<AgreementItem[]> {
  const data = await get<{ items: AgreementItem[]; totalCount: number }>(
    API_PATHS.agreements.latest,
    {
      params: type ? { type } : undefined,
      skipAuth: true,
    },
  )
  return data.items
}

export async function getLatestAgreement(type: AgreementType): Promise<AgreementItem | null> {
  const items = await getLatestAgreements(type)
  return items.find((item) => item.type === type) ?? items[0] ?? null
}

export async function acceptAgreement(agreementId: string): Promise<void> {
  await post(API_PATHS.agreements.accept(agreementId))
}

export async function getAgreementStatus(): Promise<AgreementStatusItem[]> {
  const data = await get<{ items: AgreementStatusItem[] }>(API_PATHS.agreements.status)
  return data.items
}

export async function getAgreementHistory(type: string): Promise<
  Array<{ id: string; title: string; version: number; publishedAt: string; effectiveAt: string }>
> {
  const data = await get<{
    items: Array<{ id: string; title: string; version: number; publishedAt: string; effectiveAt: string }>
    totalCount: number
  }>(API_PATHS.agreements.history, { params: { type }, skipAuth: true })
  return data.items
}

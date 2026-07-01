import type {
  WritingRecord,
  WritingSavePayload,
  WritingSubmitPayload,
} from '../types'

const API_BASE = '/api/writings'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }))
    throw new Error(error.message ?? '请求失败')
  }

  return response.json() as Promise<T>
}

export async function saveWritingDraft(
  userId: string,
  data: WritingSavePayload,
): Promise<WritingRecord> {
  return request<WritingRecord>(`${API_BASE}/save`, {
    method: 'POST',
    body: JSON.stringify({ userId, ...data }),
  })
}

export async function submitWriting(
  userId: string,
  data: WritingSubmitPayload,
): Promise<WritingRecord> {
  return request<WritingRecord>(`${API_BASE}/submit`, {
    method: 'POST',
    body: JSON.stringify({ userId, ...data }),
  })
}

export async function loadLatestDraft(userId: string): Promise<WritingRecord | null> {
  return request<WritingRecord | null>(
    `${API_BASE}/saves/latest?userId=${encodeURIComponent(userId)}`,
  )
}

export async function loadDraftById(
  userId: string,
  id: string,
): Promise<WritingRecord> {
  return request<WritingRecord>(
    `${API_BASE}/saves/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`,
  )
}

export async function getSavedWritings(userId: string): Promise<WritingRecord[]> {
  return request<WritingRecord[]>(
    `${API_BASE}/saves?userId=${encodeURIComponent(userId)}`,
  )
}

export async function getSubmittedWritings(userId: string): Promise<WritingRecord[]> {
  return request<WritingRecord[]>(
    `${API_BASE}/submits?userId=${encodeURIComponent(userId)}`,
  )
}

export async function getSavedWritingById(
  userId: string,
  id: string,
): Promise<WritingRecord> {
  return request<WritingRecord>(
    `${API_BASE}/saves/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`,
  )
}

export async function getSubmittedWritingById(
  userId: string,
  id: string,
): Promise<WritingRecord> {
  return request<WritingRecord>(
    `${API_BASE}/submits/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`,
  )
}

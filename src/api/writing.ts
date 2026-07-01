export interface SaveWritingDraftRequest {
  topicId: number
  title: string
  content: string
}

export interface SaveWritingDraftResponse {
  id: string
  savedAt: string
}

/**
 * 保存写作草稿（占位接口，后续对接后端）
 * TODO: POST /api/writing/draft
 */
export async function saveWritingDraft(
  _data: SaveWritingDraftRequest,
): Promise<SaveWritingDraftResponse> {
  throw new Error('saveWritingDraft: 尚未对接后端')
}

import { parseAiProxyContent } from '../storage/gradingPreviewStorage'
import type { RealtimeAssistResult, RealtimeAssistTip } from '../types'

/** 编辑器 HTML → 纯文本（供 realtime_assist 请求） */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function pickString(item: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string') return value.trim()
  }
  return ''
}

function normalizeTip(raw: unknown): RealtimeAssistTip | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const suggestion = pickString(item, 'suggestion', 'Suggestion', 'correction', 'Correction')
  const note = pickString(item, 'note', 'Note', 'reason', 'Reason')
  const original = pickString(item, 'original', 'Original')
  const type = pickString(item, 'type', 'Type') || 'polish'
  // 字段不全也保留：只要有原文、建议或说明之一即可展示
  if (!original && !suggestion && !note) return null
  return { type, original, suggestion, note }
}

/** 解析 realtime_assist 返回的 content */
export function parseRealtimeAssistResult(content: string): RealtimeAssistResult {
  const parsed = parseAiProxyContent<{ tips?: unknown }>(content)
  if (typeof parsed === 'string') {
    return { tips: [] }
  }
  const list = Array.isArray(parsed.tips) ? parsed.tips : []
  const tips = list.map(normalizeTip).filter((tip): tip is RealtimeAssistTip => tip != null)
  return { tips }
}

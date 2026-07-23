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

/** 归一化后用于跨批去重的指纹（忽略 note 措辞差异） */
export function tipDedupeKey(tip: RealtimeAssistTip): string {
  const norm = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()
  return `${norm(tip.type)}|${norm(tip.original)}|${norm(tip.suggestion)}`
}

/**
 * 去掉与历史批次重复的 tip，并去除本批内部重复。
 * 保留更早出现的那条，避免历史闪动。
 */
export function dedupeTipsAgainstHistory(
  tips: RealtimeAssistTip[],
  previousBatches: Array<{ tips: RealtimeAssistTip[] }>,
): RealtimeAssistTip[] {
  const seen = new Set<string>()
  for (const batch of previousBatches) {
    for (const tip of batch.tips) {
      seen.add(tipDedupeKey(tip))
    }
  }

  const result: RealtimeAssistTip[] = []
  for (const tip of tips) {
    const key = tipDedupeKey(tip)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(tip)
  }
  return result
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

/**
 * 从尚未完整的流式 JSON 中提取已闭合的 tip 对象，便于边收边展示。
 */
export function extractStreamingTips(partialContent: string): RealtimeAssistTip[] {
  const text = stripPartialMarkdownFence(partialContent)
  const tipsMatch = /"tips"\s*:\s*\[/.exec(text)
  if (!tipsMatch || tipsMatch.index == null) return []

  const arrayStart = text.indexOf('[', tipsMatch.index)
  if (arrayStart < 0) return []

  const tips: RealtimeAssistTip[] = []
  let i = arrayStart + 1

  while (i < text.length) {
    while (i < text.length && /[\s,]/.test(text[i]!)) i += 1
    if (i >= text.length || text[i] === ']') break
    if (text[i] !== '{') break

    const start = i
    let depth = 0
    let inString = false
    let escape = false
    let closed = false

    for (; i < text.length; i += 1) {
      const ch = text[i]!
      if (inString) {
        if (escape) {
          escape = false
        } else if (ch === '\\') {
          escape = true
        } else if (ch === '"') {
          inString = false
        }
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{') depth += 1
      else if (ch === '}') {
        depth -= 1
        if (depth === 0) {
          i += 1
          closed = true
          break
        }
      }
    }

    if (!closed) break

    try {
      const tip = normalizeTip(JSON.parse(text.slice(start, i)))
      if (tip) tips.push(tip)
    } catch {
      // 忽略损坏片段
    }
  }

  return tips
}

function stripPartialMarkdownFence(content: string): string {
  const trimmed = content.trim()
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*)$/i)
  if (fence) return fence[1]!.trim()
  return trimmed
}

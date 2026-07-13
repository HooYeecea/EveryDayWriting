import type { GrammarCheckResult, StructureResult, VocabularyCheckResult } from '../types'

const GRADING_PREVIEW_KEY = 'ew_grading_preview'
const MAX_ENTRIES = 50

export type GradingStageKey = 'grammar' | 'structure' | 'vocabulary'

export interface GradingPreview {
  grammar?: GrammarCheckResult | string // string = 旧版 markdown 兼容
  structure?: StructureResult | string
  vocabulary?: VocabularyCheckResult | string
  savedAt: string
}

type GradingPreviewMap = Record<string, GradingPreview>

/**
 * 尝试将 AI 返回的 content 解析为 JSON；解析失败则返回原始字符串（兼容旧版 markdown）。
 * 支持：纯 JSON、markdown 代码块包裹的 JSON、文字中嵌入的 JSON。
 */
export function parseAiProxyContent<T>(content: string): T | string {
  const trimmed = content.trim()
  if (!trimmed) return content

  // 1) 直接尝试解析整个字符串
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as T
    } catch {
      // 继续尝试其他方式
    }
  }

  // 2) 尝试提取 markdown 代码块中的 JSON
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    const inner = fenceMatch[1].trim()
    if (inner.startsWith('{') || inner.startsWith('[')) {
      try {
        return JSON.parse(inner) as T
      } catch {
        // 继续尝试
      }
    }
  }

  // 3) 尝试在文本中定位 JSON 对象
  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]) as T
    } catch {
      // 继续尝试
    }
  }

  // 都失败则返回原始字符串（旧版 markdown）
  return content
}

function readAll(): GradingPreviewMap {
  try {
    const raw = localStorage.getItem(GRADING_PREVIEW_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as GradingPreviewMap
  } catch {
    return {}
  }
}

function writeAll(map: GradingPreviewMap): void {
  const entries = Object.entries(map).sort(
    (a, b) => new Date(b[1].savedAt).getTime() - new Date(a[1].savedAt).getTime(),
  )
  const trimmed = Object.fromEntries(entries.slice(0, MAX_ENTRIES))
  localStorage.setItem(GRADING_PREVIEW_KEY, JSON.stringify(trimmed))
}

export function saveGradingPreview(
  submitId: string,
  contents: Partial<Record<GradingStageKey, unknown>>,
): void {
  const filtered: Partial<Record<GradingStageKey, unknown>> = {}
  for (const [key, value] of Object.entries(contents)) {
    if (value !== undefined && value !== null) {
      filtered[key as GradingStageKey] = value
    }
  }

  if (Object.keys(filtered).length === 0) return

  const map = readAll()
  map[submitId] = {
    ...map[submitId],
    ...filtered,
    savedAt: new Date().toISOString(),
  } as GradingPreview
  writeAll(map)
}

export function loadGradingPreview(submitId: string): GradingPreview | null {
  return readAll()[submitId] ?? null
}

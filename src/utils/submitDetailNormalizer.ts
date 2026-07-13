import type {
  GrammarSuggestion,
  IterationSibling,
  VocabularySuggestion,
  WritingSubmitDetail,
  WritingSubmitListItem,
} from '../types'

function pickString(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string') return value
  }
  return ''
}

function normalizeGrammarSuggestion(raw: unknown): GrammarSuggestion | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const original = pickString(item, 'original', 'Original')
  const correction = pickString(item, 'correction', 'Correction')
  const reason = pickString(item, 'reason', 'Reason')
  const id = pickString(item, 'id', 'Id')

  if (!original && !correction && !reason) return null

  return {
    id: id || crypto.randomUUID(),
    original,
    correction,
    reason,
  }
}

function normalizeVocabularySuggestion(raw: unknown): VocabularySuggestion | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const original = pickString(item, 'original', 'Original')
  const suggestion = pickString(item, 'suggestion', 'Suggestion')
  const context = pickString(item, 'context', 'Context')
  const reason = pickString(item, 'reason', 'Reason') || undefined
  const id = pickString(item, 'id', 'Id')

  if (!original && !suggestion && !context && !reason) return null

  return {
    id: id || crypto.randomUUID(),
    original,
    suggestion,
    context,
    reason,
  }
}

function normalizeSuggestionList<T>(
  raw: unknown,
  normalize: (item: unknown) => T | null,
): T[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalize).filter((item): item is T => item !== null)
}

function normalizeIterationSibling(raw: unknown): IterationSibling | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const id = pickString(item, 'id', 'Id')
  if (!id) return null
  return {
    id,
    iterationNumber: Number(item.iterationNumber ?? item.IterationNumber ?? 1),
    aiScore:
      item.aiScore === null || item.AiScore === null
        ? null
        : Number(item.aiScore ?? item.AiScore ?? NaN) || null,
    submittedAt: pickString(item, 'submittedAt', 'SubmittedAt'),
  }
}

export function normalizeSubmitListItem(raw: unknown): WritingSubmitListItem {
  const data = (raw ?? {}) as Record<string, unknown>
  return {
    id: pickString(data, 'id', 'Id'),
    topicType: pickString(data, 'topicType', 'TopicType'),
    title: pickString(data, 'title', 'Title'),
    aiScore:
      data.aiScore === null || data.AiScore === null
        ? null
        : Number(data.aiScore ?? data.AiScore ?? NaN) || null,
    wordCount: Number(data.wordCount ?? data.WordCount ?? 0),
    iterationGroupId:
      pickString(data, 'iterationGroupId', 'IterationGroupId') || undefined,
    iterationNumber:
      data.iterationNumber != null || data.IterationNumber != null
        ? Number(data.iterationNumber ?? data.IterationNumber)
        : undefined,
    submittedAt: pickString(data, 'submittedAt', 'SubmittedAt'),
  }
}

/**
 * 兼容后端 camelCase / PascalCase 字段，并保证建议列表始终为数组。
 */
export function normalizeWritingSubmitDetail(raw: unknown): WritingSubmitDetail {
  const data = (raw ?? {}) as Record<string, unknown>

  return {
    id: pickString(data, 'id', 'Id'),
    topicId: Number(data.topicId ?? data.TopicId ?? 0),
    topicType: pickString(data, 'topicType', 'TopicType'),
    topic: pickString(data, 'topic', 'Topic'),
    title: pickString(data, 'title', 'Title'),
    content: pickString(data, 'content', 'Content'),
    wordCount: Number(data.wordCount ?? data.WordCount ?? 0),
    aiScore:
      data.aiScore === null || data.AiScore === null
        ? null
        : Number(data.aiScore ?? data.AiScore ?? NaN) || null,
    aiEvaluation: (() => {
      const value = data.aiEvaluation ?? data.AiEvaluation
      return typeof value === 'string' && value.trim() ? value : null
    })(),
    grammarSuggestions: normalizeSuggestionList(
      data.grammarSuggestions ?? data.GrammarSuggestions,
      normalizeGrammarSuggestion,
    ),
    vocabularySuggestions: normalizeSuggestionList(
      data.vocabularySuggestions ?? data.VocabularySuggestions,
      normalizeVocabularySuggestion,
    ),
    iterationGroupId:
      pickString(data, 'iterationGroupId', 'IterationGroupId') || undefined,
    iterationNumber:
      data.iterationNumber != null || data.IterationNumber != null
        ? Number(data.iterationNumber ?? data.IterationNumber)
        : undefined,
    iterations: normalizeSuggestionList(
      data.iterations ?? data.Iterations,
      normalizeIterationSibling,
    ),
    submittedAt: pickString(data, 'submittedAt', 'SubmittedAt'),
  }
}

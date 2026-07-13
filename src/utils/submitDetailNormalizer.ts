import type {
  GrammarSuggestion,
  IterationSibling,
  ParagraphFeedbackItem,
  StructureOverall,
  StructureResult,
  StructureSubScores,
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
function normalizeStructureSubScores(raw: unknown): StructureSubScores {
  const data = (raw ?? {}) as Record<string, unknown>
  return {
    taskResponse: Number(data.taskResponse ?? data.TaskResponse ?? 0),
    coherenceCohesion: Number(data.coherenceCohesion ?? data.CoherenceCohesion ?? 0),
    lexicalResource: Number(data.lexicalResource ?? data.LexicalResource ?? 0),
    grammaticalRange: Number(data.grammaticalRange ?? data.GrammaticalRange ?? 0),
  }
}

function normalizeStructureOverall(raw: unknown): StructureOverall {
  const data = (raw ?? {}) as Record<string, unknown>
  const arr = (key: string): string[] => {
    const value = data[key]
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
  }
  return {
    strengths: arr('strengths'),
    weaknesses: arr('weaknesses'),
    summary: pickString(data, 'summary', 'Summary'),
  }
}

function normalizeParagraphFeedback(raw: unknown): ParagraphFeedbackItem | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const index = Number(item.paragraphIndex ?? item.ParagraphIndex ?? -1)
  if (index < 0) return null
  const feedback = pickString(item, 'feedback', 'Feedback')
  if (!feedback) return null
  return { paragraphIndex: index, feedback }
}

export function normalizeStructureResult(raw: unknown): StructureResult | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  const score = Number(data.score ?? data.Score ?? NaN)
  if (isNaN(score)) return null
  return {
    score,
    subScores: normalizeStructureSubScores(data.subScores ?? data.SubScores),
    overall: normalizeStructureOverall(data.overall ?? data.Overall),
    paragraphFeedback: (() => {
      const rawFeedback = data.paragraphFeedback ?? data.ParagraphFeedback
      if (!Array.isArray(rawFeedback)) return []
      return (rawFeedback as unknown[])
        .map((item) => normalizeParagraphFeedback(item))
        .filter((item): item is ParagraphFeedbackItem => item !== null)
    })(),
  }
}

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

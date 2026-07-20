import type {
  GrammarCheckResult,
  GrammarSuggestion,
  IterationSibling,
  ParagraphFeedbackItem,
  StructureOverall,
  StructureResult,
  StructureSubScores,
  VocabularyCheckResult,
  VocabularySuggestion,
  WritingAiResultItem,
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
  const arr = (...keys: string[]): string[] => {
    for (const key of keys) {
      const value = data[key]
      if (Array.isArray(value)) {
        return value.filter((v): v is string => typeof v === 'string')
      }
    }
    return []
  }
  return {
    strengths: arr('strengths', 'Strengths'),
    weaknesses: arr('weaknesses', 'Weaknesses'),
    summary: pickString(data, 'summary', 'Summary'),
  }
}

function normalizeParagraphFeedback(raw: unknown): ParagraphFeedbackItem | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const index = Number(item.paragraphIndex ?? item.ParagraphIndex ?? item.index ?? item.Index ?? -1)
  if (index < 0 || !Number.isFinite(index)) return null
  const feedback = pickString(item, 'feedback', 'Feedback', 'comment', 'Comment', 'text', 'Text')
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

/** 规范化 localStorage 中的语法检查结果，保证 errors 始终为数组 */
export function normalizeGrammarCheckResult(raw: unknown): GrammarCheckResult | null {
  if (!raw || typeof raw !== 'object' || typeof raw === 'string') return null
  const data = raw as Record<string, unknown>
  const errors = normalizeSuggestionList(
    data.errors ?? data.Errors,
    (item) => {
      const normalized = normalizeGrammarSuggestion(item)
      if (!normalized) return null
      return {
        id: normalized.id,
        original: normalized.original,
        correction: normalized.correction,
        reason: normalized.reason,
      }
    },
  )
  return { errors }
}

/** 规范化 localStorage 中的词汇建议结果，保证 suggestions 始终为数组 */
export function normalizeVocabularyCheckResult(raw: unknown): VocabularyCheckResult | null {
  if (!raw || typeof raw !== 'object' || typeof raw === 'string') return null
  const data = raw as Record<string, unknown>
  const suggestions = normalizeSuggestionList(
    data.suggestions ?? data.Suggestions,
    (item) => {
      const normalized = normalizeVocabularySuggestion(item)
      if (!normalized) return null
      return {
        id: normalized.id,
        original: normalized.original,
        suggestion: normalized.suggestion,
        context: normalized.context,
      }
    },
  )
  return { suggestions }
}

function normalizeAiResultItem(raw: unknown): WritingAiResultItem | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const id = pickString(item, 'id', 'Id')
  const purpose = pickString(item, 'purpose', 'Purpose')
  const resultContent = pickString(item, 'resultContent', 'ResultContent')
  if (!purpose || !resultContent) return null
  return {
    id: id || crypto.randomUUID(),
    submitId: pickString(item, 'submitId', 'SubmitId'),
    purpose,
    resultContent,
    providerId: pickString(item, 'providerId', 'ProviderId'),
    modelId: pickString(item, 'modelId', 'ModelId'),
    createdAt: pickString(item, 'createdAt', 'CreatedAt'),
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
    aiCheckEnabled: Boolean(data.aiCheckEnabled ?? data.AiCheckEnabled ?? false),
    aiStructureEnabled: Boolean(data.aiStructureEnabled ?? data.AiStructureEnabled ?? false),
    aiSuggestionEnabled: Boolean(data.aiSuggestionEnabled ?? data.AiSuggestionEnabled ?? false),
    aiResults: normalizeSuggestionList(
      data.aiResults ?? data.AiResults,
      normalizeAiResultItem,
    ),
    submittedAt: pickString(data, 'submittedAt', 'SubmittedAt'),
  }
}

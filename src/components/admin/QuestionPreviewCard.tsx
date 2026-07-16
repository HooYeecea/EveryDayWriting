import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

const TYPE_LABELS: Record<string, string> = {
  vocabulary: '词汇选择',
  grammar_judge: '语法判断',
  sentence_rewrite: '句型改写',
  error_correction: '改错',
  short_writing: '短写作',
}

const EXAM_LABELS: Record<string, string> = {
  CET4: '四级',
  CET6: '六级',
  IELTS: '雅思',
  TOEFL: '托福',
  Postgraduate: '考研',
  General: '通用',
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : { text: value }
    } catch {
      return { text: value }
    }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return { text: String(value) }
}

function pickText(content: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = content[key]
    if (typeof v === 'string' && v.trim()) return v
  }
  return ''
}

function getCorrectKey(answer: Record<string, unknown>): string {
  const raw = answer.correctOption ?? answer.correctAnswer ?? answer.answer ?? answer.correct
  return raw == null ? '' : String(raw)
}

function getSampleAnswer(answer: Record<string, unknown>): string {
  const raw = answer.sampleAnswer ?? answer.correction ?? answer.text
  return raw == null ? '' : String(raw)
}

interface QuestionPreviewCardProps {
  index?: number
  questionType: string
  examType?: string
  difficulty?: number
  stepNumber?: number
  content: unknown
  answer?: unknown
  metaExtra?: ReactNode
  compact?: boolean
  showRawToggle?: boolean
}

export function QuestionPreviewCard({
  index,
  questionType,
  examType,
  difficulty,
  stepNumber,
  content,
  answer,
  metaExtra,
  compact = false,
  showRawToggle = false,
}: QuestionPreviewCardProps) {
  const contentObj = asRecord(content)
  const answerObj = asRecord(answer)
  const sentence = pickText(contentObj, ['sentence', 'prompt', 'topic', 'passage', 'text'])
  const instruction = pickText(contentObj, ['instruction', 'hint'])
  const options = Array.isArray(contentObj.options)
    ? (contentObj.options as Array<{ key?: string; text?: string }>)
    : []
  const correctKey = getCorrectKey(answerObj)
  const sampleAnswer = getSampleAnswer(answerObj)
  const typeLabel = TYPE_LABELS[questionType] ?? questionType
  const examLabel = examType ? EXAM_LABELS[examType] ?? examType : null

  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {index != null && (
          <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white">
            #{index}
          </span>
        )}
        {examLabel && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
            {examLabel}
          </span>
        )}
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600">
          {typeLabel}
        </span>
        {difficulty != null && (
          <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-500">
            难度 {difficulty}
          </span>
        )}
        {stepNumber != null && (
          <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-500">
            步骤 {stepNumber}
          </span>
        )}
        {metaExtra}
      </div>

      {sentence ? (
        <p
          className={`mt-3 font-serif leading-relaxed text-neutral-900 ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          {sentence}
        </p>
      ) : (
        <p className="mt-3 text-sm text-neutral-400">暂无可展示题干</p>
      )}

      {instruction && (
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">{instruction}</p>
      )}

      {options.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {options.map((opt, i) => {
            const key = String(opt.key ?? String.fromCharCode(65 + i))
            const isCorrect =
              correctKey !== '' && correctKey.toLowerCase() === key.toLowerCase()
            return (
              <div
                key={`${key}-${i}`}
                className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${
                  isCorrect
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-100 bg-neutral-50 text-neutral-700'
                }`}
              >
                <span className={`mt-0.5 font-medium ${isCorrect ? 'text-white' : 'text-neutral-500'}`}>
                  {key}.
                </span>
                <span className="min-w-0 flex-1">{opt.text ?? key}</span>
                {isCorrect && <Check size={14} className="mt-0.5 shrink-0" />}
              </div>
            )
          })}
        </div>
      )}

      {questionType === 'grammar_judge' && correctKey && options.length === 0 && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-3 py-2 text-sm text-white">
          <Check size={14} />
          判定：{correctKey === 'hasError' ? '有语法错误' : correctKey === 'correct' ? '语法正确' : correctKey}
        </div>
      )}

      {sampleAnswer && (
        <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            参考答案
          </p>
          <p className="mt-1 font-serif text-sm leading-relaxed text-neutral-800">{sampleAnswer}</p>
        </div>
      )}

      {!sampleAnswer &&
        correctKey &&
        options.length === 0 &&
        questionType !== 'grammar_judge' && (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">答案</p>
            <p className="mt-1 text-sm text-neutral-800">{correctKey}</p>
          </div>
        )}

      {contentObj.wordLimit != null && (
        <p className="mt-2 text-xs text-neutral-400">字数建议：{String(contentObj.wordLimit)}</p>
      )}

      {showRawToggle && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] text-neutral-400 hover:text-neutral-600">
            查看原始 JSON
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-neutral-100 bg-neutral-50 p-2.5 font-mono text-[10px] text-neutral-500">
            {JSON.stringify({ content, answer }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

export { TYPE_LABELS as QUESTION_TYPE_LABELS, EXAM_LABELS as QUESTION_EXAM_LABELS }

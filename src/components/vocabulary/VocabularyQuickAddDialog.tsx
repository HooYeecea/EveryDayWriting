import { useEffect, useState, type FormEvent } from 'react'
import { BookOpen, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { createVocabularyItem } from '../../api/vocabulary'
import type { CreateVocabularyPayload, VocabularyType } from '../../types'
import { DEFAULT_PART_OF_SPEECH, PART_OF_SPEECH_OPTIONS } from '../../data/partOfSpeech'
import { MenuSelect } from '../common/MenuSelect'

export interface VocabularyQuickAddInitial {
  word: string
  translation?: string
  contextSentence?: string
  type?: VocabularyType
}

interface VocabularyQuickAddDialogProps {
  open: boolean
  initial: VocabularyQuickAddInitial | null
  onClose: () => void
  onSuccess?: () => void
}

const TYPE_LABELS: Record<VocabularyType, string> = {
  NewWord: '生词',
  WrongWord: '错词',
}

const VOCABULARY_TYPE_OPTIONS = [
  { value: 'NewWord', label: TYPE_LABELS.NewWord },
  { value: 'WrongWord', label: TYPE_LABELS.WrongWord },
]

const POS_OPTIONS = PART_OF_SPEECH_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}))

export function VocabularyQuickAddDialog({
  open,
  initial,
  onClose,
  onSuccess,
}: VocabularyQuickAddDialogProps) {
  const [form, setForm] = useState<CreateVocabularyPayload>({
    word: '',
    partOfSpeech: DEFAULT_PART_OF_SPEECH,
    translation: '',
    type: 'NewWord',
    contextSentence: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open || !initial) return
    setForm({
      word: initial.word,
      partOfSpeech: DEFAULT_PART_OF_SPEECH,
      translation: initial.translation ?? '',
      type: initial.type ?? 'NewWord',
      contextSentence: initial.contextSentence ?? '',
    })
    setError('')
    setSaved(false)
    setSubmitting(false)
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.word.trim() || !form.translation.trim()) return

    setSubmitting(true)
    setError('')
    try {
      await createVocabularyItem({
        word: form.word.trim(),
        partOfSpeech: form.partOfSpeech.trim() || DEFAULT_PART_OF_SPEECH,
        translation: form.translation.trim(),
        type: form.type,
        contextSentence: form.contextSentence?.trim() || undefined,
      })
      setSaved(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !initial) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        role="dialog"
        aria-labelledby="vocab-quick-add-title"
        data-vocab-dialog
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-neutral-500" />
            <h2 id="vocab-quick-add-title" className="text-base font-semibold text-neutral-900">
              加入个人词库
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {saved ? (
          <div className="mt-4">
            <p className="text-sm text-green-700">「{form.word}」已加入个人词库。</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                完成
              </button>
              <Link
                to="/vocabulary"
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={onClose}
              >
                查看词库
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
            <p className="text-xs text-neutral-500">
              已选中「{initial.word}」，补充释义后即可保存。
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.word}
                onChange={(event) => setForm({ ...form, word: event.target.value })}
                placeholder="单词"
                required
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              <MenuSelect
                value={form.partOfSpeech}
                onChange={(partOfSpeech) => setForm({ ...form, partOfSpeech })}
                options={POS_OPTIONS}
                ariaLabel="词性"
              />
              <input
                value={form.translation}
                onChange={(event) => setForm({ ...form, translation: event.target.value })}
                placeholder="释义（必填）"
                required
                autoFocus
                className="sm:col-span-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              <MenuSelect
                value={form.type}
                onChange={(type) => setForm({ ...form, type: type as VocabularyType })}
                options={VOCABULARY_TYPE_OPTIONS}
                ariaLabel="词条类型"
              />
            </div>
            {form.contextSentence && (
              <div>
                <label className="text-xs text-neutral-400">例句 / 上下文</label>
                <textarea
                  value={form.contextSentence}
                  onChange={(event) =>
                    setForm({ ...form, contextSentence: event.target.value })
                  }
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                />
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? '保存中…' : '保存到词库'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600"
              >
                取消
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { BookOpen, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { createVocabularyItem } from '../../api/vocabulary'
import type { CreateVocabularyPayload, VocabularyType } from '../../types'
import { DEFAULT_PART_OF_SPEECH, PART_OF_SPEECH_OPTIONS } from '../../data/partOfSpeech'
import { MenuSelect } from '../common/MenuSelect'
import { useT, type MessageKey } from '../../i18n'

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

const POS_VALUE_TO_KEY: Record<string, MessageKey> = {
  'n.': 'vocab.pos.n',
  'pron.': 'vocab.pos.pron',
  'v.': 'vocab.pos.v',
  'vt.': 'vocab.pos.vt',
  'vi.': 'vocab.pos.vi',
  'aux.': 'vocab.pos.aux',
  'mod.': 'vocab.pos.mod',
  'adj.': 'vocab.pos.adj',
  'adv.': 'vocab.pos.adv',
  'prep.': 'vocab.pos.prep',
  'conj.': 'vocab.pos.conj',
  'interj.': 'vocab.pos.interj',
  'art.': 'vocab.pos.art',
  'num.': 'vocab.pos.num',
  'det.': 'vocab.pos.det',
  'phr.v.': 'vocab.pos.phrv',
  'phr.': 'vocab.pos.phr',
  'abbr.': 'vocab.pos.abbr',
  'pref.': 'vocab.pos.pref',
  'suf.': 'vocab.pos.suf',
}

const DEFAULT_WIDTH = 448
const DEFAULT_HEIGHT = 420
const MIN_WIDTH = 320
const MIN_HEIGHT = 300

type DialogSize = { width: number; height: number }
type ResizeEdge = 'e' | 's' | 'se'

function clampDialogSize(width: number, height: number): DialogSize {
  const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - 32)
  const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - 32)
  return {
    width: Math.min(maxWidth, Math.max(MIN_WIDTH, width)),
    height: Math.min(maxHeight, Math.max(MIN_HEIGHT, height)),
  }
}

export function VocabularyQuickAddDialog({
  open,
  initial,
  onClose,
  onSuccess,
}: VocabularyQuickAddDialogProps) {
  const t = useT()
  const posOptions = useMemo(
    () =>
      PART_OF_SPEECH_OPTIONS.map((item) => ({
        value: item.value,
        label: t(POS_VALUE_TO_KEY[item.value] ?? 'vocab.pos.n'),
      })),
    [t],
  )
  const vocabularyTypeOptions = useMemo(
    () => [
      { value: 'NewWord', label: t('vocab.quickAdd.typeNew') },
      { value: 'WrongWord', label: t('vocab.quickAdd.typeWrong') },
    ],
    [t],
  )

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
  const [size, setSize] = useState<DialogSize>(() =>
    clampDialogSize(DEFAULT_WIDTH, DEFAULT_HEIGHT),
  )
  const [resizing, setResizing] = useState(false)
  const sizeRef = useRef(size)
  sizeRef.current = size

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
    setSize(clampDialogSize(sizeRef.current.width, sizeRef.current.height))
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const onWindowResize = () => {
      setSize((current) => clampDialogSize(current.width, current.height))
    }
    window.addEventListener('resize', onWindowResize)
    return () => window.removeEventListener('resize', onWindowResize)
  }, [open])

  const handleResizePointerDown = useCallback(
    (edge: ResizeEdge) => (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()

      const handle = event.currentTarget
      const startX = event.clientX
      const startY = event.clientY
      const start = sizeRef.current

      handle.setPointerCapture(event.pointerId)
      setResizing(true)
      document.body.style.userSelect = 'none'
      document.body.style.cursor =
        edge === 'e' ? 'ew-resize' : edge === 's' ? 'ns-resize' : 'nwse-resize'

      const onPointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY
        const nextWidth = edge === 's' ? start.width : start.width + deltaX
        const nextHeight = edge === 'e' ? start.height : start.height + deltaY
        setSize(clampDialogSize(nextWidth, nextHeight))
      }

      const onPointerUp = (upEvent: PointerEvent) => {
        handle.releasePointerCapture(upEvent.pointerId)
        handle.removeEventListener('pointermove', onPointerMove)
        handle.removeEventListener('pointerup', onPointerUp)
        handle.removeEventListener('pointercancel', onPointerUp)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
        setResizing(false)
      }

      handle.addEventListener('pointermove', onPointerMove)
      handle.addEventListener('pointerup', onPointerUp)
      handle.addEventListener('pointercancel', onPointerUp)
    },
    [],
  )

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
      setError(err instanceof Error ? err.message : t('proficiency.error.generic'))
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
        className={`relative flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-xl sm:p-6 ${
          resizing ? '' : 'transition-[width,height] duration-150'
        }`}
        style={{ width: size.width, height: size.height, maxWidth: 'calc(100vw - 2rem)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-neutral-500" />
            <h2 id="vocab-quick-add-title" className="text-base font-semibold text-neutral-900">
              {t('vocab.quickAdd.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label={t('vocab.quickAdd.closeAria')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
          {saved ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <p className="text-sm text-green-700">{t('vocab.quickAdd.saved', { word: form.word })}</p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  {t('vocab.quickAdd.done')}
                </button>
                <Link
                  to="/vocabulary"
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  onClick={onClose}
                >
                  {t('vocab.quickAdd.viewList')}
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="flex min-h-0 flex-1 flex-col gap-3"
            >
              <p className="shrink-0 text-xs text-neutral-500">
                {t('vocab.quickAdd.selectedHint', { word: initial.word })}
              </p>
              <div className="grid shrink-0 gap-3 sm:grid-cols-2">
                <input
                  value={form.word}
                  onChange={(event) => setForm({ ...form, word: event.target.value })}
                  placeholder={t('vocab.quickAdd.wordPlaceholder')}
                  required
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                />
                <MenuSelect
                  value={form.partOfSpeech}
                  onChange={(partOfSpeech) => setForm({ ...form, partOfSpeech })}
                  options={posOptions}
                  ariaLabel={t('vocab.quickAdd.posAria')}
                />
                <input
                  value={form.translation}
                  onChange={(event) => setForm({ ...form, translation: event.target.value })}
                  placeholder={t('vocab.quickAdd.translationPlaceholder')}
                  required
                  autoFocus
                  className="sm:col-span-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                />
                <MenuSelect
                  value={form.type}
                  onChange={(type) => setForm({ ...form, type: type as VocabularyType })}
                  options={vocabularyTypeOptions}
                  ariaLabel={t('vocab.quickAdd.typeAria')}
                />
              </div>
              {form.contextSentence ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <label className="shrink-0 text-xs text-neutral-400">{t('vocab.quickAdd.contextLabel')}</label>
                  <textarea
                    value={form.contextSentence}
                    onChange={(event) =>
                      setForm({ ...form, contextSentence: event.target.value })
                    }
                    className="mt-1 min-h-[4.5rem] w-full flex-1 resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1" />
              )}
              {error && <p className="shrink-0 text-sm text-red-600">{error}</p>}
              <div className="flex shrink-0 gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {submitting ? t('vocab.quickAdd.saving') : t('vocab.quickAdd.save')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 右侧拉宽 */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="调整弹窗宽度"
          title="拖动调整宽度"
          onPointerDown={handleResizePointerDown('e')}
          className="absolute inset-y-3 right-0 w-2 cursor-ew-resize touch-none"
        />
        {/* 底部拉高 */}
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="调整弹窗高度"
          title="拖动调整高度"
          onPointerDown={handleResizePointerDown('s')}
          className="absolute inset-x-3 bottom-0 h-2 cursor-ns-resize touch-none"
        />
        {/* 右下角同时拉宽高 */}
        <div
          role="separator"
          aria-label="调整弹窗大小"
          title="拖动调整大小"
          onPointerDown={handleResizePointerDown('se')}
          className="absolute bottom-0 right-0 z-10 flex h-5 w-5 cursor-nwse-resize touch-none items-end justify-end p-1"
        >
          <span
            aria-hidden
            className="h-2.5 w-2.5 border-b-2 border-r-2 border-neutral-300"
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}

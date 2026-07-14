import { useEffect, useState, type FormEvent } from 'react'
import { BookOpen, Plus, Search, Trash2 } from 'lucide-react'
import {
  createVocabularyItem,
  deleteVocabularyItem,
  getVocabularyList,
  searchVocabulary,
} from '../../api/vocabulary'
import type { CreateVocabularyPayload, VocabularyItem, VocabularyType } from '../../types'
import { DEFAULT_PART_OF_SPEECH, PART_OF_SPEECH_OPTIONS } from '../../data/partOfSpeech'
import { MenuSelect } from '../common/MenuSelect'
import { MAIN_CONTENT_X_CLASS, PANEL_HEADER_CLASS, PANEL_TITLE_CLASS } from '../layout/layoutConstants'

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

export function PersonalVocabulary() {
  const [items, setItems] = useState<VocabularyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateVocabularyPayload>({
    word: '',
    partOfSpeech: DEFAULT_PART_OF_SPEECH,
    translation: '',
    type: 'NewWord',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')

  const loadItems = () => {
    setLoading(true)
    setError('')
    const request = activeQuery.trim()
      ? searchVocabulary(activeQuery.trim()).then((result) => result.items)
      : getVocabularyList({ page: 1, pageSize: 100 }).then((result) => result.items)

    request
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
  }, [activeQuery])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.word.trim() || !form.translation.trim()) return

    setSubmitting(true)
    setError('')
    try {
      await createVocabularyItem({
        ...form,
        word: form.word.trim(),
        translation: form.translation.trim(),
      })
      setForm({ word: '', partOfSpeech: DEFAULT_PART_OF_SPEECH, translation: '', type: 'NewWord' })
      setShowForm(false)
      loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除该词条？')) return
    try {
      await deleteVocabularyItem(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={PANEL_HEADER_CLASS}>
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-neutral-500" />
          <h1 className={PANEL_TITLE_CLASS}>个人词库</h1>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setActiveQuery(searchQuery.trim())
          }}
          className="mb-4 flex gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索单词…"
              className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            搜索
          </button>
          {activeQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setActiveQuery('')
              }}
              className="shrink-0 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50"
            >
              清除
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowForm((open) => !open)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={14} />
            添加词条
          </button>
        </form>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6"
          >
            <h2 className="text-sm font-medium text-neutral-900">新增词条</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={form.word}
                onChange={(e) => setForm({ ...form, word: e.target.value })}
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
                onChange={(e) => setForm({ ...form, translation: e.target.value })}
                placeholder="释义"
                required
                className="sm:col-span-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              <MenuSelect
                value={form.type}
                onChange={(type) => setForm({ ...form, type: type as VocabularyType })}
                options={VOCABULARY_TYPE_OPTIONS}
                ariaLabel="词条类型"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? '保存中…' : '保存'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600"
              >
                取消
              </button>
            </div>
          </form>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-neutral-400">加载中…</p>}

        {!loading && items.length === 0 && (
          <p className="text-sm text-neutral-400">暂无词条，点击「添加词条」开始积累。</p>
        )}

        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold text-neutral-900">{item.word}</span>
                    <span className="text-xs text-neutral-400">{item.partOfSpeech}</span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      {TYPE_LABELS[item.type]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-700">{item.translations.join('；')}</p>
                  {item.contextSentence && (
                    <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                      {item.contextSentence}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  className="shrink-0 rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

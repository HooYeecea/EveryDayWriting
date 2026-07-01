import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { saveWritingDraft } from '../../api/writing'
import { NotionEditor } from '../editor/NotionEditor'
import { getRandomTopic } from '../../data/mockTopics'
import type { WritingTopic } from '../../types'

export function StartWriting() {
  const [topic, setTopic] = useState<WritingTopic>(() => getRandomTopic())
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleChangeTopic = () => {
    setTopic(getRandomTopic(topic.id))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveWritingDraft({
        topicId: topic.id,
        title,
        content,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      alert('提交成功！（演示模式，尚未对接后端）')
    }, 600)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 题目区域 */}
      <div className="shrink-0 border-b border-neutral-200 bg-white px-8 py-5">
        <div className="mx-auto flex max-w-4xl items-start gap-4">
          <div className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-400">
              题目
            </p>
            <p className="text-[15px] leading-relaxed text-neutral-800">{topic.prompt}</p>
          </div>
          <button
            type="button"
            onClick={handleChangeTopic}
            className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <RefreshCw size={14} />
            换一个题目
          </button>
        </div>
      </div>

      {/* 写作主体 */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl flex-1 px-8 py-8">
          {/* 标题 + 题目类型 */}
          <div className="relative mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="自定义标题"
              className={`w-full border-none bg-transparent text-2xl font-semibold text-neutral-900 outline-none placeholder:text-neutral-300 ${
                title.trim() ? 'text-center' : 'text-left'
              }`}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-500">
                {topic.type}
              </span>
            </div>
          </div>

          {/* Notion 风格编辑器 */}
          <NotionEditor content={content} onChange={setContent} />
        </div>

        {/* 提交按钮 */}
        <div className="sticky bottom-0 shrink-0 border-t border-neutral-200 bg-white px-8 py-4">
          <div className="mx-auto flex max-w-3xl justify-end gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg border border-neutral-200 bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
            >
              {isSaving ? '保存中…' : '保存'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? '提交中…' : '提交'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

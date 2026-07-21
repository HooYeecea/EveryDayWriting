import { useEffect, useRef, useState } from 'react'
import { BarChart3, FileCheck, Lightbulb, Sparkles, Wand2 } from 'lucide-react'
import { getAiConfig } from '../../api/ai'
import {
  loadAiAssistSettings,
  saveAiAssistSettings,
  type AiAssistSettings,
} from '../../storage/aiSettingsStorage'

export type AiAssistToggleKey = keyof Pick<
  AiAssistSettings,
  'postSubmitReview' | 'postSubmitStructure' | 'postSubmitSuggestions' | 'realtimeAssist'
>

interface WritingAiAssistProps {
  onSettingsSaved?: (settings: AiAssistSettings) => void
  /** 从折叠条定位到具体开关时传入；配合 highlightNonce 可重复触发闪动 */
  highlightKey?: AiAssistToggleKey | null
  highlightNonce?: number
}

const TOGGLE_FLASH_DELAY_MS = 320

export function WritingAiAssist({
  onSettingsSaved,
  highlightKey = null,
  highlightNonce = 0,
}: WritingAiAssistProps) {
  const [postSubmitReview, setPostSubmitReview] = useState(false)
  const [postSubmitStructure, setPostSubmitStructure] = useState(false)
  const [postSubmitSuggestions, setPostSubmitSuggestions] = useState(false)
  const [realtimeAssist, setRealtimeAssist] = useState(false)
  const [hasAiAccess, setHasAiAccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [flashingKey, setFlashingKey] = useState<AiAssistToggleKey | null>(null)
  const rowRefs = useRef<Partial<Record<AiAssistToggleKey, HTMLLabelElement | null>>>({})

  useEffect(() => {
    const saved = loadAiAssistSettings()
    setPostSubmitReview(saved.postSubmitReview)
    setPostSubmitStructure(saved.postSubmitStructure)
    setPostSubmitSuggestions(saved.postSubmitSuggestions)
    setRealtimeAssist(saved.realtimeAssist)

    // AI 可用 = 有自有 Key 或免费通道开启
    const hasOwnKey = Boolean(saved.encryptedKey && saved.providerId && saved.modelId)
    getAiConfig().then(cfg => {
      setHasAiAccess(hasOwnKey || (cfg.freeQuota?.enabled ?? false))
    }).catch(() => {
      setHasAiAccess(hasOwnKey)
    })
  }, [])

  useEffect(() => {
    if (!highlightKey || !highlightNonce) return

    const timer = window.setTimeout(() => {
      setFlashingKey(highlightKey)
      rowRefs.current[highlightKey]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, TOGGLE_FLASH_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [highlightKey, highlightNonce])

  const handleSave = () => {
    setSaving(true)
    const current = loadAiAssistSettings()
    const next = {
      ...current,
      postSubmitReview,
      postSubmitStructure,
      postSubmitSuggestions,
      realtimeAssist,
    }
    saveAiAssistSettings(next)
    onSettingsSaved?.(next)
    setMessage('AI 辅助开关已保存')
    setSaving(false)
  }

  const rowClass = (key: AiAssistToggleKey) =>
    `flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 ${
      flashingKey === key ? 'animate-assist-target-flash' : ''
    }`

  const bindRowRef = (key: AiAssistToggleKey) => (el: HTMLLabelElement | null) => {
    rowRefs.current[key] = el
  }

  const clearFlash = (key: AiAssistToggleKey) => {
    if (flashingKey === key) setFlashingKey(null)
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-neutral-500" strokeWidth={1.75} />
        <h4 className="text-sm font-medium text-neutral-900">AI 辅助开关</h4>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        控制提交后与写作过程中的 AI 行为。连接配置请在用户中心 → 设置中管理。
      </p>

      {!hasAiAccess && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          当前无法使用 AI 功能。请前往用户中心 → 设置 → AI 辅助配置。
        </p>
      )}

      {message && <p className="mt-3 text-xs text-green-700">{message}</p>}

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-neutral-600">提交后辅助</p>
          <div className="mt-2 space-y-2">
            <label
              ref={bindRowRef('postSubmitReview')}
              className={rowClass('postSubmitReview')}
              onAnimationEnd={() => clearFlash('postSubmitReview')}
            >
              <input
                type="checkbox"
                checked={postSubmitReview}
                onChange={(e) => setPostSubmitReview(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Wand2 size={14} className="shrink-0 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-800">AI 检查与修改</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  提交后自动检查语法、表达等问题，并给出修改版本供参考。
                </p>
              </div>
            </label>
            <label
              ref={bindRowRef('postSubmitStructure')}
              className={rowClass('postSubmitStructure')}
              onAnimationEnd={() => clearFlash('postSubmitStructure')}
            >
              <input
                type="checkbox"
                checked={postSubmitStructure}
                onChange={(e) => setPostSubmitStructure(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <BarChart3 size={14} className="shrink-0 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-800">结构与评分</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  提交后进行 IELTS 9分制综合评分，分析文章结构、连贯性与逻辑，给出逐段点评。
                </p>
              </div>
            </label>
            <label
              ref={bindRowRef('postSubmitSuggestions')}
              className={rowClass('postSubmitSuggestions')}
              onAnimationEnd={() => clearFlash('postSubmitSuggestions')}
            >
              <input
                type="checkbox"
                checked={postSubmitSuggestions}
                onChange={(e) => setPostSubmitSuggestions(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Lightbulb size={14} className="shrink-0 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-800">提升建议</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  提交后综合点评文章结构与语言，给出针对性的进步建议。
                </p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-600">写作过程中</p>
          <div className="mt-2">
            <label
              ref={bindRowRef('realtimeAssist')}
              className={rowClass('realtimeAssist')}
              onAnimationEnd={() => clearFlash('realtimeAssist')}
            >
              <input
                type="checkbox"
                checked={realtimeAssist}
                onChange={(e) => setRealtimeAssist(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <FileCheck size={14} className="shrink-0 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-800">实时辅助写作</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  边写边获得 AI 提示，包括用词、句式和结构方面的即时建议。
                </p>
              </div>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? '保存中…' : '保存设置'}
        </button>
      </div>
    </section>
  )
}

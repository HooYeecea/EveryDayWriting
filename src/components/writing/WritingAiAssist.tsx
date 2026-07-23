import { useEffect, useRef, useState } from 'react'
import { BarChart3, FileCheck, Lightbulb, Sparkles, Wand2 } from 'lucide-react'
import { getAiConfig } from '../../api/ai'
import { useT } from '../../i18n'
import {
  loadAiAssistSettings,
  saveAiAssistSettings,
  type AiAssistSettings,
  type RealtimeStreamEffect,
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

const STREAM_EFFECT_OPTIONS: RealtimeStreamEffect[] = ['tips-fade', 'typewriter', 'fade']

export function WritingAiAssist({
  onSettingsSaved,
  highlightKey = null,
  highlightNonce = 0,
}: WritingAiAssistProps) {
  const t = useT()
  const [postSubmitReview, setPostSubmitReview] = useState(false)
  const [postSubmitStructure, setPostSubmitStructure] = useState(false)
  const [postSubmitSuggestions, setPostSubmitSuggestions] = useState(false)
  const [realtimeAssist, setRealtimeAssist] = useState(false)
  const [realtimeStreamEnabled, setRealtimeStreamEnabled] = useState(true)
  const [realtimeStreamEffect, setRealtimeStreamEffect] =
    useState<RealtimeStreamEffect>('tips-fade')
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
    setRealtimeStreamEnabled(saved.realtimeStreamEnabled)
    setRealtimeStreamEffect(saved.realtimeStreamEffect)

    const hasOwnKey = Boolean(saved.encryptedKey && saved.providerId && saved.modelId)
    getAiConfig()
      .then((cfg) => {
        setHasAiAccess(hasOwnKey || (cfg.freeQuota?.enabled ?? false))
      })
      .catch(() => {
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
      realtimeStreamEnabled,
      realtimeStreamEffect,
    }
    saveAiAssistSettings(next)
    onSettingsSaved?.(next)
    setMessage(t('assist.ai.saved'))
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

  const effectLabel = (effect: RealtimeStreamEffect) => {
    if (effect === 'tips-fade') return t('assist.ai.stream.effect.tipsFade')
    if (effect === 'typewriter') return t('assist.ai.stream.effect.typewriter')
    return t('assist.ai.stream.effect.fade')
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-neutral-500" strokeWidth={1.75} />
        <h4 className="text-sm font-medium text-neutral-900">{t('assist.ai.title')}</h4>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">{t('assist.ai.intro')}</p>

      {!hasAiAccess && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {t('assist.ai.unavailable')}
        </p>
      )}

      {message && <p className="mt-3 text-xs text-green-700">{message}</p>}

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-neutral-600">{t('assist.ai.sectionPostSubmit')}</p>
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
                  <span className="text-xs font-medium text-neutral-800">
                    {t('assist.ai.toggle.review')}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  {t('assist.ai.toggle.reviewDesc')}
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
                  <span className="text-xs font-medium text-neutral-800">
                    {t('assist.ai.toggle.structure')}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  {t('assist.ai.toggle.structureDesc')}
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
                  <span className="text-xs font-medium text-neutral-800">
                    {t('assist.ai.toggle.suggestions')}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  {t('assist.ai.toggle.suggestionsDesc')}
                </p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-600">{t('assist.ai.sectionWhileWriting')}</p>
          <div className="mt-2 space-y-2">
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
                  <span className="text-xs font-medium text-neutral-800">
                    {t('assist.ai.toggle.realtime')}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  {t('assist.ai.toggle.realtimeDesc')}
                </p>
              </div>
            </label>

            {realtimeAssist ? (
              <div className="space-y-2 rounded-lg border border-dashed border-neutral-200 bg-white/80 px-3 py-2.5">
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={realtimeStreamEnabled}
                    onChange={(e) => setRealtimeStreamEnabled(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-neutral-800">
                      {t('assist.ai.stream.toggle')}
                    </span>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                      {t('assist.ai.stream.toggleDesc')}
                    </p>
                  </div>
                </label>

                {realtimeStreamEnabled ? (
                  <label className="block">
                    <span className="text-[11px] font-medium text-neutral-600">
                      {t('assist.ai.stream.effectLabel')}
                    </span>
                    <select
                      value={realtimeStreamEffect}
                      onChange={(e) =>
                        setRealtimeStreamEffect(e.target.value as RealtimeStreamEffect)
                      }
                      className="mt-1.5 w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-800 outline-none focus:border-neutral-400 focus:bg-white"
                    >
                      {STREAM_EFFECT_OPTIONS.map((effect) => (
                        <option key={effect} value={effect}>
                          {effectLabel(effect)}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                      {t('assist.ai.stream.effectDesc')}
                    </p>
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t('common.saving') : t('assist.ai.saveSettings')}
        </button>
      </div>
    </section>
  )
}

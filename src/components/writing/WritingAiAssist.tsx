import { useEffect, useState, type FormEvent } from 'react'
import { FileCheck, Lightbulb, Sparkles, Wand2 } from 'lucide-react'
import { getAiConfig, submitAiKey } from '../../api/ai'
import type { AiConfig, AiProviderBrief } from '../../types'
import { loadAiAssistSettings, saveAiAssistSettings } from '../../storage/aiSettingsStorage'

function pickDefaultModel(provider: AiProviderBrief | undefined) {
  if (!provider) return ''
  return provider.models.find((model) => model.isDefault)?.id ?? provider.models[0]?.id ?? ''
}

export function WritingAiAssist() {
  const [config, setConfig] = useState<AiConfig | null>(null)
  const [providerId, setProviderId] = useState('')
  const [modelId, setModelId] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [encryptedKey, setEncryptedKey] = useState('')
  const [postSubmitReview, setPostSubmitReview] = useState(false)
  const [postSubmitSuggestions, setPostSubmitSuggestions] = useState(false)
  const [realtimeAssist, setRealtimeAssist] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedProvider = config?.providers.find((item) => item.id === providerId)

  useEffect(() => {
    const saved = loadAiAssistSettings()
    setPostSubmitReview(saved.postSubmitReview)
    setPostSubmitSuggestions(saved.postSubmitSuggestions)
    setRealtimeAssist(saved.realtimeAssist)
    setEncryptedKey(saved.encryptedKey)

    getAiConfig()
      .then((data) => {
        setConfig(data)
        const initialProvider = saved.providerId || data.providers[0]?.id || ''
        setProviderId(initialProvider)
        const provider = data.providers.find((item) => item.id === initialProvider)
        setModelId(saved.modelId || pickDefaultModel(provider))
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载 AI 配置失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleProviderChange = (value: string) => {
    setProviderId(value)
    const provider = config?.providers.find((item) => item.id === value)
    setModelId(pickDefaultModel(provider))
  }

  const handleSaveKey = async (event: FormEvent) => {
    event.preventDefault()
    if (!providerId || !apiKeyInput.trim()) {
      setError('请选择 Provider 并输入 API Key')
      return
    }

    setSavingKey(true)
    setError('')
    setMessage('')
    try {
      const result = await submitAiKey(providerId, apiKeyInput.trim())
      setEncryptedKey(result.encryptedKey)
      setApiKeyInput('')
      saveAiAssistSettings({
        providerId,
        modelId,
        encryptedKey: result.encryptedKey,
        postSubmitReview,
        postSubmitSuggestions,
        realtimeAssist,
      })
      setMessage('API Key 已加密并保存到本地')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存 Key 失败')
    } finally {
      setSavingKey(false)
    }
  }

  const handleSaveSettings = () => {
    setSavingSettings(true)
    saveAiAssistSettings({
      providerId,
      modelId,
      encryptedKey,
      postSubmitReview,
      postSubmitSuggestions,
      realtimeAssist,
    })
    setMessage('AI 助手设置已保存')
    setSavingSettings(false)
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-neutral-500" strokeWidth={1.75} />
        <h4 className="text-sm font-medium text-neutral-900">AI 助手</h4>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        配置 Provider 与 API Key 后，可开启提交后与写作过程中的 AI 辅助。
      </p>

      {loading && <p className="mt-3 text-xs text-neutral-400">加载配置中…</p>}
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {message && <p className="mt-3 text-xs text-green-700">{message}</p>}

      {!loading && config && (
        <div className="mt-4 space-y-3">
          {config.providers.length === 0 ? (
            <p className="text-xs text-neutral-400">暂无可用的 AI Provider，请联系管理员配置。</p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-neutral-600">
                    Provider
                  </label>
                  <select
                    value={providerId}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-400"
                  >
                    {config.providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-neutral-600">
                    模型
                  </label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-400"
                  >
                    {(selectedProvider?.models ?? []).map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-2">
                <label className="block text-[11px] font-medium text-neutral-600">API Key</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={encryptedKey ? '已配置，输入新 Key 可覆盖' : '输入你的 LLM API Key'}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-400"
                />
                <button
                  type="submit"
                  disabled={savingKey}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {savingKey ? '加密中…' : '加密并保存 Key'}
                </button>
              </form>
            </>
          )}

          <div>
            <p className="text-xs font-medium text-neutral-600">提交后辅助</p>
            <div className="mt-2 space-y-2">
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
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
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
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
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
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

          <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-3 text-[11px] leading-relaxed text-neutral-400">
            功能开关与 Key 保存在本地；实际 AI 调用将在提交/写作流程中通过 `/ai/proxy` 触发。
            {config.features.dictionary && ' · 查词'}
            {config.features.translation && ' · 翻译'}
            {config.features.brainstorm && ' · 思路引导'}
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings || config.providers.length === 0}
            className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {savingSettings ? '保存中…' : '保存设置'}
          </button>
        </div>
      )}
    </section>
  )
}

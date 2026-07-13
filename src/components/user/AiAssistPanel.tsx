import { useEffect, useState, type FormEvent } from 'react'
import { Key, Sparkles } from 'lucide-react'
import { getAiConfig, submitAiKey } from '../../api/ai'
import type { AiConfig, AiProviderBrief } from '../../types'
import { loadAiAssistSettings, saveAiAssistSettings } from '../../storage/aiSettingsStorage'

function pickDefaultModel(provider: AiProviderBrief | undefined) {
  if (!provider) return ''
  return provider.models.find((model) => model.isDefault)?.id ?? provider.models[0]?.id ?? ''
}

export function AiAssistPanel() {
  const [config, setConfig] = useState<AiConfig | null>(null)
  const [providerId, setProviderId] = useState('')
  const [modelId, setModelId] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [encryptedKey, setEncryptedKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedProvider = config?.providers.find((item) => item.id === providerId)

  useEffect(() => {
    const saved = loadAiAssistSettings()
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

      const current = loadAiAssistSettings()
      saveAiAssistSettings({
        ...current,
        providerId,
        modelId,
        encryptedKey: result.encryptedKey,
      })
      setMessage('API Key 已加密并保存到本地')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存 Key 失败')
    } finally {
      setSavingKey(false)
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-neutral-500" strokeWidth={1.75} />
        <h3 className="text-sm font-medium text-neutral-900">AI 连接配置</h3>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        配置 AI Provider 与 API Key，供写作提交时调用 AI 批改与建议。
      </p>

      {loading && <p className="mt-4 text-sm text-neutral-400">加载配置中…</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-green-700">{message}</p>}

      {!loading && config && (
        <div className="mt-4 space-y-4">
          {config.providers.length === 0 ? (
            <p className="text-sm text-neutral-400">暂无可用的 AI Provider，请联系管理员配置。</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                    Provider
                  </label>
                  <select
                    value={providerId}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-neutral-400 focus:bg-white"
                  >
                    {config.providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                    模型
                  </label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-neutral-400 focus:bg-white"
                  >
                    {(selectedProvider?.models ?? []).map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <div className="flex items-center gap-1.5">
                  <Key size={14} className="text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-700">API Key</span>
                  {encryptedKey && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      已配置
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {encryptedKey
                    ? 'Key 已加密存储。输入新 Key 可替换当前配置。'
                    : '输入你的 LLM API Key，将加密后存储在本地浏览器。'}
                </p>
                <form onSubmit={handleSaveKey} className="mt-3 flex gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={encryptedKey ? '输入新 Key 以替换…' : '粘贴你的 API Key'}
                    className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                  />
                  <button
                    type="submit"
                    disabled={savingKey}
                    className="shrink-0 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {savingKey ? '加密中…' : '加密并保存'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

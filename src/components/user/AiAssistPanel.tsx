import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Key, Sparkles, Zap } from 'lucide-react'
import { getAiConfig, submitAiKey } from '../../api/ai'
import type { AiConfig, AiProviderBrief } from '../../types'
import { loadAiAssistSettings, saveAiAssistSettings } from '../../storage/aiSettingsStorage'
import { MenuSelect } from '../common/MenuSelect'

function pickDefaultModel(provider: AiProviderBrief | undefined) {
  if (!provider) return ''
  return provider.models.find((model) => model.isDefault)?.id ?? provider.models[0]?.id ?? ''
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

export function AiAssistPanel({ onReady }: { onReady?: () => void } = {}) {
  const [config, setConfig] = useState<AiConfig | null>(null)
  const [providerId, setProviderId] = useState('')
  const [modelId, setModelId] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [encryptedKey, setEncryptedKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const readyReportedRef = useRef(false)

  const selectedProvider = config?.providers.find((item) => item.id === providerId)
  const freeQuota = config?.freeQuota

  const providerOptions = useMemo(
    () => (config?.providers ?? []).map((p) => ({ value: p.id, label: p.name })),
    [config],
  )

  const modelOptions = useMemo(
    () => (selectedProvider?.models ?? []).map((m) => ({ value: m.id, label: m.name })),
    [selectedProvider],
  )

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

  useEffect(() => {
    if (loading || readyReportedRef.current) return
    readyReportedRef.current = true
    onReady?.()
  }, [loading, onReady])

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
      saveAiAssistSettings({ ...current, providerId, modelId, encryptedKey: result.encryptedKey })
      setMessage('API Key 已加密并保存到本地')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存 Key 失败')
    } finally {
      setSavingKey(false)
    }
  }

  const handleClearKey = () => {
    setError('')
    setApiKeyInput('')
    setEncryptedKey('')
    const current = loadAiAssistSettings()
    saveAiAssistSettings({ ...current, encryptedKey: '' })
    setMessage('已清除自有 API Key，将使用平台免费通道')
  }

  const quotaPercent = freeQuota && freeQuota.enabled && freeQuota.dailyTokenLimit > 0
    ? Math.min(100, Math.round((freeQuota.todayTokensUsed / freeQuota.dailyTokenLimit) * 100))
    : 0

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-neutral-500" strokeWidth={1.75} />
        <h3 className="text-sm font-medium text-neutral-900">AI 写作辅助</h3>
      </div>

      {loading && <p className="mt-4 text-sm text-neutral-400">加载中…</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-green-700">{message}</p>}

      {!loading && config && (
        <div className="mt-4 space-y-4">
          {/* ── 免费通道状态 ── */}
          {freeQuota?.enabled && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-3">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">免费通道已开启</span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-green-700">
                  <span>今日已用 {formatTokens(freeQuota.todayTokensUsed)} / {formatTokens(freeQuota.dailyTokenLimit)} Token</span>
                  <span>{quotaPercent}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-green-200">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-green-600/80">
                每日限额 {formatTokens(freeQuota.dailyTokenLimit)} Token · {freeQuota.dailySubmitLimit} 篇提交
                {freeQuota.todaySubmitsUsed > 0 ? ` · 今日已提交 ${freeQuota.todaySubmitsUsed} 篇` : ''}
              </p>
            </div>
          )}

          {/* ── 自有 Key 配置（可选） ── */}
          {config.providers.length === 0 ? (
            <p className="text-sm text-neutral-400">暂无可用的 AI Provider，请联系管理员配置。</p>
          ) : (
            <details className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <summary className="cursor-pointer select-none text-sm font-medium text-neutral-600">
                <Key size={14} className="mr-1.5 inline text-neutral-400" />
                自有 API Key（可选，不受免费额度限制）
                {encryptedKey && (
                  <span className="ml-2 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">已配置</span>
                )}
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-500">Provider</label>
                  <MenuSelect value={providerId} options={providerOptions} onChange={handleProviderChange} placeholder="选择 Provider" ariaLabel="选择 AI Provider" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-500">模型</label>
                  <MenuSelect value={modelId} options={modelOptions} onChange={setModelId} placeholder="选择模型" ariaLabel="选择模型" disabled={modelOptions.length === 0} />
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {encryptedKey
                  ? 'Key 已加密存储。输入新 Key 可替换，或清除后改用平台免费通道。'
                  : '输入你的 LLM API Key，将加密后存储在本地浏览器。拥有自有 Key 的用户不受每日免费额度限制。'}
              </p>
              <form onSubmit={handleSaveKey} className="mt-2 flex flex-wrap gap-2">
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
                {encryptedKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="shrink-0 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    清除 Key
                  </button>
                )}
              </form>
            </details>
          )}
        </div>
      )}
    </section>
  )
}

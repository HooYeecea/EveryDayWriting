import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Key, Sparkles, Zap } from 'lucide-react'
import { getAiConfig, submitAiKey } from '../../api/ai'
import type { AiConfig, AiProviderBrief } from '../../types'
import { loadAiAssistSettings, saveAiAssistSettings } from '../../storage/aiSettingsStorage'
import { useT } from '../../i18n'
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
  const t = useT()
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
      .catch((err) =>
        setError(err instanceof Error ? err.message : t('aiAssist.loadFailed')),
      )
      .finally(() => setLoading(false))
  }, [t])

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
      setError(t('aiAssist.error.needKey'))
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
      setMessage(t('aiAssist.success.keySaved'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiAssist.error.saveFailed'))
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
    setMessage(t('aiAssist.success.keyCleared'))
  }

  const quotaPercent = freeQuota && freeQuota.enabled && freeQuota.dailyTokenLimit > 0
    ? Math.min(100, Math.round((freeQuota.todayTokensUsed / freeQuota.dailyTokenLimit) * 100))
    : 0

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-neutral-500" strokeWidth={1.75} />
        <h3 className="text-sm font-medium text-neutral-900">{t('aiAssist.title')}</h3>
      </div>

      {loading && <p className="mt-4 text-sm text-neutral-400">{t('common.loading')}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-green-700">{message}</p>}

      {!loading && config && (
        <div className="mt-4 space-y-4">
          {freeQuota?.enabled && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-3">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">{t('aiAssist.free.enabled')}</span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-green-700">
                  <span>
                    {t('aiAssist.free.tokensToday', {
                      used: formatTokens(freeQuota.todayTokensUsed),
                      limit: formatTokens(freeQuota.dailyTokenLimit),
                    })}
                  </span>
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
                {t('aiAssist.free.dailyLimit', {
                  limit: formatTokens(freeQuota.dailyTokenLimit),
                  submits: freeQuota.dailySubmitLimit,
                })}
                {freeQuota.todaySubmitsUsed > 0
                  ? ` · ${t('aiAssist.free.submitsToday', { n: freeQuota.todaySubmitsUsed })}`
                  : ''}
              </p>
            </div>
          )}

          {config.providers.length === 0 ? (
            <p className="text-sm text-neutral-400">{t('aiAssist.noProviders')}</p>
          ) : (
            <details className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <summary className="cursor-pointer select-none text-sm font-medium text-neutral-600">
                <Key size={14} className="mr-1.5 inline text-neutral-400" />
                {t('aiAssist.ownKey.title')}
                {encryptedKey && (
                  <span className="ml-2 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                    {t('aiAssist.ownKey.configured')}
                  </span>
                )}
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                    {t('aiAssist.ownKey.provider')}
                  </label>
                  <MenuSelect
                    value={providerId}
                    options={providerOptions}
                    onChange={handleProviderChange}
                    placeholder={t('aiAssist.ownKey.selectProvider')}
                    ariaLabel={t('aiAssist.ownKey.selectProvider')}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                    {t('aiAssist.ownKey.model')}
                  </label>
                  <MenuSelect
                    value={modelId}
                    options={modelOptions}
                    onChange={setModelId}
                    placeholder={t('aiAssist.ownKey.selectModel')}
                    ariaLabel={t('aiAssist.ownKey.selectModel')}
                    disabled={modelOptions.length === 0}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {encryptedKey ? t('aiAssist.ownKey.hintConfigured') : t('aiAssist.ownKey.hintEmpty')}
              </p>
              <form onSubmit={handleSaveKey} className="mt-2 flex flex-wrap gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    encryptedKey
                      ? t('aiAssist.ownKey.placeholderReplace')
                      : t('aiAssist.ownKey.placeholderNew')
                  }
                  className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                />
                <button
                  type="submit"
                  disabled={savingKey}
                  className="shrink-0 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {savingKey ? t('aiAssist.ownKey.encrypting') : t('aiAssist.ownKey.save')}
                </button>
                {encryptedKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="shrink-0 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {t('aiAssist.ownKey.clear')}
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

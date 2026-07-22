import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Gauge } from 'lucide-react'
import { getTokenBudget, getTokenUsageDetails, getTokenUsageSummary, setTokenBudget } from '../../api/tokenUsage'
import { usePreferences } from '../../context/PreferencesContext'
import { useT } from '../../i18n'
import type { MessageKey } from '../../i18n'
import { APP_LOCALE_TO_BCP47 } from '../../types/preferences'
import type { TokenBudgetStatus, TokenUsageDetailItem, TokenUsageSummary } from '../../types'

const STAT_CARD_KEYS: { labelKey: MessageKey; valueKey: 'month' | 'total' | 'calls' | 'status' }[] = [
  { labelKey: 'token.monthConsumed', valueKey: 'month' },
  { labelKey: 'token.totalConsumed', valueKey: 'total' },
  { labelKey: 'token.callCount', valueKey: 'calls' },
  { labelKey: 'token.budgetStatus', valueKey: 'status' },
]

export function TokenUsagePanel({ onReady }: { onReady?: () => void } = {}) {
  const t = useT()
  const { preferences } = usePreferences()
  const dateLocale = APP_LOCALE_TO_BCP47[preferences.locale]
  const [summary, setSummary] = useState<TokenUsageSummary | null>(null)
  const [budget, setBudget] = useState<TokenBudgetStatus | null>(null)
  const [details, setDetails] = useState<TokenUsageDetailItem[]>([])
  const [budgetInput, setBudgetInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const readyReportedRef = useRef(false)

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([getTokenUsageSummary(), getTokenBudget(), getTokenUsageDetails(1, 5)])
      .then(([summaryData, budgetData, detailData]) => {
        setSummary(summaryData)
        setBudget(budgetData)
        setDetails(detailData.items)
        setBudgetInput(
          budgetData.budgetLimit != null ? String(budgetData.budgetLimit) : '',
        )
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('token.loadFailed')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (loading || readyReportedRef.current) return
    readyReportedRef.current = true
    onReady?.()
  }, [loading, onReady])

  const handleSaveBudget = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const value = budgetInput.trim() ? Number(budgetInput) : null
      if (budgetInput.trim() && (!Number.isFinite(value) || value! < 0)) {
        setError(t('token.invalidBudget'))
        return
      }
      await setTokenBudget(value)
      setMessage(t('token.budgetUpdated'))
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('token.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const statValues =
    summary && budget
      ? {
          month: summary.consumedThisMonth.toLocaleString(dateLocale),
          total: summary.totalConsumed.toLocaleString(dateLocale),
          calls: String(summary.totalCalls),
          status:
            budget.status === 'exceeded' ? t('token.statusExceeded') : t('token.statusNormal'),
        }
      : null

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Gauge size={18} className="text-neutral-500" />
        <h3 className="text-sm font-medium text-neutral-900">{t('token.title')}</h3>
      </div>

      {loading && (
        <div
          className="mt-4 flex min-h-[200px] flex-col items-center justify-center gap-2 text-sm text-neutral-400"
          role="status"
        >
          {t('common.loading')}
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {summary && budget && statValues && !loading && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STAT_CARD_KEYS.map(({ labelKey, valueKey }) => (
              <div key={labelKey} className="rounded-xl bg-neutral-50 px-3 py-3">
                <p className="text-lg font-semibold text-neutral-900">{statValues[valueKey]}</p>
                <p className="mt-1 text-xs text-neutral-500">{t(labelKey)}</p>
              </div>
            ))}
          </div>

          {budget.budgetLimit != null && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-neutral-500">
                <span>{t('token.monthProgress')}</span>
                <span>{budget.consumedPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full ${budget.status === 'exceeded' ? 'bg-red-500' : 'bg-neutral-900'}`}
                  style={{ width: `${Math.min(budget.consumedPercent, 100)}%` }}
                />
              </div>
            </div>
          )}

          <form onSubmit={handleSaveBudget} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                {t('token.budgetLabel')}
              </label>
              <input
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value.replace(/\D/g, ''))}
                placeholder={t('token.budgetPlaceholder')}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('token.updateBudget')}
            </button>
          </form>

          {message && <p className="text-sm text-green-700">{message}</p>}

          {details.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-neutral-500">{t('token.recentCalls')}</h4>
              <ul className="mt-2 space-y-2">
                {details.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600"
                  >
                    <span className="font-medium text-neutral-800">{item.purpose}</span>
                    {' · '}
                    {item.totalTokens} tokens
                    {' · '}
                    {new Date(item.createdAt).toLocaleString(dateLocale)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

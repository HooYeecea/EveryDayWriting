import { useEffect, useState, type FormEvent } from 'react'
import { Gauge } from 'lucide-react'
import { getTokenBudget, getTokenUsageDetails, getTokenUsageSummary, setTokenBudget } from '../../api/tokenUsage'
import type { TokenBudgetStatus, TokenUsageDetailItem, TokenUsageSummary } from '../../types'

export function TokenUsagePanel() {
  const [summary, setSummary] = useState<TokenUsageSummary | null>(null)
  const [budget, setBudget] = useState<TokenBudgetStatus | null>(null)
  const [details, setDetails] = useState<TokenUsageDetailItem[]>([])
  const [budgetInput, setBudgetInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSaveBudget = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const value = budgetInput.trim() ? Number(budgetInput) : null
      if (budgetInput.trim() && (!Number.isFinite(value) || value! < 0)) {
        setError('请输入有效的预算数值')
        return
      }
      await setTokenBudget(value)
      setMessage('预算已更新')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Gauge size={18} className="text-neutral-500" />
        <h3 className="text-sm font-medium text-neutral-900">Token 用量</h3>
      </div>

      {loading && <p className="mt-4 text-sm text-neutral-400">加载中…</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {summary && budget && !loading && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: '本月消耗', value: summary.consumedThisMonth.toLocaleString() },
              { label: '累计消耗', value: summary.totalConsumed.toLocaleString() },
              { label: '调用次数', value: summary.totalCalls },
              {
                label: '预算状态',
                value: budget.status === 'exceeded' ? '已超限' : '正常',
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-neutral-50 px-3 py-3">
                <p className="text-lg font-semibold text-neutral-900">{value}</p>
                <p className="mt-1 text-xs text-neutral-500">{label}</p>
              </div>
            ))}
          </div>

          {budget.budgetLimit != null && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-neutral-500">
                <span>本月进度</span>
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
                个人月度预算（Token）
              </label>
              <input
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value.replace(/\D/g, ''))}
                placeholder="留空则使用系统默认"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {saving ? '保存中…' : '更新预算'}
            </button>
          </form>

          {message && <p className="text-sm text-green-700">{message}</p>}

          {details.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-neutral-500">最近调用</h4>
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
                    {new Date(item.createdAt).toLocaleString('zh-CN')}
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

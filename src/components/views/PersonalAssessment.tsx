import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { getAssessmentStats, type AssessmentPeriod } from '../../api/assessment'
import type { AssessmentStats } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { MAIN_CONTENT_X_CLASS, PANEL_HEADER_CLASS, PANEL_TITLE_CLASS } from '../layout/layoutConstants'

const PERIOD_OPTIONS: { value: AssessmentPeriod; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: '90d', label: '近 90 天' },
]

export function PersonalAssessment() {
  const { isAuthenticated } = useAuth()
  const [period, setPeriod] = useState<AssessmentPeriod>('all')
  const [stats, setStats] = useState<AssessmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setStats(null)
      setLoading(false)
      setError('')
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    getAssessmentStats(period)
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period, isAuthenticated])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={PANEL_HEADER_CLASS}>
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-neutral-500" />
          <h1 className={PANEL_TITLE_CLASS}>个人测评</h1>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}>
        {loading && <p className="text-sm text-neutral-400">加载中…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {stats && !loading && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    period === option.value
                      ? 'bg-neutral-900 text-white'
                      : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: '提交篇数', value: stats.summary.totalWritings },
                { label: '总字数', value: stats.summary.totalWords },
                { label: '平均 AI 分', value: stats.summary.averageScore || '—' },
                { label: '词库词条', value: stats.summary.vocabularyCount },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xl font-semibold text-neutral-900">{value}</p>
                  <p className="mt-1 text-xs text-neutral-500">{label}</p>
                </div>
              ))}
            </div>

            {stats.topicDistribution.length > 0 && (
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-sm font-medium text-neutral-900">题型分布</h2>
                <ul className="mt-4 space-y-2">
                  {stats.topicDistribution.map((item) => (
                    <li
                      key={item.type}
                      className="flex items-center justify-between text-sm text-neutral-700"
                    >
                      <span>{item.type || '未分类'}</span>
                      <span className="font-medium">{item.count} 篇</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {stats.scoreTrend.length > 0 && (
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-sm font-medium text-neutral-900">分数趋势（按月）</h2>
                <ul className="mt-4 space-y-2">
                  {stats.scoreTrend.map((item) => (
                    <li
                      key={item.date}
                      className="flex items-center justify-between text-sm text-neutral-700"
                    >
                      <span>{item.date}</span>
                      <span className="font-medium">{item.score} 分</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {Object.keys(stats.scoreDistribution).length > 0 && (
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-sm font-medium text-neutral-900">分数段分布</h2>
                <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {Object.entries(stats.scoreDistribution).map(([range, count]) => (
                    <li
                      key={range}
                      className="rounded-lg bg-neutral-50 px-3 py-2 text-center text-sm"
                    >
                      <p className="font-medium text-neutral-900">{count}</p>
                      <p className="text-xs text-neutral-500">{range}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

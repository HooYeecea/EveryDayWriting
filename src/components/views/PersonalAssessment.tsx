import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { getAssessmentStats, type AssessmentPeriod } from '../../api/assessment'
import type { AssessmentStats } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { useReportReady } from '../../hooks/useReportReady'
import { useT } from '../../i18n'
import type { MessageKey } from '../../i18n'
import { MAIN_CONTENT_X_CLASS, PANEL_HEADER_CLASS, PANEL_TITLE_CLASS } from '../layout/layoutConstants'

const PERIOD_OPTION_KEYS: { value: AssessmentPeriod; labelKey: MessageKey }[] = [
  { value: 'all', labelKey: 'assessment.period.all' },
  { value: '7d', labelKey: 'assessment.period.7d' },
  { value: '30d', labelKey: 'assessment.period.30d' },
  { value: '90d', labelKey: 'assessment.period.90d' },
]

export function PersonalAssessment({ onReady }: { onReady?: () => void } = {}) {
  const t = useT()
  const { isAuthenticated } = useAuth()
  const [period, setPeriod] = useState<AssessmentPeriod>('all')
  const [stats, setStats] = useState<AssessmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useReportReady(!loading, onReady)

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

  const statCards = stats
    ? [
        { labelKey: 'assessment.stat.writings' as const, value: stats.summary.totalWritings },
        { labelKey: 'assessment.stat.words' as const, value: stats.summary.totalWords },
        {
          labelKey: 'assessment.stat.avgScore' as const,
          value: stats.summary.averageScore || '—',
        },
        { labelKey: 'assessment.stat.vocabCount' as const, value: stats.summary.vocabularyCount },
      ]
    : []

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={PANEL_HEADER_CLASS}>
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-neutral-500" />
          <h1 className={PANEL_TITLE_CLASS}>{t('assessment.title')}</h1>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}>
        {loading && <p className="text-sm text-neutral-400">{t('common.loading')}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {stats && !loading && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTION_KEYS.map((option) => (
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
                  {t(option.labelKey)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statCards.map(({ labelKey, value }) => (
                <div
                  key={labelKey}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xl font-semibold text-neutral-900">{value}</p>
                  <p className="mt-1 text-xs text-neutral-500">{t(labelKey)}</p>
                </div>
              ))}
            </div>

            {stats.topicDistribution.length > 0 && (
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-sm font-medium text-neutral-900">
                  {t('assessment.chart.topicDistribution')}
                </h2>
                <ul className="mt-4 space-y-2">
                  {stats.topicDistribution.map((item) => (
                    <li
                      key={item.type}
                      className="flex items-center justify-between text-sm text-neutral-700"
                    >
                      <span>{item.type || t('assessment.chart.uncategorized')}</span>
                      <span className="font-medium">
                        {t('assessment.chart.worksUnit', { n: item.count })}
                      </span>
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
                <h2 className="text-sm font-medium text-neutral-900">
                  {t('assessment.chart.scoreDistribution')}
                </h2>
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

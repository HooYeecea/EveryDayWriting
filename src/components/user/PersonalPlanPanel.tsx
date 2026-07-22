import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Target, ArrowRight } from 'lucide-react'
import { getStudyPlan } from '../../api/proficiencyTest'
import { isApiError } from '../../api/request'
import { useT } from '../../i18n'
import type { StudyPlanResponse } from '../../types/proficiencyTest'

export function PersonalPlanPanel({ onReady }: { onReady?: () => void } = {}) {
  const t = useT()
  const [plan, setPlan] = useState<StudyPlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [missing, setMissing] = useState(false)
  const reportedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setMissing(false)
    void getStudyPlan()
      .then((data) => {
        if (!cancelled) setPlan(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (isApiError(err) && err.isNotFound) {
          setMissing(true)
          return
        }
        setError(err instanceof Error ? err.message : t('plan.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [t])

  useEffect(() => {
    if (loading || reportedRef.current) return
    reportedRef.current = true
    onReady?.()
  }, [loading, onReady])

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center gap-2 py-16 text-sm text-neutral-400">
        <Loader2 size={16} className="animate-spin" />
        {t('plan.loading')}
      </div>
    )
  }

  if (missing) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-neutral-500" />
          <h3 className="text-sm font-medium text-neutral-900">{t('plan.title')}</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">{t('plan.emptyHint')}</p>
        <Link
          to="/proficiency-test"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {t('plan.goTest')}
          <ArrowRight size={14} />
        </Link>
      </section>
    )
  }

  if (error || !plan) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-red-600">{error || t('plan.emptyData')}</p>
      </section>
    )
  }

  const phases = plan.plan?.phases ?? []
  const current = phases[plan.currentPhaseIndex] ?? phases[0]
  const phaseNumber = Math.min(plan.currentPhaseIndex + 1, Math.max(phases.length, 1))

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Target size={18} className="text-neutral-500" />
              <h3 className="text-sm font-medium text-neutral-900">{plan.title}</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              {t('plan.goalLevel')}{' '}
              <span className="font-medium text-neutral-800">{plan.goalLevel}</span>
              <span className="mx-1.5 text-neutral-300">·</span>
              {t('plan.totalDays', { n: plan.totalDays })}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] text-neutral-500">
            {t('plan.phaseBadge', { current: phaseNumber })}
            {phases.length > 0 ? t('plan.phaseBadgeTotal', { n: phases.length }) : ''}
          </span>
        </div>

        {current && (
          <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {t('plan.currentFocus')}
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900">
              {String(current.title ?? t('plan.phaseFallback'))}
            </p>
            {current.focus && (
              <p className="mt-1 text-sm text-neutral-600">{String(current.focus)}</p>
            )}
            {current.description && (
              <p className="mt-1 text-sm text-neutral-600">{String(current.description)}</p>
            )}
            {Array.isArray(current.tasks) && current.tasks.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
                {current.tasks.map((task) => (
                  <li key={String(task)}>· {String(task)}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {phases.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-medium text-neutral-900">{t('plan.phasesTitle')}</h3>
          <div className="mt-4 space-y-3">
            {phases.map((phase, index) => {
              const active = index === plan.currentPhaseIndex
              return (
                <div
                  key={`${phase.title ?? 'phase'}-${index}`}
                  className={`rounded-xl border px-4 py-3 ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-100 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${active ? 'text-white' : 'text-neutral-800'}`}>
                      {String(
                        phase.title ?? t('plan.phaseBadge', { current: index + 1 }),
                      )}
                    </p>
                    {phase.days != null && (
                      <span className={`text-xs ${active ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        {t('plan.daysShort', { n: phase.days })}
                      </span>
                    )}
                  </div>
                  {phase.focus && (
                    <p className={`mt-1 text-xs ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {String(phase.focus)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
        {t('plan.footerBefore')}
        <Link to="/proficiency-test" className="mx-1 font-medium text-neutral-800 underline underline-offset-2">
          {t('plan.footerLink')}
        </Link>
        {t('plan.footerAfter')}
      </section>
    </div>
  )
}

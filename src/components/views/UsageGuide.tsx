import { BookOpen, HelpCircle, MessageCircle, Mic, Target, Zap, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProficiencyGuideRedDot } from '../../hooks/useProficiencyGuideRedDot'
import { useReportReady } from '../../hooks/useReportReady'
import { useT } from '../../i18n'
import type { MessageKey } from '../../i18n'
import { MAIN_CONTENT_X_CLASS, PANEL_HEADER_CLASS, PANEL_TITLE_CLASS } from '../layout/layoutConstants'

const WHY_AI_FEATURES: { labelKey: MessageKey; descKey: MessageKey }[] = [
  { labelKey: 'guide.whyAi.feature1Label', descKey: 'guide.whyAi.feature1Desc' },
  { labelKey: 'guide.whyAi.feature2Label', descKey: 'guide.whyAi.feature2Desc' },
  { labelKey: 'guide.whyAi.feature3Label', descKey: 'guide.whyAi.feature3Desc' },
]

export function UsageGuide({ onReady }: { onReady?: () => void } = {}) {
  const { user, isAuthenticated } = useAuth()
  const onboarding = user?.proficiencyOnboarding
  const showGuideRedDot = useProficiencyGuideRedDot()
  const showTestEntry = isAuthenticated && showGuideRedDot
  const t = useT()

  useReportReady(true, onReady)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={PANEL_HEADER_CLASS}>
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-neutral-500" />
          <h1 className={PANEL_TITLE_CLASS}>{t('guide.title')}</h1>
          {showTestEntry && (
            <span className="h-2 w-2 rounded-full bg-red-500" aria-label={t('nav.proficiencyIncomplete')} />
          )}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}>
        <div className="mx-auto max-w-2xl space-y-6">
          {showTestEntry && (
            <section className="rounded-2xl border border-neutral-900 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="relative mt-0.5">
                    <Target size={18} className="text-neutral-700" />
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-neutral-900">{t('guide.proficiencyTitle')}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      {onboarding?.status === 'in_progress'
                        ? t('guide.proficiencyBodyInProgress')
                        : t('guide.proficiencyBodyNotStarted')}
                    </p>
                  </div>
                </div>
                <Link
                  to="/proficiency-test"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                >
                  {onboarding?.status === 'in_progress'
                    ? t('guide.proficiencyContinue')
                    : t('guide.proficiencyStart')}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </section>
          )}

          <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-5 sm:p-6">
            <p className="text-sm font-medium text-neutral-800">{t('guide.publicNotice')}</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{t('guide.publicNoticeBody')}</p>
          </div>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">{t('guide.apiToken.title')}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t('guide.apiToken.intro')}</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <h3 className="text-sm font-medium text-neutral-800">{t('guide.apiToken.step1Title')}</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{t('guide.apiToken.step1Body')}</p>
                <p className="mt-2 text-xs text-neutral-400">{t('guide.apiToken.step1Tip')}</p>
              </div>
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <h3 className="text-sm font-medium text-neutral-800">{t('guide.apiToken.step2Title')}</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{t('guide.apiToken.step2Body')}</p>
                <p className="mt-1 text-xs text-neutral-400">{t('guide.apiToken.step2Tip')}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">{t('guide.whyAi.title')}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t('guide.whyAi.p1')}</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{t('guide.whyAi.p2')}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {WHY_AI_FEATURES.map(({ labelKey, descKey }) => (
                <div
                  key={labelKey}
                  className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-center"
                >
                  <p className="text-xs font-medium text-neutral-800">{t(labelKey)}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">{t(descKey)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Mic size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">{t('guide.tools.title')}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t('guide.tools.intro')}</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-neutral-500" />
                  <h3 className="text-sm font-medium text-neutral-800">{t('guide.tools.chatgptTitle')}</h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{t('guide.tools.chatgptBody')}</p>
              </div>
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <div className="flex items-center gap-2">
                  <Mic size={16} className="text-neutral-500" />
                  <h3 className="text-sm font-medium text-neutral-800">{t('guide.tools.doubaoTitle')}</h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{t('guide.tools.doubaoBody')}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">{t('guide.vocabGoal.title')}</h2>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm leading-relaxed text-neutral-600">{t('guide.vocabGoal.p1')}</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{t('guide.vocabGoal.p2')}</p>
            </div>
            <p className="mt-4 text-center text-xs text-neutral-400">{t('guide.vocabGoal.footer')}</p>
          </section>

          <p className="pb-6 text-center text-xs text-neutral-300">{t('guide.footerBrand')}</p>
        </div>
      </div>
    </div>
  )
}

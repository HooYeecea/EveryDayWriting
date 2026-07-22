import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { getLatestAgreement } from '../../api/agreements'
import {
  getPrivacyPolicySections,
  PRIVACY_POLICY_UPDATED_AT,
} from '../../data/privacyPolicy'
import { useT } from '../../i18n'
import { APP_LOCALE_TO_BCP47 } from '../../types/preferences'
import { usePreferences } from '../../context/PreferencesContext'

interface PrivacyAgreementModalProps {
  open: boolean
  onClose: () => void
  onAgree: (agreementId?: string) => void
}

function formatAgreementDate(value: string | undefined, locale: string): string {
  if (!value) return PRIVACY_POLICY_UPDATED_AT
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return PRIVACY_POLICY_UPDATED_AT
  return date.toLocaleDateString(locale)
}

function renderAgreementContent(content: string) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (paragraphs.length <= 1) {
    return <p>{content.trim()}</p>
  }

  return paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
}

export function PrivacyAgreementModal({ open, onClose, onAgree }: PrivacyAgreementModalProps) {
  const t = useT()
  const { preferences } = usePreferences()
  const dateLocale = APP_LOCALE_TO_BCP47[preferences.locale]
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canAgree, setCanAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState(() => t('auth.privacy.title'))
  const [updatedAt, setUpdatedAt] = useState(PRIVACY_POLICY_UPDATED_AT)
  const [agreementId, setAgreementId] = useState<string | undefined>()
  const [sections, setSections] = useState(() => getPrivacyPolicySections(preferences.locale))

  useEffect(() => {
    if (!open) {
      setCanAgree(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')
    // 先展示当前语言的前端预设，后端有内容再覆盖
    setTitle(t('auth.privacy.title'))
    setUpdatedAt(PRIVACY_POLICY_UPDATED_AT)
    setSections(getPrivacyPolicySections(preferences.locale))
    setAgreementId(undefined)

    getLatestAgreement('PrivacyPolicy')
      .then((agreement) => {
        if (cancelled || !agreement) return

        setAgreementId(agreement.id)
        if (!agreement.content?.trim()) return

        setTitle(agreement.title?.trim() || t('auth.privacy.title'))
        setUpdatedAt(
          formatAgreementDate(agreement.effectiveAt || agreement.publishedAt, dateLocale),
        )
        setSections([
          {
            title: agreement.title?.trim() || t('auth.privacy.title'),
            content: agreement.content,
          },
        ])
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : t('auth.privacy.loadFailed'))
        setAgreementId(undefined)
        setTitle(t('auth.privacy.title'))
        setUpdatedAt(PRIVACY_POLICY_UPDATED_AT)
        setSections(getPrivacyPolicySections(preferences.locale))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, t, dateLocale, preferences.locale])

  useEffect(() => {
    if (!open) {
      setCanAgree(false)
      return
    }

    const el = scrollRef.current
    if (!el) return

    const checkScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 24
      setCanAgree(atBottom || el.scrollHeight <= el.clientHeight)
    }

    checkScroll()
    el.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [open, sections, loading])

  if (!open) return null

  const handleAgree = () => {
    onAgree(agreementId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            <p className="mt-0.5 text-xs text-neutral-400">
              {t('auth.privacy.updatedAt', { date: updatedAt })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label={t('auth.privacy.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
          {loading && <p className="text-sm text-neutral-400">{t('auth.privacy.loading')}</p>}
          {error && <p className="mb-4 text-sm text-amber-600">{error}</p>}
          <div className="space-y-5 text-sm leading-relaxed text-neutral-700">
            {sections.map((section) => (
              <section key={section.title}>
                {sections.length > 1 && (
                  <h3 className="mb-2 font-medium text-neutral-900">{section.title}</h3>
                )}
                {renderAgreementContent(section.content)}
              </section>
            ))}
          </div>
          {!canAgree && !loading && (
            <p className="mt-6 text-center text-xs text-neutral-400">{t('auth.privacy.scrollHint')}</p>
          )}
        </div>

        <div className="shrink-0 border-t border-neutral-200 px-6 py-4">
          <button
            type="button"
            onClick={handleAgree}
            disabled={!canAgree || loading}
            className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('auth.privacy.agree')}
          </button>
        </div>
      </div>
    </div>
  )
}

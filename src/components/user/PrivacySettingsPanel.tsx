import { useEffect, useRef, useState } from 'react'
import { Shield } from 'lucide-react'
import { getAgreementStatus } from '../../api/agreements'
import { deleteAiMemory } from '../../api/privacy'
import type { AgreementStatusItem } from '../../api/agreements'
import { useAppConfirm } from '../../context/AppConfirmContext'
import { useT } from '../../i18n'

export function PrivacySettingsPanel({ onReady }: { onReady?: () => void } = {}) {
  const t = useT()
  const { confirm } = useAppConfirm()
  const [agreements, setAgreements] = useState<AgreementStatusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const readyReportedRef = useRef(false)

  useEffect(() => {
    getAgreementStatus()
      .then(setAgreements)
      .catch((err) =>
        setError(err instanceof Error ? err.message : t('privacy.loadFailed')),
      )
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    if (loading || readyReportedRef.current) return
    readyReportedRef.current = true
    onReady?.()
  }, [loading, onReady])

  const handleClearAiMemory = async () => {
    const ok = await confirm({
      title: t('privacy.clearMemory.confirmTitle'),
      message: t('privacy.clearMemory.confirmMessage'),
      confirmLabel: t('privacy.clearMemory.confirmLabel'),
      variant: 'warning',
    })
    if (!ok) return

    setClearing(true)
    setError('')
    setMessage('')
    try {
      const result = await deleteAiMemory()
      setMessage(t('privacy.clearMemory.success', { n: result.deletedCount }))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('privacy.clearMemory.failed'))
    } finally {
      setClearing(false)
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-neutral-500" />
        <h3 className="text-sm font-medium text-neutral-900">{t('privacy.title')}</h3>
      </div>

      {loading && <p className="mt-4 text-sm text-neutral-400">{t('common.loading')}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-green-700">{message}</p>}

      {!loading && agreements.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-neutral-500">{t('privacy.agreements.title')}</h4>
          <ul className="mt-2 space-y-2">
            {agreements.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
              >
                <span className="text-neutral-700">
                  {item.title} v{item.version}
                </span>
                <span
                  className={`text-xs ${item.accepted ? 'text-green-700' : 'text-amber-600'}`}
                >
                  {item.accepted
                    ? t('privacy.agreements.accepted')
                    : t('privacy.agreements.pending')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
        <p className="text-sm text-neutral-700">{t('privacy.clearMemory.actionTitle')}</p>
        <p className="mt-1 text-xs text-neutral-500">{t('privacy.clearMemory.actionHint')}</p>
        <button
          type="button"
          onClick={() => void handleClearAiMemory()}
          disabled={clearing}
          className="mt-3 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {clearing ? t('privacy.clearMemory.clearing') : t('privacy.clearMemory.button')}
        </button>
      </div>
    </section>
  )
}

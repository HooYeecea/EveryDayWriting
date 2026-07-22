import { useState } from 'react'
import { useT } from '../../i18n'
import { PrivacyAgreementModal } from './PrivacyAgreementModal'

interface PrivacyAgreementFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  onAgreementIdChange?: (agreementId?: string) => void
  /** 未勾选时高亮提醒 */
  highlight?: boolean
}

export function PrivacyAgreementField({
  checked,
  onChange,
  onAgreementIdChange,
  highlight = false,
}: PrivacyAgreementFieldProps) {
  const t = useT()
  const [showModal, setShowModal] = useState(false)
  const showWarning = highlight && !checked

  const handleAgreeFromModal = (agreementId?: string) => {
    onChange(true)
    onAgreementIdChange?.(agreementId)
  }

  return (
    <>
      <div
        className={`rounded-lg border px-2.5 py-1.5 transition-colors duration-200 ${
          showWarning
            ? 'border-red-200 bg-red-50'
            : 'border-transparent bg-transparent'
        }`}
      >
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
          />
          <span className="text-xs leading-snug text-neutral-600 sm:text-sm">
            {t('auth.privacy.prefix')}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setShowModal(true)
              }}
              className="mx-0.5 font-medium text-neutral-900 underline-offset-2 hover:underline"
            >
              {t('auth.privacy.link')}
            </button>
          </span>
        </label>
        <p
          className={`mt-1 text-xs leading-snug text-red-600 ${
            showWarning ? 'visible' : 'invisible'
          }`}
          aria-hidden={!showWarning}
        >
          {t('auth.privacy.warn')}
        </p>
      </div>

      <PrivacyAgreementModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAgree={handleAgreeFromModal}
      />
    </>
  )
}

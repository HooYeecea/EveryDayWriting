import { useState } from 'react'
import { PrivacyAgreementModal } from './PrivacyAgreementModal'

interface PrivacyAgreementFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** 未勾选时高亮提醒 */
  highlight?: boolean
}

export function PrivacyAgreementField({
  checked,
  onChange,
  highlight = false,
}: PrivacyAgreementFieldProps) {
  const [showModal, setShowModal] = useState(false)
  const showWarning = highlight && !checked

  const handleAgreeFromModal = () => {
    onChange(true)
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
            我已阅读并同意
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setShowModal(true)
              }}
              className="mx-0.5 font-medium text-neutral-900 underline-offset-2 hover:underline"
            >
              《隐私协议》
            </button>
          </span>
        </label>
        <p
          className={`mt-1 text-xs leading-snug text-red-600 ${
            showWarning ? 'visible' : 'invisible'
          }`}
          aria-hidden={!showWarning}
        >
          请先阅读并同意《隐私协议》后再继续
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

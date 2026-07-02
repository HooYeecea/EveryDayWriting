import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { PRIVACY_POLICY_SECTIONS, PRIVACY_POLICY_UPDATED_AT } from '../../data/privacyPolicy'

interface PrivacyAgreementModalProps {
  open: boolean
  onClose: () => void
  onAgree: () => void
}

export function PrivacyAgreementModal({ open, onClose, onAgree }: PrivacyAgreementModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canAgree, setCanAgree] = useState(false)

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
  }, [open])

  if (!open) return null

  const handleAgree = () => {
    onAgree()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">隐私协议</h2>
            <p className="mt-0.5 text-xs text-neutral-400">更新日期：{PRIVACY_POLICY_UPDATED_AT}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5 text-sm leading-relaxed text-neutral-700">
            {PRIVACY_POLICY_SECTIONS.map((section) => (
              <section key={section.title}>
                <h3 className="mb-2 font-medium text-neutral-900">{section.title}</h3>
                <p>{section.content}</p>
              </section>
            ))}
          </div>
          {!canAgree && (
            <p className="mt-6 text-center text-xs text-neutral-400">
              请滑动阅读至底部
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-neutral-200 px-6 py-4">
          <button
            type="button"
            onClick={handleAgree}
            disabled={!canAgree}
            className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            我同意
          </button>
        </div>
      </div>
    </div>
  )
}

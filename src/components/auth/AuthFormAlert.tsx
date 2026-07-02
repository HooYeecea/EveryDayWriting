interface AuthFormAlertProps {
  message?: string
}

/** 固定高度的表单错误提示，避免出现时撑高布局导致抖动 */
export function AuthFormAlert({ message }: AuthFormAlertProps) {
  const visible = Boolean(message)

  return (
    <div
      className={`rounded-md px-2.5 py-1 text-xs leading-snug ${
        visible ? 'bg-red-50 text-red-600' : 'bg-transparent'
      }`}
      aria-live="polite"
    >
      <p className={visible ? 'visible' : 'invisible'}>{message || '\u00A0'}</p>
    </div>
  )
}

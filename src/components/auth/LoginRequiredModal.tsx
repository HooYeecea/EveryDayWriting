import { LogIn, UserPlus, X } from 'lucide-react'

interface LoginRequiredModalProps {
  open: boolean
  onClose: () => void
  onLogin: () => void
  onRegister: () => void
}

export function LoginRequiredModal({
  open,
  onClose,
  onLogin,
  onRegister,
}: LoginRequiredModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="animate-scale-in relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
          <LogIn size={22} className="text-neutral-500" />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-neutral-900">您还未登录</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          保存和提交写作需要先登录账号。您也可以稍后再登录，当前写作内容会保留在页面上。
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onLogin}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <LogIn size={16} />
            去登录
          </button>
          <button
            type="button"
            onClick={onRegister}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <UserPlus size={16} />
            去注册
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 text-sm text-neutral-400 hover:text-neutral-600"
          >
            暂不登录
          </button>
        </div>
      </div>
    </div>
  )
}

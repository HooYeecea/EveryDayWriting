/** 鉴权表单气泡提示（替代浏览器原生 required 气泡） */
export function AuthBubble({ message }: { message: string }) {
  if (!message) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-10 z-[200] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="animate-fade-in-up max-w-[min(100%,20rem)] rounded-full bg-neutral-900/95 px-4 py-2.5 text-center font-sans text-[13px] leading-snug tracking-wide text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        {message}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'

/** 输入框下方格式/辅助说明：轻量排版，避免塞进 placeholder 的旧式观感 */
export function AuthFieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 font-sans text-[11px] leading-relaxed tracking-[0.02em] text-neutral-400">
      {children}
    </p>
  )
}

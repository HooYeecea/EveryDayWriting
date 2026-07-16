import type { SVGProps } from 'react'

type EwLogoProps = SVGProps<SVGSVGElement> & {
  /** mark = 仅 EW 印记；full = 印记 + Everyday Writing */
  variant?: 'mark' | 'full'
}

/**
 * Everyday Writing 品牌标记：衬线 E 与写作竖线构成 EW，呼应编辑器与每日写作。
 */
export function EwLogo({ variant = 'mark', className = '', ...props }: EwLogoProps) {
  if (variant === 'full') {
    return (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <EwLogoMark className="h-8 w-8 shrink-0" {...props} />
        <span className="font-sans text-sm font-semibold tracking-tight text-neutral-900">
          Everyday Writing
        </span>
      </span>
    )
  }

  return <EwLogoMark className={className} {...props} />
}

function EwLogoMark({ className = '', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <rect width="40" height="40" rx="10" className="fill-neutral-900" />
      {/* E */}
      <path
        d="M11 12h12M11 20h9M11 28h12"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      {/* W 笔触 / 写作竖线 */}
      <path
        d="M26 11v14.5c0 1.2.7 2 2 2h1"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27.5 28.5l2.2 2.2" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

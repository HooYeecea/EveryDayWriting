import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type TooltipPlacement = 'top' | 'bottom'

interface HoverTooltipProps {
  content: ReactNode
  children: ReactElement
  /** 仅当文案被截断时才显示；默认始终可显示 */
  onlyWhenTruncated?: boolean
  placement?: TooltipPlacement
  delayMs?: number
  className?: string
}

interface TipCoords {
  top: number
  left: number
}

/**
 * 自定义悬浮提示，替代浏览器原生 title。
 * 自动避开视口边缘，避免贴边按钮提示被裁切。
 */
export function HoverTooltip({
  content,
  children,
  onlyWhenTruncated = false,
  placement = 'top',
  delayMs = 280,
  className = '',
}: HoverTooltipProps) {
  const tipId = useId()
  const wrapRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const showTimerRef = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<TipCoords | null>(null)

  const clearShowTimer = () => {
    if (showTimerRef.current != null) {
      window.clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
  }

  const isTruncated = () => {
    if (!onlyWhenTruncated) return true
    const root = wrapRef.current
    if (!root) return true
    const truncatedEl =
      root.querySelector('[data-truncate-check]') ?? root.querySelector('.truncate')
    if (!(truncatedEl instanceof HTMLElement)) return true
    return truncatedEl.scrollWidth > truncatedEl.clientWidth + 1
  }

  const updatePosition = () => {
    const el = wrapRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const tip = tipRef.current
    const tipWidth = tip?.offsetWidth || 180
    const tipHeight = tip?.offsetHeight || 36
    const gap = 8
    const margin = 8
    const vw = window.innerWidth
    const vh = window.innerHeight

    let place: TooltipPlacement = placement
    const needAbove = tipHeight + gap
    const needBelow = tipHeight + gap
    const spaceAbove = rect.top - margin
    const spaceBelow = vh - rect.bottom - margin

    if (place === 'top' && needAbove > spaceAbove && spaceBelow >= needBelow) {
      place = 'bottom'
    } else if (place === 'bottom' && needBelow > spaceBelow && spaceAbove >= needAbove) {
      place = 'top'
    }

    let top = place === 'bottom' ? rect.bottom + gap : rect.top - gap - tipHeight
    let left = rect.left + rect.width / 2 - tipWidth / 2

    left = Math.min(Math.max(margin, left), Math.max(margin, vw - tipWidth - margin))
    top = Math.min(Math.max(margin, top), Math.max(margin, vh - tipHeight - margin))

    setCoords({ top, left })
  }

  const show = () => {
    clearShowTimer()
    if (!content) return
    if (!isTruncated()) return
    showTimerRef.current = window.setTimeout(() => {
      setOpen(true)
    }, delayMs)
  }

  const hide = () => {
    clearShowTimer()
    setOpen(false)
    setCoords(null)
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    // 内容渲染后再量一次，修正长文案尺寸
    const raf = window.requestAnimationFrame(() => updatePosition())
    return () => window.cancelAnimationFrame(raf)
  }, [open, placement, content])

  useEffect(() => {
    if (!open) return
    const onReposition = () => updatePosition()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, placement])

  useEffect(() => () => clearShowTimer(), [])

  const style: CSSProperties | undefined = coords
    ? {
        top: coords.top,
        left: coords.left,
      }
    : { top: -9999, left: -9999, visibility: 'hidden' }

  return (
    <>
      <span
        ref={wrapRef}
        className={`inline-flex min-w-0 max-w-full ${className}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={open ? tipId : undefined}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <span
            ref={tipRef}
            id={tipId}
            role="tooltip"
            style={style}
            className="pointer-events-none fixed z-[70] max-w-[min(14rem,calc(100vw-1rem))] rounded-lg border border-neutral-200 bg-neutral-900 px-2.5 py-1.5 font-sans text-xs font-medium leading-snug text-white shadow-[0_8px_24px_rgb(0_0_0/0.18)]"
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  )
}

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
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
  /** 点击/点按也可开关（便于手机查看完整文案） */
  tapToToggle?: boolean
  placement?: TooltipPlacement
  delayMs?: number
  className?: string
  /** 提示气泡额外 class（如加宽） */
  tipClassName?: string
}

interface TipCoords {
  top: number
  left: number
}

/**
 * 自定义悬浮提示，替代浏览器原生 title。
 * 自动避开视口边缘；可选点击切换，便于长文案在手机上查看。
 */
export function HoverTooltip({
  content,
  children,
  onlyWhenTruncated = false,
  tapToToggle = false,
  placement = 'top',
  delayMs = 280,
  className = '',
  tipClassName = '',
}: HoverTooltipProps) {
  const tipId = useId()
  const wrapRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const showTimerRef = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<TipCoords | null>(null)
  const pinnedRef = useRef(false)

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
    if (pinnedRef.current) return
    clearShowTimer()
    setOpen(false)
    setCoords(null)
  }

  const togglePin = (event: ReactMouseEvent) => {
    if (!tapToToggle) return
    if (!isTruncated()) return
    // 避免触发子按钮的无关逻辑时，仅在点 wrapper 空白/文案区域使用
    event.preventDefault()
    event.stopPropagation()
    clearShowTimer()
    if (open && pinnedRef.current) {
      pinnedRef.current = false
      setOpen(false)
      setCoords(null)
      return
    }
    pinnedRef.current = true
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
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

  useEffect(() => {
    if (!open || !tapToToggle) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (wrapRef.current?.contains(target) || tipRef.current?.contains(target)) return
      pinnedRef.current = false
      setOpen(false)
      setCoords(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, tapToToggle])

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
        onClick={tapToToggle ? togglePin : undefined}
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
            className={`pointer-events-none fixed z-[70] max-w-[min(14rem,calc(100vw-1rem))] rounded-lg border border-neutral-200 bg-neutral-900 px-2.5 py-1.5 font-sans text-xs font-medium leading-snug text-white shadow-[0_8px_24px_rgb(0_0_0/0.18)] ${tipClassName}`}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  )
}

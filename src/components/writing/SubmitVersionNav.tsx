import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react'
import type { IterationSibling } from '../../types'

interface SubmitVersionNavProps {
  versions: IterationSibling[]
  currentId: string
  onChange: (id: string) => void
  children?: ReactNode
}

type SlideDirection = 'prev' | 'next'

const SWIPE_THRESHOLD = 56
const AXIS_LOCK = 10
const MAX_DRAG = 120

function slideEnterClass(direction: SlideDirection | null): string {
  if (direction === 'next') return 'version-page-enter-next'
  if (direction === 'prev') return 'version-page-enter-prev'
  return ''
}

function applyDragResistance(dx: number, canGoPrev: boolean, canGoNext: boolean): number {
  const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, dx))
  if (clamped > 0 && !canGoPrev) return clamped * 0.22
  if (clamped < 0 && !canGoNext) return clamped * 0.22
  return clamped
}

export function SubmitVersionNav({
  versions,
  currentId,
  onChange,
  children,
}: SubmitVersionNavProps) {
  const [slideDirection, setSlideDirection] = useState<SlideDirection | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const pointerIdRef = useRef<number | null>(null)
  const dragStartXRef = useRef(0)
  const dragStartYRef = useRef(0)
  const dragAxisRef = useRef<'x' | 'y' | null>(null)

  const hasMultipleVersions = versions.length > 1
  const currentIndex = versions.findIndex((item) => item.id === currentId)
  const safeIndex =
    currentIndex >= 0 ? currentIndex : Math.max(0, versions.length - 1)
  const current = versions[safeIndex]
  const canGoPrev = hasMultipleVersions && safeIndex > 0
  const canGoNext = hasMultipleVersions && safeIndex < versions.length - 1

  const navigateTo = useCallback(
    (targetId: string, direction?: SlideDirection) => {
      if (!hasMultipleVersions || targetId === currentId) return
      const targetIndex = versions.findIndex((item) => item.id === targetId)
      if (targetIndex < 0) return

      const resolvedDirection =
        direction ?? (targetIndex > safeIndex ? 'next' : 'prev')
      setSlideDirection(resolvedDirection)
      setDragOffset(0)
      setIsDragging(false)
      onChange(targetId)
    },
    [currentId, hasMultipleVersions, onChange, safeIndex, versions],
  )

  const goPrev = useCallback(() => {
    if (!canGoPrev) return
    const prevId = versions[safeIndex - 1]?.id
    if (prevId) navigateTo(prevId, 'prev')
  }, [canGoPrev, navigateTo, safeIndex, versions])

  const goNext = useCallback(() => {
    if (!canGoNext) return
    const nextId = versions[safeIndex + 1]?.id
    if (nextId) navigateTo(nextId, 'next')
  }, [canGoNext, navigateTo, safeIndex, versions])

  useEffect(() => {
    setDragOffset(0)
    setIsDragging(false)
    dragAxisRef.current = null
    pointerIdRef.current = null
  }, [currentId])

  const resetDrag = () => {
    pointerIdRef.current = null
    dragAxisRef.current = null
    setIsDragging(false)
    setDragOffset(0)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasMultipleVersions || event.button !== 0) return

    const target = event.target
    if (!(target instanceof Element)) return
    if (
      target.closest(
        'button, a, input, textarea, select, [role="dialog"], [data-vocab-dialog], [data-vocab-floating]',
      )
    ) {
      return
    }

    pointerIdRef.current = event.pointerId
    dragStartXRef.current = event.clientX
    dragStartYRef.current = event.clientY
    dragAxisRef.current = null
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasMultipleVersions || pointerIdRef.current !== event.pointerId) return

    const dx = event.clientX - dragStartXRef.current
    const dy = event.clientY - dragStartYRef.current

    if (!dragAxisRef.current) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return
      dragAxisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }

    if (dragAxisRef.current === 'y') return

    event.preventDefault()
    setDragOffset(applyDragResistance(dx, canGoPrev, canGoNext))
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasMultipleVersions || pointerIdRef.current !== event.pointerId) return

    const dx = event.clientX - dragStartXRef.current
    const wasHorizontal = dragAxisRef.current === 'x'

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (wasHorizontal && Math.abs(dx) >= SWIPE_THRESHOLD) {
      if (dx < 0 && canGoNext) {
        goNext()
        return
      }
      if (dx > 0 && canGoPrev) {
        goPrev()
        return
      }
    }

    resetDrag()
  }

  const handlePointerCancel = () => {
    resetDrag()
  }

  const handleSlideAnimationEnd = () => {
    setSlideDirection(null)
  }

  if (!hasMultipleVersions) {
    return children ? <>{children}</> : null
  }

  const dragRotation = dragOffset * 0.045
  const dragOpacity = isDragging
    ? Math.max(0.72, 1 - Math.abs(dragOffset) / (MAX_DRAG * 2.2))
    : 1

  const panelStyle =
    isDragging && dragOffset !== 0
      ? {
          transform: `translate3d(${dragOffset}px, 0, 0) rotateY(${dragRotation}deg)`,
          opacity: dragOpacity,
          transition: 'none' as const,
        }
      : undefined

  return (
    <div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="上一版"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-sm font-medium text-neutral-900">
            第 {current.iterationNumber} 版
            <span className="text-neutral-400"> / 共 {versions.length} 版</span>
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {safeIndex <= 0
              ? '左滑或点右侧查看下一版 →'
              : safeIndex >= versions.length - 1
                ? '← 右滑或点左侧查看上一版'
                : '左右滑动或点击圆点切换版本'}
          </p>
          <div className="mt-2 flex justify-center gap-1.5">
            {versions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`h-1.5 rounded-full transition-all ${
                  item.id === currentId
                    ? 'w-5 bg-neutral-900'
                    : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`第 ${item.iterationNumber} 版`}
                title={`v${item.iterationNumber}${item.aiScore != null ? ` · ${item.aiScore}分` : ''}`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="下一版"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        className="version-page-viewport mt-4"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          className={`version-page-panel ${slideEnterClass(slideDirection)}`}
          style={panelStyle}
          onAnimationEnd={handleSlideAnimationEnd}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

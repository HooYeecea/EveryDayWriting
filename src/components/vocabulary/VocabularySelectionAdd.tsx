import { BookPlus } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { normalizeSelectedWord } from '../../utils/normalizeSelectedWord'
import {
  VocabularyQuickAddDialog,
  type VocabularyQuickAddInitial,
} from './VocabularyQuickAddDialog'

interface VocabularySelectionAddProps {
  children: ReactNode
  className?: string
  hint?: string
}

interface SelectionSnapshot {
  word: string
  rect: DOMRect
  contextSentence?: string
  translation?: string
  type?: VocabularyQuickAddInitial['type']
}

interface FloatingUiState {
  x: number
  y: number
  snapshot: SelectionSnapshot
}

const FLOATING_WIDTH = 148
const FLOATING_HEIGHT = 40

function selectionWithinContainer(selection: Selection, container: HTMLElement): boolean {
  if (selection.rangeCount === 0 || selection.isCollapsed) return false
  const range = selection.getRangeAt(0)
  const node = range.commonAncestorContainer
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
  return Boolean(element && container.contains(element))
}

function extractContextSentence(selection: Selection): string | undefined {
  if (selection.rangeCount === 0) return undefined
  const range = selection.getRangeAt(0)
  const node = range.commonAncestorContainer
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
  const block = element?.closest('p, li, dd, h3, h4, h5, .notion-editor')
  const text = block?.textContent?.trim()
  if (!text) return undefined
  return text.length > 500 ? `${text.slice(0, 497)}…` : text
}

function extractVocabularyHint(
  selection: Selection,
): Pick<VocabularyQuickAddInitial, 'translation' | 'type'> {
  if (selection.rangeCount === 0) return {}
  const range = selection.getRangeAt(0)
  const node = range.commonAncestorContainer
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
  const suggestionItem = element?.closest('[data-vocab-hint]')
  if (!suggestionItem) return {}

  return {
    translation: suggestionItem.getAttribute('data-vocab-translation') ?? undefined,
    type: (suggestionItem.getAttribute('data-vocab-type') as VocabularyQuickAddInitial['type']) ?? undefined,
  }
}

function getSelectionAnchorRect(selection: Selection): DOMRect | null {
  if (selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  if (rect.width > 0 || rect.height > 0) return rect

  const rects = range.getClientRects()
  if (rects.length > 0) return rects[0]
  return null
}

function resolveFloatingPosition(
  anchor: DOMRect,
  fallback: { x: number; y: number },
): { x: number; y: number } {
  const margin = 8
  const gap = 6
  const width = FLOATING_WIDTH
  const height = FLOATING_HEIGHT

  if (anchor.width === 0 && anchor.height === 0) {
    return {
      x: Math.max(margin, Math.min(fallback.x, window.innerWidth - width - margin)),
      y: Math.max(margin, Math.min(fallback.y, window.innerHeight - height - margin)),
    }
  }

  let x = anchor.left + anchor.width / 2 - width / 2
  let y = anchor.bottom + gap

  if (y + height > window.innerHeight - margin) {
    y = anchor.top - height - gap
  }

  x = Math.max(margin, Math.min(x, window.innerWidth - width - margin))
  y = Math.max(margin, Math.min(y, window.innerHeight - height - margin))

  return { x, y }
}

function readSelectionSnapshot(container: HTMLElement): SelectionSnapshot | null {
  const selection = window.getSelection()
  if (!selection || !selectionWithinContainer(selection, container)) return null

  const word = normalizeSelectedWord(selection.toString())
  if (!word) return null

  const rect = getSelectionAnchorRect(selection)
  if (!rect) return null

  const hints = extractVocabularyHint(selection)
  return {
    word,
    rect,
    contextSentence: extractContextSentence(selection),
    translation: hints.translation,
    type: hints.type ?? 'NewWord',
  }
}

function snapshotToInitial(snapshot: SelectionSnapshot): VocabularyQuickAddInitial {
  return {
    word: snapshot.word,
    contextSentence: snapshot.contextSentence,
    translation: snapshot.translation,
    type: snapshot.type,
  }
}

export function VocabularySelectionAdd({
  children,
  className = '',
  hint = '选中英文单词或短语后，点击浮层按钮或右键加入个人词库',
}: VocabularySelectionAddProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const pendingSnapshotRef = useRef<SelectionSnapshot | null>(null)
  const suppressMouseUpRef = useRef(false)
  const [floating, setFloating] = useState<FloatingUiState | null>(null)
  const [dialogInitial, setDialogInitial] = useState<VocabularyQuickAddInitial | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const closeFloating = useCallback(() => {
    setFloating(null)
    pendingSnapshotRef.current = null
  }, [])

  const showFloating = useCallback(
    (snapshot: SelectionSnapshot, fallback: { x: number; y: number }) => {
      pendingSnapshotRef.current = snapshot
      const { x, y } = resolveFloatingPosition(snapshot.rect, fallback)
      setFloating({ x, y, snapshot })
    },
    [],
  )

  const openDialog = useCallback(
    (snapshot: SelectionSnapshot) => {
      closeFloating()
      setDialogInitial(snapshotToInitial(snapshot))
      setDialogOpen(true)
    },
    [closeFloating],
  )

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (floatingRef.current?.contains(target)) return
      closeFloating()
    }

    const handleScroll = () => closeFloating()

    const handleKeyUp = () => {
      const container = containerRef.current
      if (!container) return
      requestAnimationFrame(() => {
        const snapshot = readSelectionSnapshot(container)
        if (snapshot) {
          showFloating(snapshot, {
            x: snapshot.rect.left,
            y: snapshot.rect.bottom,
          })
        } else {
          closeFloating()
        }
      })
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [closeFloating, showFloating])

  const handleMouseUp = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || suppressMouseUpRef.current) {
      suppressMouseUpRef.current = false
      return
    }

    const container = containerRef.current
    if (!container) return

    requestAnimationFrame(() => {
      const snapshot = readSelectionSnapshot(container)
      if (!snapshot) {
        closeFloating()
        return
      }
      showFloating(snapshot, {
        x: snapshot.rect.left,
        y: snapshot.rect.bottom,
      })
    })
  }

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return

    const snapshot = readSelectionSnapshot(container)
    if (!snapshot) return

    event.preventDefault()
    suppressMouseUpRef.current = true
    showFloating(snapshot, { x: event.clientX, y: event.clientY })
  }

  const handleFloatingAction = () => {
    const snapshot = pendingSnapshotRef.current ?? floating?.snapshot
    if (!snapshot) return
    openDialog(snapshot)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setDialogInitial(null)
  }

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {children}
        {hint && <p className="mt-4 text-xs text-neutral-400">{hint}</p>}
      </div>

      {floating &&
        createPortal(
          <div
            ref={floatingRef}
            data-vocab-floating
            className="fixed z-[200] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
            style={{ left: floating.x, top: floating.y }}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                handleFloatingAction()
              }}
              className="flex h-10 w-[9.25rem] items-center gap-2 px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              <BookPlus size={15} className="shrink-0 text-neutral-500" />
              加入个人词库
            </button>
          </div>,
          document.body,
        )}

      <VocabularyQuickAddDialog
        open={dialogOpen}
        initial={dialogInitial}
        onClose={closeDialog}
      />
    </>
  )
}

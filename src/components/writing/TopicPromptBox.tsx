import { useEffect, useRef, useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { PANEL_SUBTITLE_CLASS, PANEL_TITLE_CLASS } from '../layout/layoutConstants'

interface TopicPromptBoxProps {
  prompt: string
  type: string
}

export function TopicPromptBox({ prompt, type }: TopicPromptBoxProps) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(false)
  }, [prompt])

  useEffect(() => {
    const el = textRef.current
    if (!el) return

    const checkOverflow = () => {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 1)
    }

    checkOverflow()
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)
    return () => observer.disconnect()
  }, [prompt])

  return (
    <>
      <div className="relative min-w-0 w-full flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 sm:px-4 sm:py-2.5">
        <p
          ref={textRef}
          className={`line-clamp-2 text-sm leading-snug text-neutral-800 sm:text-[15px] sm:leading-relaxed ${
            isOverflowing ? 'pr-6' : ''
          }`}
        >
          {prompt}
        </p>
        {isOverflowing && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="absolute bottom-1.5 right-1.5 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-200/80 hover:text-neutral-700"
            aria-label="查看完整题目"
            title="查看完整题目"
          >
            <Maximize2 size={14} />
          </button>
        )}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              aria-label="关闭"
            >
              <X size={18} />
            </button>

            <p className={PANEL_TITLE_CLASS}>题目</p>
            <p className={PANEL_SUBTITLE_CLASS}>{type}</p>
            <p className="mt-4 text-sm leading-relaxed text-neutral-800 sm:text-[15px]">
              {prompt}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

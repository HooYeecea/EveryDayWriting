import { useEffect, useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { useT } from '../../i18n'
import { PANEL_SUBTITLE_CLASS, PANEL_TITLE_CLASS } from '../layout/layoutConstants'

interface TopicPromptBoxProps {
  prompt: string
  type: string
  /** Fill parent height and scroll the prompt instead of clamping to 2 lines */
  fill?: boolean
}

export function TopicPromptBox({ prompt, type, fill = false }: TopicPromptBoxProps) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(false)
  }, [prompt])

  return (
    <>
      <div
        className={`relative min-w-0 w-full max-w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 sm:px-4 sm:py-2.5 ${
          fill ? 'flex h-full min-h-0 flex-col' : ''
        }`}
      >
        <p
          className={`break-words pr-9 text-sm leading-snug text-neutral-800 sm:pr-8 sm:text-[15px] sm:leading-relaxed ${
            fill
              ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain'
              : 'line-clamp-2'
          }`}
        >
          {prompt}
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute bottom-1 right-1 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-neutral-50/90 text-neutral-500 shadow-sm ring-1 ring-neutral-200/80 transition-colors hover:bg-neutral-200 hover:text-neutral-800 active:scale-95 sm:bottom-1.5 sm:right-1.5 sm:h-7 sm:w-7"
          aria-label={t('writing.topic.viewFull')}
          title={t('writing.topic.viewFull')}
        >
          <Maximize2 size={15} />
        </button>
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

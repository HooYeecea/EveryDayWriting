import { ChevronDown, ChevronUp } from 'lucide-react'

export interface TimeParts {
  hours: number
  minutes: number
  seconds: number
}

export const MAX_DURATION_SECONDS = 99 * 3600 + 59 * 60 + 59

export function timePartsToSeconds({ hours, minutes, seconds }: TimeParts): number {
  return hours * 3600 + minutes * 60 + seconds
}

export function secondsToTimeParts(totalSeconds: number): TimeParts {
  const safe = Math.max(0, Math.min(totalSeconds, MAX_DURATION_SECONDS))
  return {
    hours: Math.floor(safe / 3600),
    minutes: Math.floor((safe % 3600) / 60),
    seconds: safe % 60,
  }
}

export function clampTimeParts(parts: TimeParts): TimeParts {
  return secondsToTimeParts(timePartsToSeconds(parts))
}

interface DurationTimePickerProps {
  value: TimeParts
  disabled?: boolean
  onChange: (value: TimeParts) => void
}

type TimeField = keyof TimeParts

const FIELD_LIMITS: Record<TimeField, number> = {
  hours: 99,
  minutes: 59,
  seconds: 59,
}

const FIELD_LABELS: Record<TimeField, string> = {
  hours: '时',
  minutes: '分',
  seconds: '秒',
}

function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

export function DurationTimePicker({ value, disabled = false, onChange }: DurationTimePickerProps) {
  const updateField = (field: TimeField, next: number) => {
    onChange(clampTimeParts({ ...value, [field]: next }))
  }

  const stepField = (field: TimeField, delta: 1 | -1) => {
    const limit = FIELD_LIMITS[field]
    const current = value[field]
    const next = current + delta
    if (next < 0) {
      updateField(field, limit)
      return
    }
    if (next > limit) {
      updateField(field, 0)
      return
    }
    updateField(field, next)
  }

  const fields: TimeField[] = ['hours', 'minutes', 'seconds']

  return (
    <div className="mt-3">
      <p className="text-xs text-neutral-500">设置时长</p>
      <div className="mt-2 flex justify-center gap-3">
          {fields.map((field) => (
            <div key={field} className="flex flex-col items-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => stepField(field, 1)}
                className="rounded-md p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200/80 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`增加${FIELD_LABELS[field]}`}
              >
                <ChevronUp size={16} />
              </button>
              <div
                className="my-1 flex h-10 w-12 select-none items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-lg font-semibold text-neutral-800"
                onWheel={(e) => {
                  if (disabled) return
                  e.preventDefault()
                  stepField(field, e.deltaY < 0 ? 1 : -1)
                }}
              >
                {padTwo(value[field])}
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => stepField(field, -1)}
                className="rounded-md p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200/80 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`减少${FIELD_LABELS[field]}`}
              >
                <ChevronDown size={16} />
              </button>
              <span className="mt-1 text-[11px] text-neutral-400">{FIELD_LABELS[field]}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

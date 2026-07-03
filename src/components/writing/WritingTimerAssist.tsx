import { useEffect, useRef, useState } from 'react'
import { Bell, Timer } from 'lucide-react'
import { DurationTimePicker, timePartsToSeconds, type TimeParts } from './DurationTimePicker'

const DURATION_PRESETS = [15, 25, 30, 45] as const

type DurationKind = 'unlimited' | 'preset' | 'custom'
type TimerStatus = 'idle' | 'running' | 'finished'

const DEFAULT_CUSTOM_TIME: TimeParts = { hours: 0, minutes: 40, seconds: 0 }

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

interface WritingTimerAssistProps {
  onRunningChange?: (running: boolean, displaySeconds: number) => void
}

export function WritingTimerAssist({ onRunningChange }: WritingTimerAssistProps) {
  const [durationKind, setDurationKind] = useState<DurationKind>('unlimited')
  const [presetMinutes, setPresetMinutes] = useState<number>(25)
  const [customTime, setCustomTime] = useState<TimeParts>(DEFAULT_CUSTOM_TIME)
  const [useCountdown, setUseCountdown] = useState(true)
  const [alarmOnEnd, setAlarmOnEnd] = useState(true)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const alarmTriggeredRef = useRef(false)

  const customSeconds = timePartsToSeconds(customTime)
  const durationSeconds =
    durationKind === 'unlimited'
      ? null
      : durationKind === 'custom'
        ? customSeconds
        : presetMinutes * 60

  const isCountdownMode = useCountdown && durationSeconds !== null && durationSeconds > 0
  const settingsLocked = status === 'running'

  const displaySeconds =
    status === 'idle'
      ? isCountdownMode
        ? durationSeconds!
        : 0
      : isCountdownMode
        ? remainingSeconds
        : elapsedSeconds

  const statusHint = (() => {
    if (status === 'running') {
      return isCountdownMode ? '倒计时进行中' : '正计时进行中'
    }
    if (status === 'finished') {
      return '计时已结束'
    }
    if (durationSeconds === null) {
      return '不限时 · 正计时'
    }
    if (customSeconds === 0 && durationKind === 'custom') {
      return '请设置大于 0 的时长'
    }
    if (isCountdownMode) {
      return `倒计时 · ${alarmOnEnd ? '到点提醒已开' : '到点提醒已关'}`
    }
    return `正计时 · ${alarmOnEnd ? '到点提醒已开' : '到点提醒已关'}`
  })()

  const canStart =
    status !== 'running' &&
    (durationKind === 'unlimited' || !useCountdown
      ? durationKind !== 'custom' || customSeconds > 0
      : durationSeconds !== null && durationSeconds > 0)

  useEffect(() => {
    onRunningChange?.(status === 'running', displaySeconds)
  }, [status, displaySeconds, onRunningChange])

  useEffect(() => {
    if (status !== 'running') return

    const timerId = window.setInterval(() => {
      if (isCountdownMode && durationSeconds !== null) {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setStatus('finished')
            if (alarmOnEnd && !alarmTriggeredRef.current) {
              alarmTriggeredRef.current = true
              window.alert('写作时间到！')
            }
            return 0
          }
          return prev - 1
        })
        return
      }

      setElapsedSeconds((prev) => {
        const next = prev + 1
        if (
          durationSeconds !== null &&
          durationSeconds > 0 &&
          alarmOnEnd &&
          next >= durationSeconds &&
          !alarmTriggeredRef.current
        ) {
          alarmTriggeredRef.current = true
          setStatus('finished')
          window.alert('写作时间到！')
        }
        return next
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [status, isCountdownMode, durationSeconds, alarmOnEnd])

  const handleStart = () => {
    if (!canStart) return

    alarmTriggeredRef.current = false

    if (isCountdownMode && durationSeconds !== null) {
      setRemainingSeconds(durationSeconds)
      setElapsedSeconds(0)
    } else {
      setElapsedSeconds(0)
      setRemainingSeconds(0)
    }

    setStatus('running')
  }

  const handleStop = () => {
    setStatus('idle')
  }

  const handleReset = () => {
    alarmTriggeredRef.current = false
    setStatus('idle')
    setElapsedSeconds(0)
    setRemainingSeconds(0)
  }

  const selectPreset = (minutes: number) => {
    setDurationKind('preset')
    setPresetMinutes(minutes)
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2">
        <Timer size={18} className="text-neutral-500" strokeWidth={1.75} />
        <h4 className="text-sm font-medium text-neutral-900">写作计时</h4>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        自行设定时长（时/分/秒），按需开启倒计时与到点提醒。
      </p>

      <div className="mt-4">
        <p className="text-xs font-medium text-neutral-600">写作时长</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DURATION_PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              disabled={settingsLocked}
              onClick={() => selectPreset(minutes)}
              className={`rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                durationKind === 'preset' && presetMinutes === minutes
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {minutes} 分钟
            </button>
          ))}
          <button
            type="button"
            disabled={settingsLocked}
            onClick={() => setDurationKind('custom')}
            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              durationKind === 'custom'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
            }`}
          >
            自定义
          </button>
          <button
            type="button"
            disabled={settingsLocked}
            onClick={() => setDurationKind('unlimited')}
            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              durationKind === 'unlimited'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
            }`}
          >
            不限时
          </button>
        </div>

        {durationKind === 'custom' && (
          <DurationTimePicker
            value={customTime}
            disabled={settingsLocked}
            onChange={setCustomTime}
          />
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium text-neutral-600">计时方式</p>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
          <input
            type="checkbox"
            checked={useCountdown}
            disabled={settingsLocked || durationKind === 'unlimited'}
            onChange={(e) => setUseCountdown(e.target.checked)}
            className="rounded border-neutral-300"
          />
          <span className="text-xs text-neutral-700">倒计时显示</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
          <input
            type="checkbox"
            checked={alarmOnEnd}
            disabled={settingsLocked || durationKind === 'unlimited'}
            onChange={(e) => setAlarmOnEnd(e.target.checked)}
            className="rounded border-neutral-300"
          />
          <Bell size={14} className="text-neutral-400" />
          <span className="text-xs text-neutral-700">到点提醒</span>
        </label>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-6 text-center">
        <p
          className={`font-mono text-3xl font-semibold tracking-wider ${
            status === 'finished' ? 'text-amber-600' : 'text-neutral-800'
          }`}
        >
          {formatSeconds(displaySeconds)}
        </p>
        <p className="mt-2 text-xs text-neutral-400">{statusHint}</p>
      </div>

      <div className="mt-3 flex gap-2">
        {status === 'running' ? (
          <button
            type="button"
            onClick={handleStop}
            className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            停止计时
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className="flex-1 rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            开始计时
          </button>
        )}
        {(status === 'finished' || elapsedSeconds > 0 || remainingSeconds > 0) && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            重置
          </button>
        )}
      </div>
    </section>
  )
}

function formatSecondsForRail(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export { formatSecondsForRail }

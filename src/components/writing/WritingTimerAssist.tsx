import { useEffect, useRef, useState } from 'react'
import { Bell, Pause, Play, Timer } from 'lucide-react'
import { useAppAlert } from '../../context/AppAlertContext'
import { useWritingFocus } from '../../context/WritingFocusContext'
import { DurationTimePicker, timePartsToSeconds, type TimeParts } from './DurationTimePicker'

const DURATION_PRESETS = [15, 25, 30, 45] as const

type DurationKind = 'unlimited' | 'preset' | 'custom'
type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

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

function playAlarmBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    for (let i = 0; i < 3; i++) {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, now + i * 0.32)
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.32 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.32 + 0.22)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(now + i * 0.32)
      oscillator.stop(now + i * 0.32 + 0.24)
    }

    window.setTimeout(() => {
      void ctx.close()
    }, 1200)
  } catch {
    // 忽略无声环境 / 自动播放限制
  }
}

interface WritingTimerAssistProps {
  /** active：进行中或已暂停；paused：是否处于暂停 */
  onRunningChange?: (active: boolean, displaySeconds: number, paused: boolean) => void
  /** 从折叠条跳入时触发区块闪动，递增即可重复触发 */
  highlightNonce?: number
}

const SECTION_FLASH_DELAY_MS = 320

export function WritingTimerAssist({ onRunningChange, highlightNonce = 0 }: WritingTimerAssistProps) {
  const { setNavigationLocked } = useWritingFocus()
  const { alert } = useAppAlert()
  const alertRef = useRef(alert)
  alertRef.current = alert
  const [durationKind, setDurationKind] = useState<DurationKind>('unlimited')
  const [presetMinutes, setPresetMinutes] = useState<number>(25)
  const [customTime, setCustomTime] = useState<TimeParts>(DEFAULT_CUSTOM_TIME)
  const [useCountdown, setUseCountdown] = useState(true)
  const [alarmOnEnd, setAlarmOnEnd] = useState(true)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [flashing, setFlashing] = useState(false)
  const alarmTriggeredRef = useRef(false)
  const deadlineMsRef = useRef<number | null>(null)
  const runStartedAtRef = useRef<number | null>(null)
  const baseElapsedRef = useRef(0)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!highlightNonce) return

    const timer = window.setTimeout(() => {
      setFlashing(true)
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, SECTION_FLASH_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [highlightNonce])

  const customSeconds = timePartsToSeconds(customTime)
  const durationSeconds =
    durationKind === 'unlimited'
      ? null
      : durationKind === 'custom'
        ? customSeconds
        : presetMinutes * 60

  const isCountdownMode = useCountdown && durationSeconds !== null && durationSeconds > 0
  const sessionActive = status === 'running' || status === 'paused'
  const settingsLocked = sessionActive

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
      return isCountdownMode ? '倒计时进行中 · 导航已锁定' : '正计时进行中 · 导航已锁定'
    }
    if (status === 'paused') {
      return '已暂停 · 导航仍锁定，可继续或停止'
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
    !sessionActive &&
    (durationKind === 'unlimited' || !useCountdown
      ? durationKind !== 'custom' || customSeconds > 0
      : durationSeconds !== null && durationSeconds > 0)

  useEffect(() => {
    onRunningChange?.(sessionActive, displaySeconds, status === 'paused')
  }, [sessionActive, displaySeconds, status, onRunningChange])

  useEffect(() => {
    setNavigationLocked(sessionActive)
    return () => setNavigationLocked(false)
  }, [sessionActive, setNavigationLocked])

  const alarmOnEndRef = useRef(alarmOnEnd)
  alarmOnEndRef.current = alarmOnEnd
  const isCountdownModeRef = useRef(isCountdownMode)
  isCountdownModeRef.current = isCountdownMode
  const durationSecondsRef = useRef(durationSeconds)
  durationSecondsRef.current = durationSeconds

  useEffect(() => {
    if (status !== 'running') return

    const finishTimer = () => {
      deadlineMsRef.current = null
      runStartedAtRef.current = null
      setRemainingSeconds(0)
      setStatus('finished')
      if (alarmOnEndRef.current && !alarmTriggeredRef.current) {
        alarmTriggeredRef.current = true
        playAlarmBeep()
        void alertRef.current({
          title: '写作时间到',
          message: '请继续完成并提交，或重置计时。',
          variant: 'notice',
          confirmLabel: '知道了',
        })
      }
    }

    const syncFromTimestamps = () => {
      if (isCountdownModeRef.current && deadlineMsRef.current !== null) {
        const next = Math.max(0, Math.ceil((deadlineMsRef.current - Date.now()) / 1000))
        setRemainingSeconds(next)
        if (next <= 0) {
          finishTimer()
        }
        return
      }

      if (runStartedAtRef.current !== null) {
        const next =
          baseElapsedRef.current + Math.floor((Date.now() - runStartedAtRef.current) / 1000)
        setElapsedSeconds(next)
        const limit = durationSecondsRef.current
        if (limit !== null && limit > 0 && next >= limit && !alarmTriggeredRef.current) {
          finishTimer()
        }
      }
    }

    syncFromTimestamps()
    const timerId = window.setInterval(syncFromTimestamps, 250)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFromTimestamps()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(timerId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [status])

  const handleStart = () => {
    if (!canStart) return

    alarmTriggeredRef.current = false

    if (isCountdownMode && durationSeconds !== null) {
      setRemainingSeconds(durationSeconds)
      setElapsedSeconds(0)
      deadlineMsRef.current = Date.now() + durationSeconds * 1000
      runStartedAtRef.current = null
      baseElapsedRef.current = 0
    } else {
      setElapsedSeconds(0)
      setRemainingSeconds(0)
      deadlineMsRef.current = null
      baseElapsedRef.current = 0
      runStartedAtRef.current = Date.now()
    }

    setStatus('running')
  }

  const handlePause = () => {
    if (status !== 'running') return

    if (isCountdownMode && deadlineMsRef.current !== null) {
      const next = Math.max(0, Math.ceil((deadlineMsRef.current - Date.now()) / 1000))
      setRemainingSeconds(next)
      deadlineMsRef.current = null
    } else if (runStartedAtRef.current !== null) {
      const next =
        baseElapsedRef.current + Math.floor((Date.now() - runStartedAtRef.current) / 1000)
      setElapsedSeconds(next)
      baseElapsedRef.current = next
      runStartedAtRef.current = null
    }

    setStatus('paused')
  }

  const handleResume = () => {
    if (status !== 'paused') return
    if (isCountdownMode) {
      deadlineMsRef.current = Date.now() + Math.max(0, remainingSeconds) * 1000
      runStartedAtRef.current = null
    } else {
      runStartedAtRef.current = Date.now()
      deadlineMsRef.current = null
    }
    setStatus('running')
  }

  const handleStop = () => {
    deadlineMsRef.current = null
    runStartedAtRef.current = null
    setStatus('idle')
  }

  const handleReset = () => {
    alarmTriggeredRef.current = false
    deadlineMsRef.current = null
    runStartedAtRef.current = null
    baseElapsedRef.current = 0
    setStatus('idle')
    setElapsedSeconds(0)
    setRemainingSeconds(0)
  }

  const selectPreset = (minutes: number) => {
    setDurationKind('preset')
    setPresetMinutes(minutes)
  }

  return (
    <section
      ref={sectionRef}
      className={`rounded-xl border border-neutral-200 bg-neutral-50 p-4 ${
        flashing ? 'animate-assist-target-flash' : ''
      }`}
      onAnimationEnd={() => setFlashing(false)}
    >
      <div className="flex items-center gap-2">
        <Timer size={18} className="text-neutral-500" strokeWidth={1.75} />
        <h4 className="text-sm font-medium text-neutral-900">写作计时</h4>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        开始后进入专注模式：不可切换其它菜单，可暂停后继续；时长到点可提醒。
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
            status === 'finished'
              ? 'text-amber-600'
              : status === 'paused'
                ? 'text-neutral-500'
                : 'text-neutral-800'
          }`}
        >
          {formatSeconds(displaySeconds)}
        </p>
        <p className="mt-2 text-xs text-neutral-400">{statusHint}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {status === 'running' && (
          <>
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <Pause size={15} strokeWidth={2} />
              暂停
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              停止计时
            </button>
          </>
        )}
        {status === 'paused' && (
          <>
            <button
              type="button"
              onClick={handleResume}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Play size={15} strokeWidth={2} />
              继续
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              停止计时
            </button>
          </>
        )}
        {(status === 'idle' || status === 'finished') && (
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart && status !== 'finished'}
            className="flex-1 rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            开始计时
          </button>
        )}
        {(status === 'finished' ||
          status === 'paused' ||
          elapsedSeconds > 0 ||
          remainingSeconds > 0) &&
          status !== 'running' && (
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

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  PenLine,
  Sparkles,
  Target,
} from 'lucide-react'
import { callAiProxy } from '../../api/ai'
import { isApiError } from '../../api/request'
import * as proficiencyApi from '../../api/proficiencyTest'
import { useConfirmDialog } from '../common/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'
import { loadAiAssistSettings } from '../../storage/aiSettingsStorage'
import { parseAiProxyContent } from '../../storage/gradingPreviewStorage'
import { getToken } from '../../storage/tokenStorage'
import type {
  ObjectiveQuestion,
  ProficiencyEvaluationResult,
  ProficiencyStage,
  ProficiencyTestStatusResponse,
  SelfAssessmentQuestion,
  StartProficiencyTestResponse,
  WritingTask,
} from '../../types/proficiencyTest'
import { getDefaultHomePath } from '../../utils/roles'
import { loadUserPreferences } from '../../storage/preferencesStorage'

type ViewMode = 'loading' | 'welcome' | 'testing' | 'evaluating' | 'result' | 'error'

type TFn = ReturnType<typeof useT>

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function questionTypeLabel(type: string, t: TFn): string {
  switch (type) {
    case 'vocabulary':
      return t('proficiency.questionType.vocabulary')
    case 'grammar_judge':
      return t('proficiency.questionType.grammarJudge')
    case 'sentence_rewrite':
      return t('proficiency.questionType.sentenceRewrite')
    case 'error_correction':
      return t('proficiency.questionType.errorCorrection')
    default:
      return t('proficiency.questionType.default')
  }
}

function difficultyBandLabel(band: string | undefined, difficulty: number | undefined, t: TFn): string {
  if (band === 'easy' || difficulty === 1 || difficulty === 2) return t('proficiency.difficulty.easy')
  if (band === 'hard' || difficulty === 4 || difficulty === 5) return t('proficiency.difficulty.hard')
  return t('proficiency.difficulty.medium')
}

function writingSlotLabel(slot: string, t: TFn): string {
  return slot === 'hard' ? t('proficiency.writingSlot.hard') : t('proficiency.writingSlot.easy')
}

function normalizeContent(content: ObjectiveQuestion['content']) {
  if (!content) return {}
  if (typeof content === 'string') {
    try {
      return JSON.parse(content) as Record<string, unknown>
    } catch {
      return { sentence: content }
    }
  }
  return content as Record<string, unknown>
}

function sortWritingTasks(tasks: WritingTask[]): WritingTask[] {
  const order = { easy: 0, hard: 1 }
  return [...tasks].sort(
    (a, b) => (order[a.slot as keyof typeof order] ?? 9) - (order[b.slot as keyof typeof order] ?? 9),
  )
}

export function ProficiencyTestPage() {
  const navigate = useNavigate()
  const t = useT()
  const { isAuthenticated, isLoading: authLoading, refreshProfile, roles, permissions } =
    useAuth()
  const { confirm, dialog: confirmDialog } = useConfirmDialog()
  const homePath = getDefaultHomePath(
    roles,
    permissions,
    loadUserPreferences().ui.defaultHomePath,
  )

  const [view, setView] = useState<ViewMode>('loading')
  const [status, setStatus] = useState<ProficiencyTestStatusResponse | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [testId, setTestId] = useState<string | null>(null)
  const [stage, setStage] = useState<ProficiencyStage>('A')
  const [selfQuestions, setSelfQuestions] = useState<SelfAssessmentQuestion[]>([])
  const [selfAnswers, setSelfAnswers] = useState<Record<string, string>>({})
  const [objectiveQuestions, setObjectiveQuestions] = useState<ObjectiveQuestion[]>([])
  const [objectiveAnswers, setObjectiveAnswers] = useState<Record<string, string>>({})
  const [objectiveIndex, setObjectiveIndex] = useState(0)
  const [writingTasks, setWritingTasks] = useState<WritingTask[]>([])
  const [writingTexts, setWritingTexts] = useState<Record<string, string>>({})
  const [writingIndex, setWritingIndex] = useState(0)
  const [result, setResult] = useState<ProficiencyEvaluationResult | null>(null)
  const [overallLevel, setOverallLevel] = useState<string | null>(null)
  const [overallScore, setOverallScore] = useState<number | null>(null)

  const currentWriting = writingTasks[writingIndex]
  const currentWritingText = currentWriting ? writingTexts[currentWriting.slot] ?? '' : ''
  const currentWordCount = useMemo(
    () => countWords(currentWritingText),
    [currentWritingText],
  )

  const loadWritingTasks = useCallback(async (id: string) => {
    const data = await proficiencyApi.getWritingPrompts(id)
    const tasks = sortWritingTasks(data.tasks ?? [])
    setWritingTasks(tasks)
    setWritingTexts((prev) => {
      const next = { ...prev }
      for (const task of tasks) {
        if (task.text) next[task.slot] = task.text
        else if (next[task.slot] == null) next[task.slot] = ''
      }
      return next
    })
    setWritingIndex(0)
  }, [])

  const restoreFromStage = useCallback(
    async (id: string, current: ProficiencyStage) => {
      if (current === 'B' || current === 'C') {
        const qs = await proficiencyApi.getObjectiveQuestions(id)
        setObjectiveQuestions(qs.questions)
      }
      if (current === 'C') {
        await loadWritingTasks(id)
      }
    },
    [loadWritingTasks],
  )

  const runEvaluation = useCallback(
    async (id: string) => {
      setView('evaluating')
      setError('')
      try {
        const payload = await proficiencyApi.getEvaluationPayload(id)
        const settings = loadAiAssistSettings()
        const hasOwnKey = Boolean(settings.encryptedKey)
        const providerId = hasOwnKey ? settings.providerId || 'free' : 'free'
        const modelId = hasOwnKey ? settings.modelId || 'free' : 'free'

        const aiResult = await callAiProxy(
          payload.purpose || 'proficiency_test',
          {
            providerId,
            modelId,
            userContent: payload.userContent,
          },
          hasOwnKey ? settings.encryptedKey : undefined,
        )

        const parsed = parseAiProxyContent<ProficiencyEvaluationResult>(aiResult.content || '')
        if (typeof parsed === 'string') {
          throw new Error(t('proficiency.error.evalFormat'))
        }

        const completed = await proficiencyApi.completeProficiencyTest(id, parsed)
        setResult((completed.result as ProficiencyEvaluationResult) ?? parsed)
        setOverallLevel(completed.overallLevel)
        setOverallScore(completed.overallScore)
        await refreshProfile()
        setView('result')
      } catch (err) {
        setError(err instanceof Error ? err.message : t('proficiency.error.evalFailed'))
        setView('error')
      }
    },
    [refreshProfile, t],
  )

  const loadStatus = useCallback(async () => {
    setError('')
    setView('loading')
    try {
      const data = await proficiencyApi.getProficiencyStatus()
      setStatus(data)

      if (data.status === 'completed') {
        setOverallLevel(data.overallLevel)
        setOverallScore(data.overallScore)
        setView('result')
        return
      }

      if (data.status === 'in_progress' && data.activeTestId) {
        // 评估中（写作已交）：自动继续评估；其余未完成进度先回到欢迎页，可续测或整份重开
        if (data.activeStage === 'done') {
          const start = await proficiencyApi.startProficiencyTest()
          setTestId(start.testId)
          setSelfQuestions(start.selfAssessmentQuestions)
          void runEvaluation(start.testId)
          return
        }
        setView('welcome')
        return
      }

      setView('welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('proficiency.error.loadStatusFailed'))
      setView('error')
    }
  }, [runEvaluation, t])

  useEffect(() => {
    if (authLoading) return
    if (!getToken() || !isAuthenticated) return
    void loadStatus()
  }, [authLoading, isAuthenticated, loadStatus])

  const beginFreshSession = useCallback(
    async (start: StartProficiencyTestResponse) => {
      setTestId(start.testId)
      setSelfQuestions(start.selfAssessmentQuestions)
      setStage(start.currentStage === 'done' ? 'done' : start.currentStage)
      setSelfAnswers({})
      setObjectiveAnswers({})
      setObjectiveIndex(0)
      setObjectiveQuestions([])
      setWritingTexts({})
      setWritingTasks([])
      setWritingIndex(0)
      setResult(null)
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              status: 'in_progress',
              activeTestId: start.testId,
              activeStage: start.currentStage === 'done' ? 'done' : start.currentStage,
              hasActivePlan: false,
              showGuideRedDot: true,
            }
          : prev,
      )
      if (start.currentStage === 'done') {
        await refreshProfile()
        void runEvaluation(start.testId)
        return
      }
      setView('testing')
      await refreshProfile()
    },
    [refreshProfile, runEvaluation],
  )

  const handleStart = async () => {
    setBusy(true)
    setError('')
    try {
      const start = await proficiencyApi.startProficiencyTest()
      setTestId(start.testId)
      setSelfQuestions(start.selfAssessmentQuestions)
      setStage(start.currentStage === 'done' ? 'done' : start.currentStage)
      setSelfAnswers({})
      setObjectiveAnswers({})
      setObjectiveIndex(0)
      setWritingTexts({})
      setWritingTasks([])
      setWritingIndex(0)
      if (start.currentStage === 'B' || start.currentStage === 'C') {
        await restoreFromStage(start.testId, start.currentStage)
      }
      if (start.currentStage === 'done') {
        await refreshProfile()
        void runEvaluation(start.testId)
      } else {
        setView('testing')
        await refreshProfile()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('proficiency.error.startFailed'))
    } finally {
      setBusy(false)
    }
  }

  const handleRestart = async (mode: 'abandon' | 'retake') => {
    const ok = await confirm({
      title: t('proficiency.restart.confirmTitle'),
      message:
        mode === 'abandon'
          ? t('proficiency.restart.confirmAbandon')
          : t('proficiency.restart.confirmRetake'),
      confirmLabel: t('proficiency.restart.confirmAction'),
      variant: 'warning',
    })
    if (!ok) return

    setBusy(true)
    setError('')
    try {
      const start = await proficiencyApi.restartProficiencyTest()
      await beginFreshSession(start)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('proficiency.error.restartFailed'))
      if (view !== 'testing' && view !== 'welcome' && view !== 'result') {
        setView('error')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleSkip = async () => {
    setBusy(true)
    setError('')
    try {
      await proficiencyApi.skipProficiencyTest()
      await refreshProfile()
      navigate(homePath, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('proficiency.error.skipFailed'))
    } finally {
      setBusy(false)
    }
  }

  const handleSubmitSelf = async () => {
    if (!testId) return
    for (const q of selfQuestions) {
      if (q.required === false) continue
      if (!selfAnswers[q.id]) {
        setError(t('proficiency.error.selfRequired', { question: q.question }))
        return
      }
    }
    setBusy(true)
    setError('')
    try {
      await proficiencyApi.submitSelfAssessment(testId, selfAnswers)
      const qs = await proficiencyApi.getObjectiveQuestions(testId)
      setObjectiveQuestions(qs.questions)
      setObjectiveIndex(0)
      setStage('B')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('proficiency.error.selfSubmitFailed'))
    } finally {
      setBusy(false)
    }
  }

  const handleSubmitObjective = async () => {
    if (!testId) return
    const missing = objectiveQuestions.find((q) => !objectiveAnswers[q.id]?.trim())
    if (missing) {
      setError(t('proficiency.error.objectiveIncomplete'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await proficiencyApi.submitObjectiveAnswers(
        testId,
        objectiveQuestions.map((q) => ({
          questionId: q.id,
          answer: objectiveAnswers[q.id].trim(),
        })),
      )
      await loadWritingTasks(testId)
      setStage('C')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('proficiency.error.objectiveSubmitFailed'))
    } finally {
      setBusy(false)
    }
  }

  const handleSubmitWriting = async () => {
    if (!testId || writingTasks.length === 0) return

    for (const task of writingTasks) {
      const text = (writingTexts[task.slot] ?? '').trim()
      const words = countWords(text)
      if (!text) {
        setError(t('proficiency.error.writingIncomplete', { type: writingSlotLabel(task.slot, t) }))
        setWritingIndex(writingTasks.findIndex((item) => item.slot === task.slot))
        return
      }
      if (words < task.minWords) {
        setError(
          t('proficiency.error.writingMinWords', {
            type: writingSlotLabel(task.slot, t),
            min: task.minWords,
            current: words,
          }),
        )
        setWritingIndex(writingTasks.findIndex((item) => item.slot === task.slot))
        return
      }
      if (words > task.maxWords + 40) {
        setError(
          t('proficiency.error.writingMaxWords', {
            type: writingSlotLabel(task.slot, t),
            max: task.maxWords,
            current: words,
          }),
        )
        setWritingIndex(writingTasks.findIndex((item) => item.slot === task.slot))
        return
      }
    }

    setBusy(true)
    setError('')
    try {
      await proficiencyApi.submitWritingAnswers(
        testId,
        writingTasks.map((task) => ({
          slot: task.slot,
          text: (writingTexts[task.slot] ?? '').trim(),
        })),
      )
      setBusy(false)
      await runEvaluation(testId)
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : t('proficiency.error.writingSubmitFailed'),
      )
      setBusy(false)
    }
  }

  if (authLoading) {
    return (
      <Shell>
        <p className="text-sm text-neutral-400">{t('proficiency.loading')}</p>
      </Shell>
    )
  }

  if (!getToken() || !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/proficiency-test' }} />
  }

  const currentObjective = objectiveQuestions[objectiveIndex]

  return (
    <Shell>
      {view === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-400">
          <Loader2 size={16} className="animate-spin" />
          {t('proficiency.preparing')}
        </div>
      )}

      {view === 'welcome' && (
        <WelcomePanel
          status={status}
          busy={busy}
          error={error}
          onStart={() => void handleStart()}
          onRestart={() => void handleRestart('abandon')}
          onSkip={() => void handleSkip()}
          onHome={() => navigate(homePath, { replace: true })}
        />
      )}

      {view === 'testing' && stage === 'A' && (
        <StageCard
          step={t('proficiency.stageA.step')}
          title={t('proficiency.stageA.title')}
          subtitle={t('proficiency.stageA.subtitle')}
        >
          <div className="space-y-5">
            {selfQuestions.map((q) => (
              <div key={q.id}>
                <p className="font-sans text-xs font-medium uppercase tracking-wider text-neutral-500">
                  {q.question}
                  {q.required === false ? t('proficiency.stageA.optional') : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = selfAnswers[q.id] === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setSelfAnswers((prev) => ({ ...prev, [q.id]: opt.key }))
                        }
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          selected
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSubmitSelf()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium uppercase tracking-wide text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {t('proficiency.stageA.next')}
              <ArrowRight size={16} />
            </button>
            <RestartDuringTestLink
              busy={busy}
              onRestart={() => void handleRestart('abandon')}
            />
          </div>
        </StageCard>
      )}

      {view === 'testing' && stage === 'B' && currentObjective && (
        <StageCard
          step={t('proficiency.stageB.step', {
            current: objectiveIndex + 1,
            total: objectiveQuestions.length,
          })}
          title={t('proficiency.stageB.title')}
          subtitle={t('proficiency.stageB.subtitle', {
            type: questionTypeLabel(currentObjective.questionType, t),
            difficulty: difficultyBandLabel(
              currentObjective.difficultyBand,
              currentObjective.difficulty,
              t,
            ),
            total: objectiveQuestions.length || 10,
          })}
        >
          <div className="mb-3 flex items-center gap-2 text-xs text-neutral-400">
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
              {difficultyBandLabel(
                currentObjective.difficultyBand,
                currentObjective.difficulty,
                t,
              )}
            </span>
            <span>
              {t('proficiency.stageB.difficulty', { n: currentObjective.difficulty })}
            </span>
          </div>
          <ObjectiveQuestionView
            question={currentObjective}
            answer={objectiveAnswers[currentObjective.id] ?? ''}
            onChange={(value) =>
              setObjectiveAnswers((prev) => ({
                ...prev,
                [currentObjective.id]: value,
              }))
            }
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={objectiveIndex === 0 || busy}
              onClick={() => setObjectiveIndex((i) => Math.max(0, i - 1))}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
            >
              {t('proficiency.stageB.prev')}
            </button>
            {objectiveIndex < objectiveQuestions.length - 1 ? (
              <button
                type="button"
                disabled={!objectiveAnswers[currentObjective.id]?.trim() || busy}
                onClick={() => setObjectiveIndex((i) => i + 1)}
                className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {t('proficiency.stageB.next')}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSubmitObjective()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                {t('proficiency.stageB.submit')}
              </button>
            )}
          </div>
          <RestartDuringTestLink
            busy={busy}
            onRestart={() => void handleRestart('abandon')}
          />
        </StageCard>
      )}

      {view === 'testing' && stage === 'C' && currentWriting && (
        <StageCard
          step={t('proficiency.stageC.step', {
            current: writingIndex + 1,
            total: writingTasks.length,
          })}
          title={t('proficiency.stageC.title')}
          subtitle={t('proficiency.stageC.subtitle')}
        >
          <div className="mb-4 flex gap-2">
            {writingTasks.map((task, index) => {
              const done = countWords(writingTexts[task.slot] ?? '') >= task.minWords
              const active = index === writingIndex
              return (
                <button
                  key={task.slot}
                  type="button"
                  onClick={() => setWritingIndex(index)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : done
                        ? 'border-neutral-300 bg-neutral-50 text-neutral-700'
                        : 'border-neutral-200 bg-white text-neutral-500'
                  }`}
                >
                  {writingSlotLabel(task.slot, t)}
                  {done ? t('proficiency.stageC.written') : ''}
                </button>
              )
            })}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-neutral-400">
              <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5">
                {writingSlotLabel(currentWriting.slot, t)}
              </span>
              <span>
                {t('proficiency.stageC.difficulty', { n: currentWriting.difficulty })}
              </span>
            </div>
            <p className="font-serif text-base leading-relaxed text-neutral-800">
              {currentWriting.prompt}
            </p>
            {currentWriting.instruction && (
              <p className="mt-2 text-xs text-neutral-500">{currentWriting.instruction}</p>
            )}
          </div>
          <textarea
            value={currentWritingText}
            onChange={(e) =>
              setWritingTexts((prev) => ({
                ...prev,
                [currentWriting.slot]: e.target.value,
              }))
            }
            rows={9}
            placeholder={t('proficiency.stageC.placeholder')}
            className="mt-4 w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 font-serif text-sm leading-relaxed text-neutral-800 outline-none focus:border-neutral-400 focus:bg-white"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
            <span>
              {t('proficiency.stageC.wordHint', {
                min: currentWriting.minWords,
                max: currentWriting.maxWords,
              })}
            </span>
            <span
              className={
                currentWordCount < currentWriting.minWords ? 'text-amber-600' : ''
              }
            >
              {t('proficiency.stageC.wordCount', { n: currentWordCount })}
            </span>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={writingIndex === 0 || busy}
              onClick={() => setWritingIndex((i) => Math.max(0, i - 1))}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
            >
              {t('proficiency.stageC.prev')}
            </button>
            {writingIndex < writingTasks.length - 1 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setWritingIndex((i) => i + 1)}
                className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {t('proficiency.stageC.next')}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSubmitWriting()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium uppercase tracking-wide text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {t('proficiency.stageC.submit')}
              </button>
            )}
          </div>
          <RestartDuringTestLink
            busy={busy}
            onRestart={() => void handleRestart('abandon')}
          />
        </StageCard>
      )}

      {view === 'evaluating' && (
        <div className="py-16 text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-neutral-700" />
          <p className="mt-4 font-sans text-base font-medium text-neutral-900">
            {t('proficiency.evaluating.title')}
          </p>
          <p className="mt-2 text-sm text-neutral-500">{t('proficiency.evaluating.hint')}</p>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {view === 'result' && (
        <ResultPanel
          overallLevel={overallLevel}
          overallScore={overallScore}
          result={result}
          busy={busy}
          error={error}
          onPlan={() => navigate('/user-center', { replace: true, state: { tab: 'plan' } })}
          onRetake={() => void handleRestart('retake')}
          onHome={() => navigate(homePath, { replace: true })}
        />
      )}

      {view === 'error' && (
        <div className="py-10 text-center">
          <p className="text-sm text-red-600">{error || t('proficiency.error.generic')}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void loadStatus()}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
            >
              {t('proficiency.error.retry')}
            </button>
            <button
              type="button"
              onClick={() => navigate(homePath)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600"
            >
              {t('proficiency.error.backHome')}
            </button>
          </div>
        </div>
      )}
      {confirmDialog}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const t = useT()
  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6 text-center">
          <p className="font-sans text-xl font-bold tracking-tight text-neutral-900">
            Everyday Writing
          </p>
          <p className="mt-1 font-sans text-xs tracking-wide text-neutral-400">
            {t('proficiency.shellSubtitle')}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white px-5 py-7 shadow-sm sm:px-7">
          <div className="-mx-5 -mt-7 mb-7 border-t-4 border-neutral-900 sm:-mx-7" />
          {children}
        </div>
      </div>
    </div>
  )
}

function StageCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
        {step}
      </p>
      <h1 className="mt-2 font-sans text-2xl font-bold tracking-wide text-neutral-900">{title}</h1>
      <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

function WelcomePanel({
  status,
  busy,
  error,
  onStart,
  onRestart,
  onSkip,
  onHome,
}: {
  status: ProficiencyTestStatusResponse | null
  busy: boolean
  error: string
  onStart: () => void
  onRestart: () => void
  onSkip: () => void
  onHome: () => void
}) {
  const t = useT()
  const isInProgress = status?.status === 'in_progress'
  const isResume = isInProgress || status?.status === 'skipped'
  const features = [
    {
      icon: ClipboardList,
      title: t('proficiency.welcome.feature1Title'),
      desc: t('proficiency.welcome.feature1Desc'),
    },
    {
      icon: PenLine,
      title: t('proficiency.welcome.feature2Title'),
      desc: t('proficiency.welcome.feature2Desc'),
    },
    {
      icon: Sparkles,
      title: t('proficiency.welcome.feature3Title'),
      desc: t('proficiency.welcome.feature3Desc'),
    },
  ] as const

  return (
    <div>
      <div className="flex items-center gap-2 text-neutral-500">
        <Target size={18} />
        <p className="font-sans text-xs font-medium uppercase tracking-wider">
          {t('proficiency.welcome.badge')}
        </p>
      </div>
      <h1 className="mt-3 text-center font-sans text-2xl font-bold tracking-wide text-neutral-900">
        {isResume ? t('proficiency.welcome.titleResume') : t('proficiency.welcome.titleNew')}
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-neutral-500">
        {t('proficiency.welcome.desc')}
      </p>

      <div className="mt-6 space-y-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
          >
            <Icon size={18} className="mt-0.5 shrink-0 text-neutral-500" />
            <div>
              <p className="text-sm font-medium text-neutral-800">{title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={onStart}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium uppercase tracking-wide text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : null}
        {isInProgress ? t('proficiency.welcome.continue') : t('proficiency.welcome.start')}
      </button>
      {isInProgress && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={onRestart}
            className="mt-3 w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-60"
          >
            {t('proficiency.welcome.restart')}
          </button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-neutral-400">
            {t('proficiency.welcome.restartHint')}
          </p>
        </>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={onSkip}
        className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
      >
        {t('proficiency.welcome.skip')}
      </button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-neutral-400">
        {t('proficiency.welcome.skipHint')}
      </p>
      <button
        type="button"
        onClick={onHome}
        className="mt-2 w-full text-center text-xs text-neutral-400 hover:text-neutral-600"
      >
        {t('proficiency.welcome.enterSite')}
      </button>
    </div>
  )
}

function RestartDuringTestLink({
  busy,
  onRestart,
}: {
  busy: boolean
  onRestart: () => void
}) {
  const t = useT()
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onRestart}
      className="mt-4 w-full text-center text-xs text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline disabled:opacity-50"
    >
      {t('proficiency.restart.inTest')}
    </button>
  )
}

function ObjectiveQuestionView({
  question,
  answer,
  onChange,
}: {
  question: ObjectiveQuestion
  answer: string
  onChange: (value: string) => void
}) {
  const t = useT()
  const content = normalizeContent(question.content)
  const sentence = String(content.sentence ?? content.prompt ?? content.topic ?? '')
  const instruction = String(content.instruction ?? '')
  const options = Array.isArray(content.options)
    ? (content.options as Array<{ key?: string; text?: string }>)
    : []

  return (
    <div>
      <p className="font-serif text-base leading-relaxed text-neutral-800">{sentence}</p>
      {instruction && <p className="mt-2 text-xs text-neutral-500">{instruction}</p>}

      {options.length > 0 ? (
        <div className="mt-4 space-y-2">
          {options.map((opt, idx) => {
            const key = String(opt.key ?? String.fromCharCode(65 + idx))
            const selected = answer === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  selected
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                <span className="font-medium">{key}.</span>
                <span>{opt.text ?? key}</span>
              </button>
            )
          })}
        </div>
      ) : question.questionType === 'grammar_judge' ? (
        <div className="mt-4 flex gap-2">
          {[
            { key: 'hasError', label: t('proficiency.objective.hasError') },
            { key: 'correct', label: t('proficiency.objective.correct') },
          ].map((opt) => {
            const selected = answer === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onChange(opt.key)}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm ${
                  selected
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      ) : (
        <textarea
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={t('proficiency.objective.answerPlaceholder')}
          className="mt-4 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-serif text-sm leading-relaxed outline-none focus:border-neutral-400 focus:bg-white"
        />
      )}
    </div>
  )
}

function ResultPanel({
  overallLevel,
  overallScore,
  result,
  busy,
  error,
  onPlan,
  onRetake,
  onHome,
}: {
  overallLevel: string | null
  overallScore: number | null
  result: ProficiencyEvaluationResult | null
  busy: boolean
  error: string
  onPlan: () => void
  onRetake: () => void
  onHome: () => void
}) {
  const t = useT()
  const strengths = result?.strengths ?? []
  const weaknesses = result?.weaknesses ?? []
  const dimensions = result?.dimensions ?? {}

  return (
    <div>
      <div className="text-center">
        <CheckCircle2 size={28} className="mx-auto text-neutral-800" />
        <h1 className="mt-3 font-sans text-2xl font-bold tracking-wide text-neutral-900">
          {t('proficiency.result.title')}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {result?.summary || t('proficiency.result.fallbackSummary')}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400">
            {t('proficiency.result.estimatedLevel')}
          </p>
          <p className="mt-1 font-sans text-3xl font-bold text-neutral-900">
            {overallLevel || result?.overallLevel || '—'}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400">
            {t('proficiency.result.overallScore')}
          </p>
          <p className="mt-1 font-sans text-3xl font-bold text-neutral-900">
            {overallScore ?? result?.overallScore ?? '—'}
          </p>
        </div>
      </div>

      {Object.keys(dimensions).length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            {t('proficiency.result.dimensions')}
          </p>
          {Object.entries(dimensions).map(([key, dim]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm"
            >
              <span className="text-neutral-600">{key}</span>
              <span className="font-medium text-neutral-900">
                {dim?.score ?? '—'}
                {dim?.level ? ` · ${dim.level}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {strengths.length > 0 && (
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500">{t('proficiency.result.strengths')}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-neutral-700">
                {strengths.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500">{t('proficiency.result.weaknesses')}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-neutral-700">
                {weaknesses.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onPlan}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium uppercase tracking-wide text-white hover:bg-neutral-800"
      >
        {t('proficiency.result.viewPlan')}
        <ArrowRight size={16} />
      </button>
      <button
        type="button"
        onClick={onHome}
        className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm text-neutral-500 hover:bg-neutral-50"
      >
        {t('proficiency.result.startWriting')}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onRetake}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-60"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : null}
        {t('proficiency.result.retake')}
      </button>
      <p className="mt-2 text-center text-[11px] text-neutral-400">
        {t('proficiency.result.retakeHint')}
      </p>
      <p className="mt-3 text-center text-[11px] text-neutral-400">
        {t('proficiency.result.planHintBefore')}{' '}
        <Link to="/user-center" className="underline underline-offset-2">
          {t('proficiency.result.planLink')}
        </Link>{' '}
        {t('proficiency.result.planHintAfter')}
      </p>
    </div>
  )
}

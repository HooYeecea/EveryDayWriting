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
import { callAiProxy } from '../api/ai'
import { isApiError } from '../api/request'
import * as proficiencyApi from '../api/proficiencyTest'
import { useAuth } from '../context/AuthContext'
import { loadAiAssistSettings } from '../storage/aiSettingsStorage'
import { parseAiProxyContent } from '../storage/gradingPreviewStorage'
import { getToken } from '../storage/tokenStorage'
import type {
  ObjectiveQuestion,
  ProficiencyEvaluationResult,
  ProficiencyStage,
  ProficiencyTestStatusResponse,
  SelfAssessmentQuestion,
  WritingPromptResponse,
} from '../types/proficiencyTest'
import { getDefaultHomePath } from '../utils/roles'

type ViewMode = 'loading' | 'welcome' | 'testing' | 'evaluating' | 'result' | 'error'

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function questionTypeLabel(type: string): string {
  switch (type) {
    case 'vocabulary':
      return '词汇'
    case 'grammar_judge':
      return '语法判断'
    case 'sentence_rewrite':
      return '句子改写'
    case 'error_correction':
      return '改错'
    default:
      return '基础题'
  }
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

export function ProficiencyTestPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, refreshProfile, roles, permissions } =
    useAuth()
  const homePath = getDefaultHomePath(roles, permissions)

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
  const [writingPrompt, setWritingPrompt] = useState<WritingPromptResponse | null>(null)
  const [writingText, setWritingText] = useState('')
  const [result, setResult] = useState<ProficiencyEvaluationResult | null>(null)
  const [overallLevel, setOverallLevel] = useState<string | null>(null)
  const [overallScore, setOverallScore] = useState<number | null>(null)

  const wordCount = useMemo(() => countWords(writingText), [writingText])

  const restoreFromStage = useCallback(async (id: string, current: ProficiencyStage) => {
    if (current === 'B' || current === 'C') {
      const qs = await proficiencyApi.getObjectiveQuestions(id)
      setObjectiveQuestions(qs.questions)
    }
    if (current === 'C') {
      const prompt = await proficiencyApi.getWritingPrompt(id)
      setWritingPrompt(prompt)
    }
  }, [])

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
          throw new Error('AI 评估结果格式异常，请稍后重试')
        }

        const completed = await proficiencyApi.completeProficiencyTest(id, parsed)
        setResult((completed.result as ProficiencyEvaluationResult) ?? parsed)
        setOverallLevel(completed.overallLevel)
        setOverallScore(completed.overallScore)
        await refreshProfile()
        setView('result')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'AI 评估失败')
        setView('error')
      }
    },
    [refreshProfile],
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
        const start = await proficiencyApi.startProficiencyTest()
        setTestId(start.testId)
        setSelfQuestions(start.selfAssessmentQuestions)
        const current = (data.activeStage ?? start.currentStage) as ProficiencyStage
        setStage(current === 'done' ? 'done' : current)
        if (current === 'done' || start.currentStage === 'done') {
          void runEvaluation(start.testId)
          return
        }
        if (current === 'B' || current === 'C') {
          await restoreFromStage(start.testId, current)
        }
        setView('testing')
        return
      }

      setView('welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载测评状态失败')
      setView('error')
    }
  }, [restoreFromStage, runEvaluation])

  useEffect(() => {
    if (authLoading) return
    if (!getToken() || !isAuthenticated) return
    void loadStatus()
  }, [authLoading, isAuthenticated, loadStatus])

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
      setWritingText('')
      setWritingPrompt(null)
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
      setError(err instanceof Error ? err.message : '开始测评失败')
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
      setError(err instanceof Error ? err.message : '跳过失败')
    } finally {
      setBusy(false)
    }
  }

  const handleSubmitSelf = async () => {
    if (!testId) return
    for (const q of selfQuestions) {
      if (q.required === false) continue
      if (!selfAnswers[q.id]) {
        setError(`请完成：${q.question}`)
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
      setError(err instanceof Error ? err.message : '提交自评失败')
    } finally {
      setBusy(false)
    }
  }

  const handleSubmitObjective = async () => {
    if (!testId) return
    const missing = objectiveQuestions.find((q) => !objectiveAnswers[q.id]?.trim())
    if (missing) {
      setError('请完成全部客观题')
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
      const prompt = await proficiencyApi.getWritingPrompt(testId)
      setWritingPrompt(prompt)
      setStage('C')
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交客观题失败')
    } finally {
      setBusy(false)
    }
  }

  const handleSubmitWriting = async () => {
    if (!testId || !writingPrompt) return
    const min = writingPrompt.minWords ?? 80
    const max = (writingPrompt.maxWords ?? 150) + 50
    if (wordCount < min) {
      setError(`请至少写 ${min} 词（当前 ${wordCount}）`)
      return
    }
    if (wordCount > max) {
      setError(`请控制在约 ${writingPrompt.maxWords} 词以内（当前 ${wordCount}）`)
      return
    }
    setBusy(true)
    setError('')
    try {
      await proficiencyApi.submitWriting(testId, writingText)
      setBusy(false)
      await runEvaluation(testId)
    } catch (err) {
      setError(isApiError(err) ? err.message : err instanceof Error ? err.message : '提交写作失败')
      setBusy(false)
    }
  }

  if (authLoading) {
    return (
      <Shell>
        <p className="text-sm text-neutral-400">加载中…</p>
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
          正在准备测评…
        </div>
      )}

      {view === 'welcome' && (
        <WelcomePanel
          status={status}
          busy={busy}
          error={error}
          onStart={() => void handleStart()}
          onSkip={() => void handleSkip()}
          onHome={() => navigate(homePath, { replace: true })}
        />
      )}

      {view === 'testing' && stage === 'A' && (
        <StageCard
          step="1 / 3"
          title="快速自评"
          subtitle="约 30 秒，帮助我们了解你的练习背景"
        >
          <div className="space-y-5">
            {selfQuestions.map((q) => (
              <div key={q.id}>
                <p className="font-sans text-xs font-medium uppercase tracking-wider text-neutral-500">
                  {q.question}
                  {q.required === false ? '（可选）' : ''}
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
              下一步：基础题
              <ArrowRight size={16} />
            </button>
          </div>
        </StageCard>
      )}

      {view === 'testing' && stage === 'B' && currentObjective && (
        <StageCard
          step={`2 / 3 · ${objectiveIndex + 1}/${objectiveQuestions.length}`}
          title="基础能力题"
          subtitle={`${questionTypeLabel(currentObjective.questionType)} · 约 1–2 分钟`}
        >
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
              上一题
            </button>
            {objectiveIndex < objectiveQuestions.length - 1 ? (
              <button
                type="button"
                disabled={!objectiveAnswers[currentObjective.id]?.trim() || busy}
                onClick={() => setObjectiveIndex((i) => i + 1)}
                className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                下一题
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSubmitObjective()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                进入短写作
              </button>
            )}
          </div>
        </StageCard>
      )}

      {view === 'testing' && stage === 'C' && writingPrompt && (
        <StageCard
          step="3 / 3"
          title="短写作"
          subtitle={writingPrompt.instruction || '写 80–150 词，约 2–3 分钟'}
        >
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="font-serif text-base leading-relaxed text-neutral-800">
              {writingPrompt.prompt}
            </p>
          </div>
          <textarea
            value={writingText}
            onChange={(e) => setWritingText(e.target.value)}
            rows={10}
            placeholder="Write your response in English…"
            className="mt-4 w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 font-serif text-sm leading-relaxed text-neutral-800 outline-none focus:border-neutral-400 focus:bg-white"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
            <span>
              建议 {writingPrompt.minWords}–{writingPrompt.maxWords} 词
            </span>
            <span className={wordCount < (writingPrompt.minWords ?? 80) ? 'text-amber-600' : ''}>
              {wordCount} 词
            </span>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSubmitWriting()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium uppercase tracking-wide text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            提交并开始 AI 评估
          </button>
        </StageCard>
      )}

      {view === 'evaluating' && (
        <div className="py-16 text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-neutral-700" />
          <p className="mt-4 font-sans text-base font-medium text-neutral-900">AI 正在分析你的水平</p>
          <p className="mt-2 text-sm text-neutral-500">大约需要几秒钟，请稍候…</p>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {view === 'result' && (
        <ResultPanel
          overallLevel={overallLevel}
          overallScore={overallScore}
          result={result}
          onPlan={() => navigate('/user-center', { replace: true, state: { tab: 'plan' } })}
          onHome={() => navigate(homePath, { replace: true })}
        />
      )}

      {view === 'error' && (
        <div className="py-10 text-center">
          <p className="text-sm text-red-600">{error || '出错了'}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void loadStatus()}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
            >
              重试
            </button>
            <button
              type="button"
              onClick={() => navigate(homePath)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600"
            >
              返回首页
            </button>
          </div>
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6 text-center">
          <p className="font-sans text-xl font-bold tracking-tight text-neutral-900">
            Everyday Writing
          </p>
          <p className="mt-1 font-sans text-xs tracking-wide text-neutral-400">英语能力测评</p>
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
  onSkip,
  onHome,
}: {
  status: ProficiencyTestStatusResponse | null
  busy: boolean
  error: string
  onStart: () => void
  onSkip: () => void
  onHome: () => void
}) {
  const isResume = status?.status === 'in_progress' || status?.status === 'skipped'
  return (
    <div>
      <div className="flex items-center gap-2 text-neutral-500">
        <Target size={18} />
        <p className="font-sans text-xs font-medium uppercase tracking-wider">个性化起点</p>
      </div>
      <h1 className="mt-3 text-center font-sans text-2xl font-bold tracking-wide text-neutral-900">
        {isResume ? '继续英语能力测评' : '先了解你的英语写作水平'}
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-neutral-500">
        接下来有一段约 3–5 分钟的测评流程。完成后，AI
        会评估你的当前水平，并生成更适合你的写作提升计划。
      </p>

      <div className="mt-6 space-y-3">
        {[
          { icon: ClipboardList, title: '快速自评 + 基础题', desc: '了解背景并校准基础能力' },
          { icon: PenLine, title: '短写作样本', desc: '80–150 词，最能反映真实写作水平' },
          { icon: Sparkles, title: 'AI 分析与个人计划', desc: '给出等级诊断与后续练习规划' },
        ].map(({ icon: Icon, title, desc }) => (
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
        {status?.status === 'in_progress' ? '继续测评' : '开始测评'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onSkip}
        className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
      >
        稍后再做
      </button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-neutral-400">
        跳过后可在「使用指南」中随时继续。完成后可在用户中心查看个人计划。
      </p>
      <button
        type="button"
        onClick={onHome}
        className="mt-2 w-full text-center text-xs text-neutral-400 hover:text-neutral-600"
      >
        直接进入网站
      </button>
    </div>
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
            { key: 'hasError', label: '有语法错误' },
            { key: 'correct', label: '语法正确' },
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
          placeholder="在此输入你的改写 / 答案…"
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
  onPlan,
  onHome,
}: {
  overallLevel: string | null
  overallScore: number | null
  result: ProficiencyEvaluationResult | null
  onPlan: () => void
  onHome: () => void
}) {
  const strengths = result?.strengths ?? []
  const weaknesses = result?.weaknesses ?? []
  const dimensions = result?.dimensions ?? {}

  return (
    <div>
      <div className="text-center">
        <CheckCircle2 size={28} className="mx-auto text-neutral-800" />
        <h1 className="mt-3 font-sans text-2xl font-bold tracking-wide text-neutral-900">
          测评完成
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {result?.summary || '已根据你的短写作与基础题生成能力画像'}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400">预估等级</p>
          <p className="mt-1 font-sans text-3xl font-bold text-neutral-900">
            {overallLevel || result?.overallLevel || '—'}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400">综合得分</p>
          <p className="mt-1 font-sans text-3xl font-bold text-neutral-900">
            {overallScore ?? result?.overallScore ?? '—'}
          </p>
        </div>
      </div>

      {Object.keys(dimensions).length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">维度评分</p>
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
              <p className="text-xs font-medium text-neutral-500">优势</p>
              <ul className="mt-2 space-y-1.5 text-sm text-neutral-700">
                {strengths.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500">待提升</p>
              <ul className="mt-2 space-y-1.5 text-sm text-neutral-700">
                {weaknesses.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onPlan}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium uppercase tracking-wide text-white hover:bg-neutral-800"
      >
        查看个人计划
        <ArrowRight size={16} />
      </button>
      <button
        type="button"
        onClick={onHome}
        className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm text-neutral-500 hover:bg-neutral-50"
      >
        进入开始写作
      </button>
      <p className="mt-3 text-center text-[11px] text-neutral-400">
        也可稍后在{' '}
        <Link to="/user-center" className="underline underline-offset-2">
          用户中心 → 个人计划
        </Link>{' '}
        查看
      </p>
    </div>
  )
}

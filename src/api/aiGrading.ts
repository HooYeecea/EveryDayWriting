import { callAiProxy } from './ai'
import type { GradingStageKey } from '../storage/gradingPreviewStorage'
import { parseAiProxyContent } from '../storage/gradingPreviewStorage'
import { loadAiAssistSettings } from '../storage/aiSettingsStorage'
import type { GrammarCheckResult, StructureResult, VocabularyCheckResult } from '../types'

export interface PreSubmitGradingResult {
  gradingSessionId?: string
  completedTasks: string[]
  failedTasks: string[]
  /** 各批改阶段 AI 返回的解析后内容（结构化 JSON 或旧版 markdown 字符串） */
  stageContents: Partial<Record<GradingStageKey, unknown>>
}

type GradingTask = { purpose: GradingStageKey; enabled: boolean; label: string }

type TaskOutcome =
  | { ok: true; task: GradingTask; gradingSessionId?: string; parsed?: unknown }
  | { ok: false; task: GradingTask }

/**
 * 提交前运行已启用的 AI 批改任务，累积到同一个 gradingSession。
 * 首个任务创建会话；其余任务并行追加（后端要求共享 gradingSessionId）。
 */
export async function runPreSubmitGrading(content: string): Promise<PreSubmitGradingResult> {
  const settings = loadAiAssistSettings()

  // 有自有 Key 则用自有 Key；否则走免费通道（需至少选择一个 provider/model）
  const hasOwnKey = Boolean(settings.encryptedKey)
  const providerId = hasOwnKey ? settings.providerId : 'free'
  const modelId = hasOwnKey ? settings.modelId : 'free'

  if (!hasOwnKey && !settings.realtimeAssist && !settings.postSubmitReview && !settings.postSubmitStructure && !settings.postSubmitSuggestions) {
    return { completedTasks: [], failedTasks: [], stageContents: {} }
  }

  const tasks: GradingTask[] = [
    { purpose: 'grammar', enabled: settings.postSubmitReview, label: '语法检查' },
    { purpose: 'structure', enabled: settings.postSubmitStructure, label: '结构评分' },
    { purpose: 'vocabulary', enabled: settings.postSubmitSuggestions, label: '提升建议' },
  ]

  const enabledTasks = tasks.filter((task) => task.enabled)
  if (enabledTasks.length === 0) {
    return { completedTasks: [], failedTasks: [], stageContents: {} }
  }

  const completedTasks: string[] = []
  const failedTasks: string[] = []
  const stageContents: Partial<Record<GradingStageKey, unknown>> = {}

  const runTask = async (task: GradingTask, gradingSessionId?: string): Promise<TaskOutcome> => {
    try {
      const result = await callAiProxy(
        task.purpose,
        {
          providerId,
          modelId,
          userContent: content,
          gradingSessionId,
        },
        hasOwnKey ? settings.encryptedKey : undefined,
      )

      let parsed: unknown
      if (result.content?.trim()) {
        parsed = parseAiProxyContent<
          GrammarCheckResult | StructureResult | VocabularyCheckResult
        >(result.content.trim())
        if (import.meta.env.DEV) {
          console.debug(
            `[aiGrading] ${task.purpose} 解析结果:`,
            typeof parsed === 'string' ? 'string (markdown 兼容)' : 'object',
            typeof parsed === 'object' && parsed ? Object.keys(parsed) : String(parsed).slice(0, 120),
          )
        }
      } else {
        console.warn(`[aiGrading] ${task.purpose} 返回空内容`)
      }

      return { ok: true, task, gradingSessionId: result.gradingSessionId, parsed }
    } catch (err) {
      console.warn(`[aiGrading] ${task.purpose} 失败`, err)
      return { ok: false, task }
    }
  }

  const applyOutcome = (outcome: TaskOutcome) => {
    if (outcome.ok) {
      if (outcome.parsed !== undefined) {
        stageContents[outcome.task.purpose] = outcome.parsed
      }
      completedTasks.push(outcome.task.label)
    } else {
      failedTasks.push(outcome.task.label)
    }
  }

  // 后端：不传 gradingSessionId 会新建会话；传了则追加到同一会话。
  // 因此先跑一个任务拿到 sessionId，其余已启用任务并行追加。
  let gradingSessionId: string | undefined
  let nextIndex = 0

  while (nextIndex < enabledTasks.length && !gradingSessionId) {
    const outcome = await runTask(enabledTasks[nextIndex])
    nextIndex += 1
    applyOutcome(outcome)
    if (outcome.ok && outcome.gradingSessionId) {
      gradingSessionId = outcome.gradingSessionId
    }
  }

  const remaining = enabledTasks.slice(nextIndex)
  if (remaining.length > 0) {
    const outcomes = await Promise.all(
      remaining.map((task) => runTask(task, gradingSessionId)),
    )
    for (const outcome of outcomes) {
      applyOutcome(outcome)
      if (!gradingSessionId && outcome.ok && outcome.gradingSessionId) {
        gradingSessionId = outcome.gradingSessionId
      }
    }
  }

  return { gradingSessionId, completedTasks, failedTasks, stageContents }
}

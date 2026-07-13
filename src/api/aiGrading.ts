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

/**
 * 提交前运行已启用的 AI 批改任务，累积到同一个 gradingSession。
 * 各 purpose 的 AI 返回内容会被解析为对应的结构化类型。
 */
export async function runPreSubmitGrading(content: string): Promise<PreSubmitGradingResult> {
  const settings = loadAiAssistSettings()
  if (!settings.encryptedKey || !settings.providerId || !settings.modelId) {
    return { completedTasks: [], failedTasks: [], stageContents: {} }
  }

  const tasks: Array<{ purpose: GradingStageKey; enabled: boolean; label: string }> = [
    { purpose: 'grammar', enabled: settings.postSubmitReview, label: '语法检查' },
    { purpose: 'structure', enabled: settings.postSubmitStructure, label: '结构评分' },
    { purpose: 'vocabulary', enabled: settings.postSubmitSuggestions, label: '提升建议' },
  ]

  let gradingSessionId: string | undefined
  const completedTasks: string[] = []
  const failedTasks: string[] = []
  const stageContents: Partial<Record<GradingStageKey, unknown>> = {}

  for (const task of tasks) {
    if (!task.enabled) continue
    try {
      const result = await callAiProxy(
        task.purpose,
        {
          providerId: settings.providerId,
          modelId: settings.modelId,
          userContent: content,
          gradingSessionId,
        },
        settings.encryptedKey,
      )
      if (result.gradingSessionId) {
        gradingSessionId = result.gradingSessionId
      }
      if (result.content?.trim()) {
        // 解析 JSON，兼容旧版 markdown
        const parsed = parseAiProxyContent<
          GrammarCheckResult | StructureResult | VocabularyCheckResult
        >(result.content.trim())
        stageContents[task.purpose] = parsed
      }
      completedTasks.push(task.label)
    } catch (err) {
      console.warn(`[aiGrading] ${task.purpose} 失败`, err)
      failedTasks.push(task.label)
    }
  }

  return { gradingSessionId, completedTasks, failedTasks, stageContents }
}

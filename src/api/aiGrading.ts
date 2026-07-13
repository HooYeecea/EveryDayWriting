import { callAiProxy } from './ai'
import type { GradingStageKey } from '../storage/gradingPreviewStorage'
import { loadAiAssistSettings } from '../storage/aiSettingsStorage'

export interface PreSubmitGradingResult {
  gradingSessionId?: string
  completedTasks: string[]
  failedTasks: string[]
  /** 各批改阶段 AI 返回的原始文本，用于写作记录展示叙述性反馈 */
  stageContents: Partial<Record<GradingStageKey, string>>
}

/**
 * 提交前运行已启用的 AI 批改任务，累积到同一个 gradingSession。
 */
export async function runPreSubmitGrading(content: string): Promise<PreSubmitGradingResult> {
  const settings = loadAiAssistSettings()
  if (!settings.encryptedKey || !settings.providerId || !settings.modelId) {
    return { completedTasks: [], failedTasks: [], stageContents: {} }
  }

  const tasks: Array<{ purpose: GradingStageKey; enabled: boolean; label: string }> = [
    { purpose: 'grammar', enabled: settings.postSubmitReview, label: '语法检查' },
    { purpose: 'vocabulary', enabled: settings.postSubmitSuggestions, label: '提升建议' },
  ]

  let gradingSessionId: string | undefined
  const completedTasks: string[] = []
  const failedTasks: string[] = []
  const stageContents: Partial<Record<GradingStageKey, string>> = {}

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
        stageContents[task.purpose] = result.content.trim()
      }
      completedTasks.push(task.label)
    } catch (err) {
      console.warn(`[aiGrading] ${task.purpose} 失败`, err)
      failedTasks.push(task.label)
    }
  }

  return { gradingSessionId, completedTasks, failedTasks, stageContents }
}

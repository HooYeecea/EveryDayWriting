import type { LucideIcon } from 'lucide-react'
import { Sparkles, Timer } from 'lucide-react'

export type AssistFeatureId = 'ai-assistant' | 'writing-timer'

export interface AssistFeature {
  id: AssistFeatureId
  label: string
  description: string
  icon: LucideIcon
  available: boolean
}

export const ASSIST_FEATURES: AssistFeature[] = [
  {
    id: 'ai-assistant',
    label: 'AI 辅助开关',
    description: '提交后检查修改、提升建议，或边写边辅助',
    icon: Sparkles,
    available: true,
  },
  {
    id: 'writing-timer',
    label: '写作计时',
    description: '设定时长，倒计时或正计时，到点提醒',
    icon: Timer,
    available: true,
  },
]

export function getAssistFeature(id: AssistFeatureId): AssistFeature {
  const feature = ASSIST_FEATURES.find((item) => item.id === id)
  if (!feature) throw new Error(`Unknown assist feature: ${id}`)
  return feature
}

import type { LucideIcon } from 'lucide-react'
import { Sparkles, Timer } from 'lucide-react'
import type { MessageKey } from '../../i18n'

export type AssistFeatureId = 'ai-assistant' | 'writing-timer'

export interface AssistFeature {
  id: AssistFeatureId
  labelKey: MessageKey
  descriptionKey: MessageKey
  icon: LucideIcon
  available: boolean
}

export const ASSIST_FEATURES: AssistFeature[] = [
  {
    id: 'ai-assistant',
    labelKey: 'assist.ai.title',
    descriptionKey: 'assist.ai.description',
    icon: Sparkles,
    available: true,
  },
  {
    id: 'writing-timer',
    labelKey: 'assist.timer.title',
    descriptionKey: 'assist.timer.description',
    icon: Timer,
    available: true,
  },
]

export function getAssistFeature(id: AssistFeatureId): AssistFeature {
  const feature = ASSIST_FEATURES.find((item) => item.id === id)
  if (!feature) throw new Error(`Unknown assist feature: ${id}`)
  return feature
}

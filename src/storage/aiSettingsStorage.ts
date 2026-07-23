const AI_SETTINGS_KEY = 'ew_ai_settings'

export type RealtimeStreamEffect = 'tips-fade' | 'typewriter' | 'fade'

export interface AiAssistSettings {
  providerId: string
  modelId: string
  encryptedKey: string
  postSubmitReview: boolean
  postSubmitStructure: boolean
  postSubmitSuggestions: boolean
  realtimeAssist: boolean
  /** 实时辅助是否走 SSE 流式（默认开启） */
  realtimeStreamEnabled: boolean
  /** 流式展示动效（默认逐条淡入） */
  realtimeStreamEffect: RealtimeStreamEffect
}

const DEFAULT_SETTINGS: AiAssistSettings = {
  providerId: '',
  modelId: '',
  encryptedKey: '',
  postSubmitReview: false,
  postSubmitStructure: false,
  postSubmitSuggestions: false,
  realtimeAssist: false,
  realtimeStreamEnabled: true,
  realtimeStreamEffect: 'tips-fade',
}

const STREAM_EFFECTS: RealtimeStreamEffect[] = ['tips-fade', 'typewriter', 'fade']

function normalizeStreamEffect(value: unknown): RealtimeStreamEffect {
  if (typeof value === 'string' && STREAM_EFFECTS.includes(value as RealtimeStreamEffect)) {
    return value as RealtimeStreamEffect
  }
  return DEFAULT_SETTINGS.realtimeStreamEffect
}

export function loadAiAssistSettings(): AiAssistSettings {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AiAssistSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      realtimeStreamEnabled:
        typeof parsed.realtimeStreamEnabled === 'boolean'
          ? parsed.realtimeStreamEnabled
          : DEFAULT_SETTINGS.realtimeStreamEnabled,
      realtimeStreamEffect: normalizeStreamEffect(parsed.realtimeStreamEffect),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveAiAssistSettings(settings: AiAssistSettings): void {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings))
}

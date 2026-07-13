const AI_SETTINGS_KEY = 'ew_ai_settings'

export interface AiAssistSettings {
  providerId: string
  modelId: string
  encryptedKey: string
  postSubmitReview: boolean
  postSubmitStructure: boolean
  postSubmitSuggestions: boolean
  realtimeAssist: boolean
}

const DEFAULT_SETTINGS: AiAssistSettings = {
  providerId: '',
  modelId: '',
  encryptedKey: '',
  postSubmitReview: false,
  postSubmitStructure: false,
  postSubmitSuggestions: false,
  realtimeAssist: false,
}

export function loadAiAssistSettings(): AiAssistSettings {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveAiAssistSettings(settings: AiAssistSettings): void {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings))
}

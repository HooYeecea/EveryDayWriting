import { loadUserPreferences, updateUserPreferences } from './preferencesStorage'

/** 默认开启打字动画；读写统一走用户偏好，便于系统设置页与写作页同步 */
export function isTypingAnimationEnabled(): boolean {
  try {
    return loadUserPreferences().writing.typingAnimation
  } catch {
    return true
  }
}

export function setTypingAnimationEnabled(enabled: boolean): void {
  updateUserPreferences((current) => ({
    ...current,
    writing: { ...current.writing, typingAnimation: enabled },
  }))
}

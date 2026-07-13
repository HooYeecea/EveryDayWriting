const TYPING_ANIMATION_KEY = 'ew_typing_animation'

/** 默认开启打字动画 */
export function isTypingAnimationEnabled(): boolean {
  try {
    const raw = localStorage.getItem(TYPING_ANIMATION_KEY)
    if (raw === null) return true
    return raw === 'true'
  } catch {
    return true
  }
}

export function setTypingAnimationEnabled(enabled: boolean): void {
  localStorage.setItem(TYPING_ANIMATION_KEY, String(enabled))
}

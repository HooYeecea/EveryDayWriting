import type { MessageKey } from '../i18n/messages'

export function validatePassword(password: string): MessageKey | null {
  if (password.length < 8) {
    return 'auth.validation.password.minLength'
  }
  if (!/[a-z]/.test(password)) {
    return 'auth.validation.password.needLower'
  }
  if (!/[A-Z]/.test(password)) {
    return 'auth.validation.password.needUpper'
  }
  if (!/\d/.test(password)) {
    return 'auth.validation.password.needDigit'
  }
  return null
}

export function validateEmail(email: string): MessageKey | null {
  const value = email.trim()
  if (!value) return 'auth.validation.email.required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'auth.validation.email.invalid'
  }
  return null
}

/** 密码字段下方常驻说明 key（与校验文案分开，避免塞进 placeholder） */
export const PASSWORD_FIELD_HINT_KEY = 'auth.common.passwordHint' as const satisfies MessageKey

export function getAvatarLabel(profile: { nickname: string; avatar: string | null }): string {
  const name = profile.nickname?.trim()
  const initials = name ? name.slice(0, 2).toUpperCase() : 'U'

  // 有真实头像 URL 时返回首字母作为后备（img 加载失败时显示）
  if (profile.avatar && (profile.avatar.startsWith('http') || profile.avatar.startsWith('/'))) {
    return initials
  }
  // 短字符串 avatar（可能是 emoji 或缩写）
  if (profile.avatar && profile.avatar.length <= 3) {
    return profile.avatar
  }
  return initials
}

export function getVipLabel(vipLevel: number): string {
  return vipLevel > 0 ? 'VIP' : '普通用户'
}

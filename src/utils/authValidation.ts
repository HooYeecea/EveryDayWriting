export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return '请使用至少 8 位密码'
  }
  if (!/[a-z]/.test(password)) {
    return '请加入至少 1 个小写字母'
  }
  if (!/[A-Z]/.test(password)) {
    return '请加入至少 1 个大写字母'
  }
  if (!/\d/.test(password)) {
    return '请加入至少 1 个数字'
  }
  return null
}

export function validateEmail(email: string): string | null {
  const value = email.trim()
  if (!value) return '请填写邮箱'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return '请输入有效的邮箱地址'
  }
  return null
}

/** 密码字段下方常驻说明（与校验文案分开，避免塞进 placeholder） */
export const PASSWORD_FIELD_HINT = '至少 8 位，需同时包含大小写字母与数字'

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

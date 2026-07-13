export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return '密码至少 8 位'
  }
  if (!/[a-z]/.test(password)) {
    return '密码需包含小写字母'
  }
  if (!/[A-Z]/.test(password)) {
    return '密码需包含大写字母'
  }
  if (!/\d/.test(password)) {
    return '密码需包含数字'
  }
  return null
}

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

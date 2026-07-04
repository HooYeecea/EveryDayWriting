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
  if (profile.avatar && profile.avatar.startsWith('http')) {
    return profile.nickname.slice(0, 2).toUpperCase()
  }
  if (profile.avatar && profile.avatar.length <= 3) {
    return profile.avatar
  }
  return profile.nickname.slice(0, 2).toUpperCase() || 'U'
}

export function getVipLabel(vipLevel: number): string {
  return vipLevel > 0 ? 'VIP' : '普通用户'
}

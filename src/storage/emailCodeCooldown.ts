import type { SendCodePurpose } from '../types'

export const EMAIL_CODE_COOLDOWN_SECONDS = 60

const STORAGE_PREFIX = 'ew_email_code_sent'

function storageKey(purpose: SendCodePurpose, email: string): string {
  return `${STORAGE_PREFIX}:${purpose}:${email.trim().toLowerCase()}`
}

export function recordEmailCodeSent(purpose: SendCodePurpose, email: string): void {
  if (!email.trim()) return
  localStorage.setItem(storageKey(purpose, email), String(Date.now()))
}

export function getEmailCodeCooldownRemaining(purpose: SendCodePurpose, email: string): number {
  if (!email.trim()) return 0

  const raw = localStorage.getItem(storageKey(purpose, email))
  if (!raw) return 0

  const sentAt = Number(raw)
  if (!Number.isFinite(sentAt)) return 0

  const elapsedSeconds = Math.floor((Date.now() - sentAt) / 1000)
  const remain = EMAIL_CODE_COOLDOWN_SECONDS - elapsedSeconds
  return remain > 0 ? remain : 0
}

export function emailCodeCooldownLabel(cooldown: number, sending: boolean): string {
  if (sending) return '发送中…'
  if (cooldown > 0) return `${cooldown}s`
  return '获取验证码'
}

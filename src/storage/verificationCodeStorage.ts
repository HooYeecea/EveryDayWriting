const CODES_KEY = 'ew_verify_codes'
const CODE_TTL_MS = 5 * 60 * 1000 // 5 分钟
const SEND_COOLDOWN_MS = 60 * 1000 // 60 秒

interface StoredCode {
  code: string
  expiresAt: number
  sentAt: number
}

type CodeStore = Record<string, StoredCode>

function readCodes(): CodeStore {
  const raw = localStorage.getItem(CODES_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as CodeStore
  } catch {
    return {}
  }
}

function writeCodes(codes: CodeStore): void {
  localStorage.setItem(CODES_KEY, JSON.stringify(codes))
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** 发送邮箱验证码（演示模式，验证码存于本地） */
export function sendVerificationCode(email: string): { demoCode?: string } {
  const normalized = email.trim().toLowerCase()
  if (!normalized) {
    throw new Error('请输入邮箱')
  }

  const codes = readCodes()
  const existing = codes[normalized]
  if (existing && Date.now() - existing.sentAt < SEND_COOLDOWN_MS) {
    const remain = Math.ceil((SEND_COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000)
    throw new Error(`请 ${remain} 秒后再试`)
  }

  const code = generateCode()
  codes[normalized] = {
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
    sentAt: Date.now(),
  }
  writeCodes(codes)

  // 演示模式返回验证码，便于测试；接后端后删除
  return { demoCode: code }
}

export function verifyCode(email: string, code: string): boolean {
  const normalized = email.trim().toLowerCase()
  const stored = readCodes()[normalized]
  if (!stored) return false
  if (Date.now() > stored.expiresAt) return false
  return stored.code === code.trim()
}

export function clearVerificationCode(email: string): void {
  const normalized = email.trim().toLowerCase()
  const codes = readCodes()
  delete codes[normalized]
  writeCodes(codes)
}

export function getCodeCooldownRemaining(email: string): number {
  const normalized = email.trim().toLowerCase()
  const stored = readCodes()[normalized]
  if (!stored) return 0
  const remain = SEND_COOLDOWN_MS - (Date.now() - stored.sentAt)
  return remain > 0 ? Math.ceil(remain / 1000) : 0
}

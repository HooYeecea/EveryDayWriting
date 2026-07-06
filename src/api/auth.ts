import { API_PATHS } from './config'
import { get, post } from './request'
import {
  clearAuthTokens,
  getToken,
  persistAuthSession,
} from '../storage/tokenStorage'
import type {
  AuthSession,
  AuthUserBrief,
  LoginGraphCaptcha,
  SendCodePurpose,
  UserProfile,
} from '../types'

interface LoginResponseData {
  token: string
  refreshToken: string
  expiresAt: string
  user: AuthUserBrief
}

interface RegisterResponseData {
  token: string
  refreshToken?: string
  expiresAt?: string
  user: AuthUserBrief
}

function normalizeSession(data: LoginResponseData): AuthSession {
  return {
    token: data.token,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresAt,
    user: data.user,
  }
}

function storeSession(session: AuthSession): void {
  persistAuthSession(session.token, session.refreshToken, session.expiresAt)
}

export async function sendEmailCode(
  email: string,
  purpose: SendCodePurpose,
): Promise<void> {
  await post(API_PATHS.auth.sendCode, { email: email.trim(), purpose }, { skipAuth: true })
}

export { fetchGraphCaptcha, refreshGraphCaptcha } from './graphCaptchaApi'

export async function login(
  email: string,
  password: string,
  captcha?: LoginGraphCaptcha,
): Promise<AuthSession> {
  const body: Record<string, string> = {
    email: email.trim(),
    password,
  }
  if (captcha?.captchaId && captcha.graphCode.trim()) {
    body.captchaId = captcha.captchaId
    body.graphCode = captcha.graphCode.trim()
  }

  const data = await post<LoginResponseData>(API_PATHS.auth.login, body, { skipAuth: true })
  const session = normalizeSession(data)
  storeSession(session)
  return session
}

export async function register(
  email: string,
  password: string,
  code: string,
): Promise<AuthSession> {
  await post<RegisterResponseData>(
    API_PATHS.auth.register,
    { email: email.trim(), password, code: code.trim() },
    { skipAuth: true },
  )

  // 后端注册仅返回 access token，自动登录以获取 refresh token
  return login(email, password)
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await post(
    API_PATHS.auth.resetPassword,
    { email: email.trim(), code: code.trim(), newPassword },
    { skipAuth: true },
  )
}

export async function fetchUserProfile(): Promise<UserProfile> {
  return get<UserProfile>(API_PATHS.user.profile)
}

export async function logout(): Promise<void> {
  try {
    if (getToken()) {
      await post(API_PATHS.auth.logout)
    }
  } catch {
    // 本地仍清除凭证
  } finally {
    clearAuthTokens()
  }
}

export async function restoreSession(): Promise<UserProfile | null> {
  if (!getToken()) {
    return null
  }
  try {
    return await fetchUserProfile()
  } catch {
    clearAuthTokens()
    return null
  }
}

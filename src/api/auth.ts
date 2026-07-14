import { API_PATHS } from './config'
import { get, post, put } from './request'
import {
  clearAuthTokens,
  getToken,
  persistAuthSession,
} from '../storage/tokenStorage'
import {
  clearMustChangePassword,
  getMustChangePassword,
  setMustChangePassword,
} from '../storage/mustChangePasswordStorage'
import { clearStoredRoles, setStoredRoles } from '../storage/rolesStorage'
import {
  clearStoredPermissions,
  setStoredPermissions,
} from '../storage/permissionsStorage'
import { parseAuthPermissions, parseAuthRoles } from '../utils/roles'
import type {
  AuthRole,
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
  user: AuthUserBrief & {
    roles?: unknown
    permissions?: unknown
  }
  /** 兼容旧字段（若后端仍放在 data 根级） */
  roles?: unknown
  permissions?: unknown
}

interface RegisterResponseData {
  token: string
  refreshToken?: string
  expiresAt?: string
  user: AuthUserBrief & {
    roles?: unknown
    permissions?: unknown
  }
  roles?: unknown
  permissions?: unknown
}

interface ChangePasswordResponseData {
  token: string
  refreshToken: string
  expiresAt: string
}

/** 登录：优先 $.data.user.roles，兼容根级 roles */
function extractRoles(data: LoginResponseData): AuthRole[] {
  if (data.user?.roles !== undefined) {
    return parseAuthRoles(data.user.roles)
  }
  return parseAuthRoles(data.roles)
}

/** 登录：优先 $.data.user.permissions，兼容根级 permissions */
function extractPermissions(data: LoginResponseData): string[] {
  if (data.user?.permissions !== undefined) {
    return parseAuthPermissions(data.user.permissions)
  }
  return parseAuthPermissions(data.permissions)
}

function normalizeSession(data: LoginResponseData): AuthSession {
  const roles = extractRoles(data)
  const permissions = extractPermissions(data)
  return {
    token: data.token,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresAt,
    user: {
      ...data.user,
      roles,
    },
    permissions,
  }
}

function storeSession(session: AuthSession): void {
  persistAuthSession(session.token, session.refreshToken, session.expiresAt)
  setStoredRoles(session.user.roles ?? [])
  setStoredPermissions(session.permissions)
}

function clearLocalAuth(): void {
  clearAuthTokens()
  clearMustChangePassword()
  clearStoredRoles()
  clearStoredPermissions()
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
  setMustChangePassword(Boolean(session.user.mustChangePassword))
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

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const data = await put<ChangePasswordResponseData>(API_PATHS.user.password, {
    oldPassword,
    newPassword,
  })
  persistAuthSession(data.token, data.refreshToken, data.expiresAt)
  clearMustChangePassword()
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const data = await get<UserProfile>(API_PATHS.user.profile)
  return normalizeUserProfile(data)
}

function normalizeUserProfile(data: UserProfile): UserProfile {
  const stats = data.stats ?? ({} as UserProfile['stats'])
  return {
    ...data,
    stats: {
      totalWritings: Number(stats.totalWritings) || 0,
      totalWords: Number(stats.totalWords) || 0,
      vocabularyCount: Number(stats.vocabularyCount) || 0,
      tokenUsage: stats.tokenUsage
        ? {
            consumedThisMonth: Number(stats.tokenUsage.consumedThisMonth) || 0,
            totalCalls: Number(stats.tokenUsage.totalCalls) || 0,
          }
        : undefined,
    },
  }
}

export async function logoutAll(): Promise<void> {
  try {
    if (getToken()) {
      await post(API_PATHS.auth.logoutAll)
    }
  } catch {
    // 本地仍清除凭证
  } finally {
    clearLocalAuth()
  }
}

export async function logout(): Promise<void> {
  try {
    if (getToken()) {
      await post(API_PATHS.auth.logout)
    }
  } catch {
    // 本地仍清除凭证
  } finally {
    clearLocalAuth()
  }
}

export async function restoreSession(): Promise<UserProfile | null> {
  if (!getToken()) {
    return null
  }
  if (getMustChangePassword()) {
    return null
  }
  try {
    return await fetchUserProfile()
  } catch {
    clearLocalAuth()
    return null
  }
}

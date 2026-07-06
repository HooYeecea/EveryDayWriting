import { API_PREFIX, getApiBaseUrl, SUCCESS_CODES } from './config'
import type { ApiResponse, RequestOptions } from './types'
import { ApiError } from './types'
import {
  clearAuthTokens,
  getRefreshToken,
  getToken,
  persistAuthSession,
} from '../storage/tokenStorage'
import { API_PATHS } from './config'

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null
let refreshPromise: Promise<boolean> | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

function resolveApiUrl(path: string): string {
  const base = getApiBaseUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`

  if (normalized.startsWith('/api/v1')) {
    return base.startsWith('http') ? `${base.replace(/\/api\/v1$/, '')}${normalized}` : normalized
  }

  const fullPath = `${API_PREFIX}${normalized}`

  if (base.startsWith('http')) {
    const origin = base.replace(/\/api\/v1$/, '')
    return `${origin}${fullPath}`
  }

  return fullPath
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const resolved = resolveApiUrl(path)

  if (!params) {
    return resolved
  }

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `${resolved}?${query}` : resolved
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.fetchOptions?.headers)

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (!options.skipAuth) {
    const token = getToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  return headers
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return null as T
  }

  let json: ApiResponse<T>
  try {
    json = (await response.json()) as ApiResponse<T>
  } catch {
    if (response.status === 401) {
      throw new ApiError(401, '登录状态已失效，请重新登录', 401)
    }
    if (response.status === 403) {
      throw new ApiError(403, '无权访问，请先完成必要操作', 403)
    }
    throw new ApiError(response.status, '响应解析失败', response.status)
  }

  const businessCode = json.code ?? response.status

  if (!response.ok || !SUCCESS_CODES.has(businessCode)) {
    if (response.status === 401 || businessCode === 401) {
      unauthorizedHandler?.()
    }
    throw new ApiError(
      businessCode,
      json.message ?? '请求失败',
      response.status,
      json.data ?? null,
    )
  }

  return json.data
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  const accessToken = getToken()
  if (!refreshToken || !accessToken) {
    return false
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    headers.Authorization = `Bearer ${accessToken}`

    const response = await fetch(buildUrl(API_PATHS.auth.refresh), {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      clearAuthTokens()
      unauthorizedHandler?.()
      return false
    }

    const json = (await response.json()) as ApiResponse<{
      token: string
      refreshToken: string
      expiresAt: string
    }>

    if (!SUCCESS_CODES.has(json.code)) {
      clearAuthTokens()
      unauthorizedHandler?.()
      return false
    }

    persistAuthSession(json.data.token, json.data.refreshToken, json.data.expiresAt)
    return true
  } catch {
    clearAuthTokens()
    unauthorizedHandler?.()
    return false
  }
}

async function ensureRefreshed(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function request<T>(
  path: string,
  method: string,
  options: RequestOptions = {},
  retried = false,
): Promise<T> {
  const { params, body, skipAuth = false, fetchOptions } = options

  const url = buildUrl(path, params)

  if (import.meta.env.DEV && path.includes('/topics/random')) {
    console.debug('[api:topics/random]', method, url, {
      skipAuth,
      hasToken: !skipAuth && Boolean(getToken()),
      retried,
    })
  }

  const response = await fetch(url, {
    ...fetchOptions,
    method,
    headers: buildHeaders({ ...options, skipAuth }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (
    !skipAuth &&
    (response.status === 401 || response.status === 403) &&
    getRefreshToken() &&
    !retried &&
    !path.includes(API_PATHS.auth.refresh)
  ) {
    if (import.meta.env.DEV && path.includes('/topics/random')) {
      console.warn('[api:topics/random] 401/403，尝试刷新 Token 后重试')
    }
    const refreshed = await ensureRefreshed()
    if (refreshed) {
      return request<T>(path, method, options, true)
    }
  }

  if (import.meta.env.DEV && path.includes('/topics/random')) {
    const debugBody = await response.clone().json().catch(() => null)
    console.debug('[api:topics/random] 响应', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: debugBody,
    })
  }

  return parseResponse<T>(response)
}

export function get<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
  return request<T>(path, 'GET', options)
}

export function post<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, 'body'>,
): Promise<T> {
  return request<T>(path, 'POST', { ...options, body })
}

export function put<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, 'body'>,
): Promise<T> {
  return request<T>(path, 'PUT', { ...options, body })
}

export function del<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
  return request<T>(path, 'DELETE', options)
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

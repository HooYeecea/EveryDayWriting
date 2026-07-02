import { getApiBaseUrl, SUCCESS_CODES } from './config'
import type { ApiResponse, RequestOptions } from './types'
import { ApiError } from './types'
import { getToken } from '../storage/tokenStorage'

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/** 注册 401 全局处理（后续可在 AuthContext 中接入） */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

function resolveApiUrl(path: string): string {
  const base = getApiBaseUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`
  const apiPath = normalized.startsWith('/api') ? normalized : `/api${normalized}`

  if (base.startsWith('http')) {
    return `${base.replace(/\/$/, '')}${apiPath}`
  }

  return apiPath
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
    )
  }

  return json.data
}

/**
 * 统一请求方法
 * @param path 接口路径，如 `/auth/login`（相对 /api）
 * @returns 解包后的 data 字段
 */
export async function request<T>(
  path: string,
  method: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, body, skipAuth = false, fetchOptions } = options

  const response = await fetch(buildUrl(path, params), {
    ...fetchOptions,
    method,
    headers: buildHeaders({ ...options, skipAuth }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

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

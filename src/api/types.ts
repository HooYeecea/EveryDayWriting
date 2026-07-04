/** 与 API.md 对齐的统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页列表 data 结构 */
export interface PaginatedData<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/** 分页 Query 参数 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/** 请求配置 */
export interface RequestOptions {
  /** Query 参数 */
  params?: Record<string, string | number | boolean | null | undefined>
  /** JSON 请求体 */
  body?: unknown
  /** 跳过 Authorization 头（登录、注册等公开接口） */
  skipAuth?: boolean
  /** 额外 fetch 选项（headers / signal 等） */
  fetchOptions?: Omit<RequestInit, 'body' | 'method'>
}

export class ApiError extends Error {
  readonly code: number
  readonly httpStatus: number
  readonly data: unknown

  constructor(code: number, message: string, httpStatus: number, data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.httpStatus = httpStatus
    this.data = data
  }

  get isUnauthorized(): boolean {
    return this.httpStatus === 401 || this.code === 401
  }

  get isForbidden(): boolean {
    return this.httpStatus === 403 || this.code === 403
  }

  get isNotFound(): boolean {
    return this.httpStatus === 404 || this.code === 404
  }

  get isRateLimited(): boolean {
    return this.httpStatus === 429 || this.code === 429
  }
}

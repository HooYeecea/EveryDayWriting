/**
 * API 模块统一入口
 *
 * 使用示例（业务层后续接入时）：
 *
 * ```ts
 * import { get, post, API_PATHS } from '@/api'
 *
 * // 登录（skipAuth 跳过 Token）
 * const data = await post(API_PATHS.auth.login, { email, password }, { skipAuth: true })
 *
 * // 获取个人信息（自动携带 Bearer Token）
 * const profile = await get(API_PATHS.user.profile)
 * ```
 */

export {
  API_PREFIX,
  API_PATHS,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SUCCESS_CODES,
  getApiBaseUrl,
} from './config'

export type {
  ApiResponse,
  PaginatedData,
  PaginationParams,
  RequestOptions,
} from './types'

export { ApiError } from './types'

export {
  del,
  get,
  isApiError,
  post,
  put,
  request,
  setUnauthorizedHandler,
} from './request'

export { getToken, removeToken, setToken } from '../storage/tokenStorage'

import type { GraphCaptcha } from '../types'
import { API_PATHS } from './config'
import { get } from './request'

const COOLDOWN_MS = 60_000

let cachedCaptcha: GraphCaptcha | null = null
let cachedAt = 0
let inflight: Promise<GraphCaptcha> | null = null

export function getGraphCaptchaCooldownRemaining(): number {
  const elapsed = Date.now() - cachedAt
  const remain = COOLDOWN_MS - elapsed
  return remain > 0 ? Math.ceil(remain / 1000) : 0
}

/** 带 60s 去重：并发/StrictMode 复用同一请求，冷却期内复用缓存 */
export async function fetchGraphCaptcha(): Promise<GraphCaptcha> {
  const cooldown = getGraphCaptchaCooldownRemaining()
  if (cachedCaptcha && cooldown > 0) {
    return cachedCaptcha
  }

  if (inflight) {
    return inflight
  }

  inflight = get<GraphCaptcha>(API_PATHS.auth.sendGraphCode, { skipAuth: true })
    .then((data) => {
      cachedCaptcha = data
      cachedAt = Date.now()
      return data
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** 用户主动换一张：冷却期内不重复请求后端 */
export async function refreshGraphCaptcha(): Promise<GraphCaptcha> {
  const cooldown = getGraphCaptchaCooldownRemaining()
  if (cooldown > 0) {
    if (cachedCaptcha) {
      return cachedCaptcha
    }
    throw new Error(`图形验证码访问过于频繁，请 ${cooldown} 秒后再试`)
  }

  cachedCaptcha = null
  cachedAt = 0
  return fetchGraphCaptcha()
}

export function clearGraphCaptchaCache(): void {
  cachedCaptcha = null
  cachedAt = 0
  inflight = null
}

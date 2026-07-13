import { getApiBaseUrl } from '../api/config'

/** 将后端返回的相对资源路径（如 /uploads/xxx）转为可访问 URL */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed
  }
  const base = getApiBaseUrl()
  if (base.startsWith('http')) {
    const origin = base.replace(/\/api\/v1$/, '')
    return `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

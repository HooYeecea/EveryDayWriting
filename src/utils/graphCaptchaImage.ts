/** 将后端返回的 Base64 SVG 转为 img 可用的 data URL */
export function buildGraphCaptchaImageSrc(imageBase64: string): string {
  const trimmed = imageBase64.trim()
  if (trimmed.startsWith('data:')) {
    return trimmed
  }
  return `data:image/svg+xml;base64,${trimmed}`
}

import { Converter } from 'opencc-js'

/** 简体 → 台湾正体（繁体） */
const converter = Converter({ from: 'cn', to: 'tw' })
const cache = new Map<string, string>()

/** 将简体中文转为繁体；带缓存，重复文案零开销 */
export function toTraditionalChinese(text: string): string {
  if (!text) return text
  const hit = cache.get(text)
  if (hit !== undefined) return hit
  const converted = converter(text)
  cache.set(text, converted)
  return converted
}

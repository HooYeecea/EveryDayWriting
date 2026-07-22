import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import zhLocale from 'i18n-iso-countries/langs/zh.json'
import type { MenuSelectOption } from '../components/common/MenuSelect'

/** 应用 UI 语言；后续国际化可扩展为 'en' 等 */
export type AppLocale = 'zh' | 'en'

const ALL_LABEL: Record<AppLocale, string> = {
  zh: '全部',
  en: 'All',
}

let localesRegistered = false

function ensureLocales() {
  if (localesRegistered) return
  countries.registerLocale(zhLocale)
  countries.registerLocale(enLocale)
  localesRegistered = true
}

/**
 * 访问日志等接口当前按中文国名入库/筛选，故 value 固定为中文名；
 * label 随 locale 变化，便于后续统一做国际化。
 */
export function getWorldCountrySelectOptions(locale: AppLocale = 'zh'): MenuSelectOption[] {
  ensureLocales()

  const codes = Object.keys(countries.getAlpha2Codes())
  const options: MenuSelectOption[] = []

  for (const code of codes) {
    const filterValue = countries.getName(code, 'zh')
    const label = countries.getName(code, locale) || filterValue
    if (!filterValue || !label) continue
    options.push({ value: filterValue, label })
  }

  options.sort((a, b) => a.label.localeCompare(b.label, locale === 'zh' ? 'zh-CN' : 'en'))

  // 中文环境下把「中国」置顶，方便运营筛选
  if (locale === 'zh') {
    const chinaIndex = options.findIndex((item) => item.value === '中国')
    if (chinaIndex > 0) {
      const [china] = options.splice(chinaIndex, 1)
      options.unshift(china)
    }
  }

  return [{ value: '', label: ALL_LABEL[locale] }, ...options]
}

import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import jaLocale from 'i18n-iso-countries/langs/ja.json'
import koLocale from 'i18n-iso-countries/langs/ko.json'
import zhLocale from 'i18n-iso-countries/langs/zh.json'
import type { MenuSelectOption } from '../components/common/MenuSelect'
import type { AppLocale } from '../types/preferences'
import { LOCALE_HTML_LANG } from '../i18n'

const ALL_LABEL: Record<AppLocale, string> = {
  zh: '全部',
  en: 'All',
  ja: 'すべて',
  ko: '전체',
}

const ISO_LOCALE: Record<AppLocale, string> = {
  zh: 'zh',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
}

let localesRegistered = false

function ensureLocales() {
  if (localesRegistered) return
  countries.registerLocale(zhLocale)
  countries.registerLocale(enLocale)
  countries.registerLocale(jaLocale)
  countries.registerLocale(koLocale)
  localesRegistered = true
}

/**
 * 访问日志等接口当前按中文国名入库/筛选，故 value 固定为中文名；
 * label 随 locale 变化。
 */
export function getWorldCountrySelectOptions(locale: AppLocale = 'zh'): MenuSelectOption[] {
  ensureLocales()

  const codes = Object.keys(countries.getAlpha2Codes())
  const options: MenuSelectOption[] = []
  const isoLang = ISO_LOCALE[locale]

  for (const code of codes) {
    const filterValue = countries.getName(code, 'zh')
    const label = countries.getName(code, isoLang) || filterValue
    if (!filterValue || !label) continue
    options.push({ value: filterValue, label })
  }

  options.sort((a, b) =>
    a.label.localeCompare(b.label, LOCALE_HTML_LANG[locale] ?? 'en'),
  )

  if (locale === 'zh') {
    const chinaIndex = options.findIndex((item) => item.value === '中国')
    if (chinaIndex > 0) {
      const [china] = options.splice(chinaIndex, 1)
      options.unshift(china)
    }
  }

  return [{ value: '', label: ALL_LABEL[locale] }, ...options]
}

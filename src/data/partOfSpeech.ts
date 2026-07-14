/** 英语常用词性（词典缩写） */
export const PART_OF_SPEECH_OPTIONS = [
  { value: 'n.', label: 'n. 名词' },
  { value: 'pron.', label: 'pron. 代词' },
  { value: 'v.', label: 'v. 动词' },
  { value: 'vt.', label: 'vt. 及物动词' },
  { value: 'vi.', label: 'vi. 不及物动词' },
  { value: 'aux.', label: 'aux. 助动词' },
  { value: 'mod.', label: 'mod. 情态动词' },
  { value: 'adj.', label: 'adj. 形容词' },
  { value: 'adv.', label: 'adv. 副词' },
  { value: 'prep.', label: 'prep. 介词' },
  { value: 'conj.', label: 'conj. 连词' },
  { value: 'interj.', label: 'interj. 感叹词' },
  { value: 'art.', label: 'art. 冠词' },
  { value: 'num.', label: 'num. 数词' },
  { value: 'det.', label: 'det. 限定词' },
  { value: 'phr.v.', label: 'phr.v. 短语动词' },
  { value: 'phr.', label: 'phr. 短语' },
  { value: 'abbr.', label: 'abbr. 缩写' },
  { value: 'pref.', label: 'pref. 前缀' },
  { value: 'suf.', label: 'suf. 后缀' },
] as const

export const DEFAULT_PART_OF_SPEECH = PART_OF_SPEECH_OPTIONS[0].value

export function isKnownPartOfSpeech(value: string): boolean {
  return PART_OF_SPEECH_OPTIONS.some((item) => item.value === value)
}

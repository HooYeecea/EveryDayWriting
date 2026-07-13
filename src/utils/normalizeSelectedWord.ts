/** 将用户选中的文本规范为可加入词库的单词/短语 */
function stripEdgePunctuation(value: string): string {
  return value
    .replace(/^[\s"'`´\u2018\u2019\u201C\u201D.,;:!?()[\]{}<>/\\|@#$%^&*+=~，。；：！？、（）【】《》]+/u, '')
    .replace(/[\s"'`´\u2018\u2019\u201C\u201D.,;:!?()[\]{}<>/\\|@#$%^&*+=~，。；：！？、（）【】《》]+$/u, '')
}

export function normalizeSelectedWord(raw: string): string | null {
  let collapsed = raw.trim().replace(/\s+/g, ' ')
  if (!collapsed || collapsed.length > 120) return null
  if (!/[a-zA-Z]/.test(collapsed)) return null

  collapsed = stripEdgePunctuation(collapsed)
  if (!collapsed || collapsed.length > 80) return null
  if (!/[a-zA-Z]/.test(collapsed)) return null
  return collapsed
}

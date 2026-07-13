import type { IterationSibling, WritingSubmitListItem } from '../types'

export interface GroupedSubmitListItem extends WritingSubmitListItem {
  /** 该写作链包含的版本数 */
  versionCount: number
  /** 所有版本 id，按 v1 → vN 排序 */
  allVersionIds: string[]
  /** 列表侧各版本元数据（比详情 iterations 更完整） */
  allVersions: IterationSibling[]
}

function sortVersions(versions: WritingSubmitListItem[]): WritingSubmitListItem[] {
  return [...versions].sort((a, b) => {
    const numDiff = (a.iterationNumber ?? 1) - (b.iterationNumber ?? 1)
    if (numDiff !== 0) return numDiff
    return a.submittedAt.localeCompare(b.submittedAt)
  })
}

function toGroupedItem(versions: WritingSubmitListItem[]): GroupedSubmitListItem {
  const sorted = sortVersions(versions)
  const latest = sorted[sorted.length - 1]
  const allVersions: IterationSibling[] = sorted.map((item, index) => ({
    id: item.id,
    iterationNumber: item.iterationNumber ?? index + 1,
    aiScore: item.aiScore,
    submittedAt: item.submittedAt,
  }))
  return {
    ...latest,
    versionCount: sorted.length,
    allVersionIds: sorted.map((item) => item.id),
    allVersions,
  }
}

function buildTitleKey(item: WritingSubmitListItem): string {
  return `${item.topicType}::${item.title.trim().toLowerCase()}`
}

/** 同一题目+标题下存在第 2 版及以上时，视为同一写作链 */
function shouldMergeAsVersionChain(versions: WritingSubmitListItem[]): boolean {
  if (versions.length < 2) return false
  return versions.some((item) => (item.iterationNumber ?? 1) > 1)
}

/**
 * 将提交列表按写作链合并：列表里每个链只保留一条（默认最新版）。
 * 优先用 iterationGroupId；若列表接口未返回，则按题目类型+标题回退合并。
 */
export function groupSubmitListItems(items: WritingSubmitListItem[]): GroupedSubmitListItem[] {
  const groupMap = new Map<string, WritingSubmitListItem[]>()
  const standalone: WritingSubmitListItem[] = []

  for (const item of items) {
    if (item.iterationGroupId) {
      const bucket = groupMap.get(item.iterationGroupId) ?? []
      bucket.push(item)
      groupMap.set(item.iterationGroupId, bucket)
      continue
    }
    standalone.push(item)
  }

  const grouped: GroupedSubmitListItem[] = []

  for (const versions of groupMap.values()) {
    grouped.push(toGroupedItem(versions))
  }

  const titleBuckets = new Map<string, WritingSubmitListItem[]>()
  for (const item of standalone) {
    const key = buildTitleKey(item)
    const bucket = titleBuckets.get(key) ?? []
    bucket.push(item)
    titleBuckets.set(key, bucket)
  }

  for (const versions of titleBuckets.values()) {
    if (shouldMergeAsVersionChain(versions)) {
      grouped.push(toGroupedItem(versions))
      continue
    }

    for (const item of versions) {
      grouped.push({
        ...item,
        versionCount: 1,
        allVersionIds: [item.id],
        allVersions: [
          {
            id: item.id,
            iterationNumber: item.iterationNumber ?? 1,
            aiScore: item.aiScore,
            submittedAt: item.submittedAt,
          },
        ],
      })
    }
  }

  return grouped.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

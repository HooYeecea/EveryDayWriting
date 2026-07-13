const GRADING_PREVIEW_KEY = 'ew_grading_preview'
const MAX_ENTRIES = 50

export type GradingStageKey = 'grammar' | 'evaluation' | 'vocabulary'

export interface GradingPreview {
  grammar?: string
  evaluation?: string
  vocabulary?: string
  savedAt: string
}

type GradingPreviewMap = Record<string, GradingPreview>

function readAll(): GradingPreviewMap {
  try {
    const raw = localStorage.getItem(GRADING_PREVIEW_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as GradingPreviewMap
  } catch {
    return {}
  }
}

function writeAll(map: GradingPreviewMap): void {
  const entries = Object.entries(map).sort(
    (a, b) => new Date(b[1].savedAt).getTime() - new Date(a[1].savedAt).getTime(),
  )
  const trimmed = Object.fromEntries(entries.slice(0, MAX_ENTRIES))
  localStorage.setItem(GRADING_PREVIEW_KEY, JSON.stringify(trimmed))
}

export function saveGradingPreview(
  submitId: string,
  contents: Partial<Record<GradingStageKey, string>>,
): void {
  const filtered = Object.fromEntries(
    Object.entries(contents).filter(([, value]) => typeof value === 'string' && value.trim()),
  ) as Partial<Record<GradingStageKey, string>>

  if (Object.keys(filtered).length === 0) return

  const map = readAll()
  map[submitId] = {
    ...map[submitId],
    ...filtered,
    savedAt: new Date().toISOString(),
  }
  writeAll(map)
}

export function loadGradingPreview(submitId: string): GradingPreview | null {
  return readAll()[submitId] ?? null
}

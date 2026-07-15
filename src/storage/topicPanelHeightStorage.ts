const TOPIC_PANEL_HEIGHT_KEY = 'ew_writing_topic_panel_height'

export function loadTopicPanelHeight(): number | null {
  try {
    const raw = localStorage.getItem(TOPIC_PANEL_HEIGHT_KEY)
    if (raw == null) return null
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function saveTopicPanelHeight(height: number): void {
  localStorage.setItem(TOPIC_PANEL_HEIGHT_KEY, String(Math.round(height)))
}

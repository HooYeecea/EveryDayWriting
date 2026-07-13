import { API_PATHS } from './config'
import { del } from './request'

export async function deleteAiMemory(): Promise<{ deletedCount: number }> {
  return del<{ deletedCount: number }>(API_PATHS.privacy.aiMemory)
}

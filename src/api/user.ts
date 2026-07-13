import { API_PATHS } from './config'
import { put, uploadForm } from './request'

export async function updateUserProfile(payload: {
  nickname?: string
  avatar?: string
}): Promise<{ nickname: string; avatar: string | null }> {
  return put(API_PATHS.user.profile, payload)
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return uploadForm<{ url: string }>(API_PATHS.files.upload, formData)
}

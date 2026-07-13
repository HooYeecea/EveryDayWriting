import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { updateUserProfile, uploadFile } from '../../api/user'
import { useAuth } from '../../context/AuthContext'
import { resolveAssetUrl } from '../../utils/assetUrl'
import { getAvatarLabel } from '../../utils/authValidation'

export function UserProfileEditor() {
  const { user, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? '')
  const [avatarError, setAvatarError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!user) return null

  const displayAvatar = avatarError ? null : resolveAssetUrl(avatarUrl)
  const avatarLabel = getAvatarLabel({ nickname: nickname || user.nickname, avatar: avatarUrl || null })

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setMessage('')
    try {
      const { url } = await uploadFile(file)
      setAvatarUrl(url)
      setAvatarError(false)
      setMessage('头像已上传，点击保存资料生效')
    } catch (err) {
      setError(err instanceof Error ? err.message : '头像上传失败')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!nickname.trim()) {
      setError('昵称不能为空')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      await updateUserProfile({
        nickname: nickname.trim(),
        avatar: avatarUrl || undefined,
      })
      await refreshProfile()
      setMessage('资料已更新')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-sm font-medium text-neutral-900">编辑资料</h3>
      <p className="mt-1 text-xs text-neutral-400">修改昵称或上传头像</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-lg font-semibold text-white"
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={nickname}
                className="h-full w-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              avatarLabel
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p className="text-xs leading-relaxed text-neutral-500">
            支持 jpg / png / webp，最大 2MB
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">昵称</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? '保存中…' : '保存资料'}
        </button>
      </form>
    </section>
  )
}

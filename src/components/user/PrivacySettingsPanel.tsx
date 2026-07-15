import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { getAgreementStatus } from '../../api/agreements'
import { deleteAiMemory } from '../../api/privacy'
import type { AgreementStatusItem } from '../../api/agreements'
import { useAppConfirm } from '../../context/AppConfirmContext'

export function PrivacySettingsPanel() {
  const { confirm } = useAppConfirm()
  const [agreements, setAgreements] = useState<AgreementStatusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getAgreementStatus()
      .then(setAgreements)
      .catch((err) => setError(err instanceof Error ? err.message : '加载协议状态失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleClearAiMemory = async () => {
    const ok = await confirm({
      title: '清除 AI 记忆',
      message: '确定清除所有 AI 建议追问记录？此操作不可恢复。',
      confirmLabel: '清除',
      variant: 'warning',
    })
    if (!ok) return

    setClearing(true)
    setError('')
    setMessage('')
    try {
      const result = await deleteAiMemory()
      setMessage(`已清除 ${result.deletedCount} 条 AI 对话记忆`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '清除失败')
    } finally {
      setClearing(false)
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-neutral-500" />
        <h3 className="text-sm font-medium text-neutral-900">隐私与数据</h3>
      </div>

      {loading && <p className="mt-4 text-sm text-neutral-400">加载中…</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-green-700">{message}</p>}

      {!loading && agreements.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-neutral-500">协议接受状态</h4>
          <ul className="mt-2 space-y-2">
            {agreements.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
              >
                <span className="text-neutral-700">
                  {item.title} v{item.version}
                </span>
                <span
                  className={`text-xs ${item.accepted ? 'text-green-700' : 'text-amber-600'}`}
                >
                  {item.accepted ? '已接受' : '未接受'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
        <p className="text-sm text-neutral-700">清除 AI 建议追问记录</p>
        <p className="mt-1 text-xs text-neutral-500">
          将删除写作记录中针对 AI 建议的所有追问对话，不影响作文本身。
        </p>
        <button
          type="button"
          onClick={() => void handleClearAiMemory()}
          disabled={clearing}
          className="mt-3 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {clearing ? '清除中…' : '清除 AI 对话记忆'}
        </button>
      </div>
    </section>
  )
}
